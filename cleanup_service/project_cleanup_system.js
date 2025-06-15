#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProjectCleanupAutomation {
    constructor(projectRoot = '.') {
        this.projectRoot = path.resolve(projectRoot);
        this.config = {
            // Analysis patterns for different file types
            patterns: {
                source: /\.(js|ts|jsx|tsx|py|java|cpp|c|h)$/,
                config: /\.(json|yaml|yml|toml|ini|conf)$/,
                documentation: /\.(md|txt|rst|adoc)$/,
                tests: /\.(test|spec)\.(js|ts|jsx|tsx|py)$/,
                build: /\.(dockerfile|makefile|gulpfile|webpack|rollup)$/i
            },
            // Directories to analyze for cleanup
            analysisTargets: [
                'src', 'tests', 'docs', 'scripts', 'utils', 'services',
                'controllers', 'config', 'public', 'temp', 'reports'
            ],
            // Files/folders never to remove
            protectedPatterns: [
                /package\.json$/,
                /package-lock\.json$/,
                /yarn\.lock$/,
                /\.git/,
                /node_modules/,
                /\.env/,
                /README/i
            ],
            // Minimum file age for deletion (days)
            minAgeForDeletion: 30,
            // Backup directory
            backupDir: '.cleanup-backup'
        };
        this.analysisResults = {
            architecture: {},
            dependencies: {},
            obsoleteFiles: [],
            recommendations: []
        };
    }

    // Phase 1: Project Architecture Analysis
    async analyzeProjectArchitecture() {
        console.log('🔍 Phase 1: Analyzing project architecture...');
        
        const architecture = {
            structure: await this.mapDirectoryStructure(),
            dependencies: await this.analyzeDependencies(),
            imports: await this.analyzeImportRelationships(),
            tests: await this.analyzeTestCoverage(),
            configs: await this.analyzeConfigurations()
        };

        this.analysisResults.architecture = architecture;
        return architecture;
    }

    async mapDirectoryStructure() {
        const structure = {};
        
        async function traverse(dir, currentStructure) {
            try {
                const items = await fs.readdir(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isDirectory()) {
                        currentStructure[item] = {
                            type: 'directory',
                            path: fullPath,
                            size: 0,
                            files: {},
                            lastModified: stats.mtime
                        };
                        await traverse(fullPath, currentStructure[item].files);
                    } else {
                        currentStructure[item] = {
                            type: 'file',
                            path: fullPath,
                            size: stats.size,
                            extension: path.extname(item),
                            lastModified: stats.mtime,
                            lastAccessed: stats.atime
                        };
                    }
                }
            } catch (error) {
                console.warn(`⚠️  Cannot access directory: ${dir}`);
            }
        }

        await traverse(this.projectRoot, structure);
        return structure;
    }

    async analyzeDependencies() {
        const dependencies = {
            package: {},
            imports: new Map(),
            unused: []
        };

        try {
            // Analyze package.json dependencies
            const packagePath = path.join(this.projectRoot, 'package.json');
            const packageContent = await fs.readFile(packagePath, 'utf8');
            const packageData = JSON.parse(packageContent);
            
            dependencies.package = {
                dependencies: packageData.dependencies || {},
                devDependencies: packageData.devDependencies || {},
                peerDependencies: packageData.peerDependencies || {}
            };

        } catch (error) {
            console.warn('⚠️  No package.json found or invalid format');
        }

        return dependencies;
    }

    async analyzeImportRelationships() {
        const imports = new Map();
        const exports = new Map();
        
        async function analyzeFile(filePath) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                const fileImports = [];
                const fileExports = [];

                // Extract imports (ES6, CommonJS, TypeScript)
                const importPatterns = [
                    /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
                    /require\(['"`]([^'"`]+)['"`]\)/g,
                    /import\(['"`]([^'"`]+)['"`]\)/g
                ];

                importPatterns.forEach(pattern => {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        fileImports.push(match[1]);
                    }
                });

                // Extract exports
                const exportPatterns = [
                    /export\s+.*?from\s+['"`]([^'"`]+)['"`]/g,
                    /module\.exports\s*=/g,
                    /exports\./g
                ];

                exportPatterns.forEach(pattern => {
                    if (pattern.test(content)) {
                        fileExports.push(filePath);
                    }
                });

                imports.set(filePath, fileImports);
                if (fileExports.length > 0) {
                    exports.set(filePath, fileExports);
                }

            } catch (error) {
                console.warn(`⚠️  Cannot analyze file: ${filePath}`);
            }
        }

        // Analyze all source files
        await this.walkDirectory(this.projectRoot, async (filePath) => {
            if (this.config.patterns.source.test(filePath)) {
                await analyzeFile(filePath);
            }
        });

        return { imports, exports };
    }

    async analyzeTestCoverage() {
        const testAnalysis = {
            testFiles: [],
            testedFiles: new Set(),
            untestedFiles: []
        };

        await this.walkDirectory(this.projectRoot, async (filePath) => {
            if (this.config.patterns.tests.test(filePath)) {
                testAnalysis.testFiles.push(filePath);
                
                // Analyze which files are being tested
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    const importMatches = content.match(/from\s+['"`]([^'"`]+)['"`]/g) || [];
                    
                    importMatches.forEach(match => {
                        const importPath = match.replace(/from\s+['"`]([^'"`]+)['"`]/, '$1');
                        if (!importPath.startsWith('.')) return;
                        
                        const resolvedPath = path.resolve(path.dirname(filePath), importPath);
                        testAnalysis.testedFiles.add(resolvedPath);
                    });
                } catch (error) {
                    console.warn(`⚠️  Cannot analyze test file: ${filePath}`);
                }
            }
        });

        return testAnalysis;
    }

    async analyzeConfigurations() {
        const configs = [];
        
        await this.walkDirectory(this.projectRoot, async (filePath) => {
            if (this.config.patterns.config.test(filePath)) {
                try {
                    const stats = await fs.stat(filePath);
                    configs.push({
                        path: filePath,
                        lastModified: stats.mtime,
                        size: stats.size
                    });
                } catch (error) {
                    console.warn(`⚠️  Cannot analyze config: ${filePath}`);
                }
            }
        });

        return configs;
    }

    // Phase 2: Obsolescence Detection
    async detectObsoleteFiles() {
        console.log('🕵️  Phase 2: Detecting obsolete files...');
        
        const obsoleteFiles = [];
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - (this.config.minAgeForDeletion * 24 * 60 * 60 * 1000));

        await this.walkDirectory(this.projectRoot, async (filePath) => {
            // Skip protected files
            if (this.isProtectedFile(filePath)) return;

            try {
                const stats = await fs.stat(filePath);
                const relativePath = path.relative(this.projectRoot, filePath);
                
                const obsolescenceFactors = {
                    ageScore: this.calculateAgeScore(stats.mtime, cutoffDate),
                    usageScore: await this.calculateUsageScore(filePath),
                    dependencyScore: this.calculateDependencyScore(filePath),
                    testScore: this.calculateTestScore(filePath),
                    configScore: this.calculateConfigScore(filePath)
                };

                const totalScore = Object.values(obsolescenceFactors).reduce((sum, score) => sum + score, 0);
                
                if (totalScore > 3) { // Threshold for obsolescence
                    obsoleteFiles.push({
                        path: filePath,
                        relativePath,
                        scores: obsolescenceFactors,
                        totalScore,
                        lastModified: stats.mtime,
                        size: stats.size,
                        reason: this.determineObsolescenceReason(obsolescenceFactors)
                    });
                }

            } catch (error) {
                console.warn(`⚠️  Cannot analyze file: ${filePath}`);
            }
        });

        this.analysisResults.obsoleteFiles = obsoleteFiles.sort((a, b) => b.totalScore - a.totalScore);
        return this.analysisResults.obsoleteFiles;
    }

    calculateAgeScore(lastModified, cutoffDate) {
        return lastModified < cutoffDate ? 2 : 0;
    }

    async calculateUsageScore(filePath) {
        // Check if file is imported/required by other files
        const { imports } = this.analysisResults.architecture.imports || { imports: new Map() };
        
        for (const [, fileImports] of imports) {
            if (fileImports.some(imp => imp.includes(path.basename(filePath, path.extname(filePath))))) {
                return 0; // File is used
            }
        }
        return 2; // File appears unused
    }

    calculateDependencyScore(filePath) {
        // Files in temp, cache, or build directories are more likely obsolete
        const pathSegments = filePath.split(path.sep);
        const obsoleteProneDirs = ['temp', 'tmp', 'cache', 'build', 'dist', 'reports'];
        
        if (pathSegments.some(segment => obsoleteProneDirs.includes(segment.toLowerCase()))) {
            return 1;
        }
        return 0;
    }

    calculateTestScore(filePath) {
        // Test files without corresponding source files might be obsolete
        if (this.config.patterns.tests.test(filePath)) {
            const sourceFile = filePath.replace(/\.(test|spec)\./, '.');
            try {
                require('fs').accessSync(sourceFile);
                return 0; // Source file exists
            } catch {
                return 1; // Source file doesn't exist
            }
        }
        return 0;
    }

    calculateConfigScore(filePath) {
        // Old config files might be obsolete
        if (this.config.patterns.config.test(filePath)) {
            const stats = require('fs').statSync(filePath);
            const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceModified > 90 ? 1 : 0;
        }
        return 0;
    }

    determineObsolescenceReason(scores) {
        const reasons = [];
        if (scores.ageScore > 0) reasons.push('Old file');
        if (scores.usageScore > 0) reasons.push('Unused');
        if (scores.dependencyScore > 0) reasons.push('In temporary directory');
        if (scores.testScore > 0) reasons.push('Orphaned test');
        if (scores.configScore > 0) reasons.push('Stale configuration');
        return reasons.join(', ');
    }

    // Phase 3: Safe Removal with Backup
    async performSafeCleanup(dryRun = true) {
        console.log(`🧹 Phase 3: ${dryRun ? 'Simulating' : 'Performing'} safe cleanup...`);
        
        if (!dryRun) {
            await this.createBackup();
        }

        const cleanupResults = {
            removed: [],
            errors: [],
            spaceFreed: 0
        };

        for (const file of this.analysisResults.obsoleteFiles) {
            try {
                if (dryRun) {
                    console.log(`🗑️  Would remove: ${file.relativePath} (${file.reason})`);
                    cleanupResults.removed.push(file.relativePath);
                    cleanupResults.spaceFreed += file.size;
                } else {
                    await fs.unlink(file.path);
                    console.log(`✅ Removed: ${file.relativePath}`);
                    cleanupResults.removed.push(file.relativePath);
                    cleanupResults.spaceFreed += file.size;
                }
            } catch (error) {
                const errorMsg = `❌ Failed to remove ${file.relativePath}: ${error.message}`;
                console.error(errorMsg);
                cleanupResults.errors.push(errorMsg);
            }
        }

        // Remove empty directories
        await this.removeEmptyDirectories(dryRun);

        return cleanupResults;
    }

    async createBackup() {
        console.log('💾 Creating backup...');
        const backupPath = path.join(this.projectRoot, this.config.backupDir);
        
        try {
            await fs.mkdir(backupPath, { recursive: true });
            
            for (const file of this.analysisResults.obsoleteFiles) {
                const relativePath = path.relative(this.projectRoot, file.path);
                const backupFilePath = path.join(backupPath, relativePath);
                const backupDir = path.dirname(backupFilePath);
                
                await fs.mkdir(backupDir, { recursive: true });
                await fs.copyFile(file.path, backupFilePath);
            }
            
            console.log(`✅ Backup created at: ${backupPath}`);
        } catch (error) {
            throw new Error(`Failed to create backup: ${error.message}`);
        }
    }

    async removeEmptyDirectories(dryRun = true) {
        const emptyDirs = [];
        
        await this.walkDirectory(this.projectRoot, async (dirPath, isDirectory) => {
            if (!isDirectory) return;
            
            try {
                const items = await fs.readdir(dirPath);
                if (items.length === 0 && !this.isProtectedFile(dirPath)) {
                    emptyDirs.push(dirPath);
                }
            } catch (error) {
                // Directory might have been removed already
            }
        });

        for (const dir of emptyDirs) {
            try {
                if (dryRun) {
                    console.log(`📁 Would remove empty directory: ${path.relative(this.projectRoot, dir)}`);
                } else {
                    await fs.rmdir(dir);
                    console.log(`✅ Removed empty directory: ${path.relative(this.projectRoot, dir)}`);
                }
            } catch (error) {
                console.warn(`⚠️  Cannot remove directory ${dir}: ${error.message}`);
            }
        }
    }

    // Phase 4: Generate Report
    async generateCleanupReport(results) {
        console.log('📊 Phase 4: Generating cleanup report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFilesAnalyzed: Object.keys(this.analysisResults.architecture.structure).length,
                obsoleteFilesFound: this.analysisResults.obsoleteFiles.length,
                filesRemoved: results.removed.length,
                spaceFreed: this.formatBytes(results.spaceFreed),
                errors: results.errors.length
            },
            details: {
                architecture: this.analysisResults.architecture,
                obsoleteFiles: this.analysisResults.obsoleteFiles,
                cleanupResults: results
            },
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(this.projectRoot, 'cleanup-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Detailed report saved to: cleanup-report.json`);
        this.displaySummary(report.summary);
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Architecture recommendations
        if (this.analysisResults.obsoleteFiles.length > 50) {
            recommendations.push({
                type: 'maintenance',
                priority: 'high',
                message: 'Consider implementing automated cleanup in CI/CD pipeline'
            });
        }

        // Test coverage recommendations
        const testFiles = this.analysisResults.architecture.tests?.testFiles?.length || 0;
        if (testFiles < 10) {
            recommendations.push({
                type: 'testing',
                priority: 'medium',
                message: 'Low test coverage detected - consider adding more tests'
            });
        }

        // Dependency recommendations
        const unusedDeps = this.analysisResults.architecture.dependencies?.unused?.length || 0;
        if (unusedDeps > 0) {
            recommendations.push({
                type: 'dependencies',
                priority: 'medium',
                message: `${unusedDeps} unused dependencies found - consider removing`
            });
        }

        return recommendations;
    }

    displaySummary(summary) {
        console.log('\n📈 CLEANUP SUMMARY');
        console.log('==================');
        console.log(`📁 Files analyzed: ${summary.totalFilesAnalyzed}`);
        console.log(`🗑️  Obsolete files: ${summary.obsoleteFilesFound}`);
        console.log(`✅ Files removed: ${summary.filesRemoved}`);
        console.log(`💾 Space freed: ${summary.spaceFreed}`);
        console.log(`❌ Errors: ${summary.errors}`);
        console.log('==================\n');
    }

    // Utility methods
    async walkDirectory(dir, callback) {
        try {
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stats = await fs.stat(fullPath);
                
                if (stats.isDirectory()) {
                    await callback(fullPath, true);
                    await this.walkDirectory(fullPath, callback);
                } else {
                    await callback(fullPath, false);
                }
            }
        } catch (error) {
            console.warn(`⚠️  Cannot walk directory: ${dir}`);
        }
    }

    isProtectedFile(filePath) {
        return this.config.protectedPatterns.some(pattern => pattern.test(filePath));
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Main execution method
    async execute(options = {}) {
        const { dryRun = true, verbose = true } = options;
        
        try {
            console.log('🚀 Starting automated project cleanup...\n');
            
            // Phase 1: Architecture Analysis
            await this.analyzeProjectArchitecture();
            
            // Phase 2: Obsolescence Detection
            await this.detectObsoleteFiles();
            
            // Phase 3: Safe Cleanup
            const results = await this.performSafeCleanup(dryRun);
            
            // Phase 4: Report Generation
            await this.generateCleanupReport(results);
            
            console.log('🎉 Cleanup automation completed successfully!');
            
            if (dryRun) {
                console.log('\n💡 This was a dry run. To perform actual cleanup, run with dryRun: false');
            }
            
            return results;
            
        } catch (error) {
            console.error('💥 Cleanup automation failed:', error.message);
            throw error;
        }
    }
}

// Export for module usage
module.exports = ProjectCleanupAutomation;

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');
    const verbose = args.includes('--verbose');
    const projectPath = args.find(arg => !arg.startsWith('--')) || '.';
    
    const cleanup = new ProjectCleanupAutomation(projectPath);
    cleanup.execute({ dryRun, verbose }).catch(console.error);
}