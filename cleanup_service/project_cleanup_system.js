#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class ProjectCleanupAutomation {
    constructor(projectRoot = '.') {
        this.projectRoot = path.resolve(projectRoot);
        
        // Default configuration
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
            backupDir: '.cleanup-backup',
            // Report output
            reportFile: 'cleanup-report.json',
            reportHtmlFile: 'cleanup-report.html'
        };
        
        // Load user configuration if available
        this.loadConfiguration();
        
        this.analysisResults = {
            architecture: {},
            dependencies: {},
            obsoleteFiles: [],
            recommendations: [],
            cleanupResults: null,
            report: {}
        };
        this.externalArchitectureData = null;
    }
    
    /**
     * Load configuration from .cleanup-config.json if available
     */
    async loadConfiguration() {
        const configPath = path.join(this.projectRoot, '.cleanup-config.json');
        
        try {
            const configExists = await fs.access(configPath).then(() => true).catch(() => false);
            
            if (configExists) {
                console.log('⚙️  Loading custom configuration from .cleanup-config.json');
                const configContent = await fs.readFile(configPath, 'utf8');
                const userConfig = JSON.parse(configContent);
                
                // Merge user configuration with defaults
                this.config = {
                    ...this.config,
                    ...userConfig,
                    // Special handling for patterns which may be regular expressions
                    patterns: {
                        ...this.config.patterns,
                        ...(userConfig.patterns || {})
                    }
                };
                
                // Convert string patterns to RegExp if provided as strings
                if (userConfig.protectedPatterns) {
                    this.config.protectedPatterns = userConfig.protectedPatterns.map(pattern => {
                        if (typeof pattern === 'string') {
                            // Convert glob-like patterns to RegExp
                            return new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
                        }
                        return pattern;
                    });
                }
                
                console.log('✅ Custom configuration loaded');
            } else {
                console.log('⚙️  Using default configuration (no .cleanup-config.json found)');
            }
        } catch (error) {
            console.warn('⚠️  Error loading configuration:', error.message);
            console.log('⚙️  Using default configuration');
        }
    }

    /**
     * Set architecture data from ProjectMappingSystem
     * @param {Object} architectureData - The architecture data from ProjectMappingSystem
     */
    setArchitectureData(architectureData) {
        this.externalArchitectureData = architectureData;
        console.log('📊 Using external architecture data for analysis');
        return this;
    }

    // Phase 1: Project Architecture Analysis
    async analyzeProjectArchitecture() {
        console.log('🔍 Phase 1: Analyzing project architecture...');
        
        let architecture;
        
        // If we have external architecture data from ProjectMappingSystem, use it
        if (this.externalArchitectureData) {
            console.log('🔄 Using pre-generated architecture mapping');
            
            // Convert the external architecture data format to our internal format
            architecture = {
                structure: this.convertExternalStructure(this.externalArchitectureData.structure),
                dependencies: this.convertExternalDependencies(this.externalArchitectureData.dependencies),
                imports: await this.analyzeImportRelationships(), // Still analyze imports for consistency
                tests: this.extractTestsFromExternalData(this.externalArchitectureData),
                configs: this.extractConfigsFromExternalData(this.externalArchitectureData)
            };
        } else {
            // Perform our own analysis if no external data is available
            console.log('🔍 Performing full architecture analysis');
            architecture = {
                structure: await this.mapDirectoryStructure(),
                dependencies: await this.analyzeDependencies(),
                imports: await this.analyzeImportRelationships(),
                tests: await this.analyzeTestCoverage(),
                configs: await this.analyzeConfigurations()
            };
        }

        this.analysisResults.architecture = architecture;
        return architecture;
    }
    
    /**
     * Convert external structure format to internal format
     * @param {Object} externalStructure - Structure from ProjectMappingSystem
     */
    convertExternalStructure(externalStructure) {
        const structure = {};
        
        // Recursive function to convert structure format
        const convertStructure = (extStruct, intStruct) => {
            for (const [key, value] of Object.entries(extStruct)) {
                if (value.type === 'directory') {
                    intStruct[key] = {
                        type: 'directory',
                        path: value.path,
                        size: value.size || 0,
                        files: {},
                        lastModified: value.modified || new Date()
                    };
                    
                    // Convert children recursively
                    if (value.files) {
                        convertStructure(value.files, intStruct[key].files);
                    }
                } else if (value.type === 'file') {
                    intStruct[key] = {
                        type: 'file',
                        path: value.path,
                        size: value.size || 0,
                        extension: value.extension || path.extname(key),
                        lastModified: value.modified || new Date(),
                        lastAccessed: value.accessed || new Date()
                    };
                }
            }
        };
        
        convertStructure(externalStructure, structure);
        return structure;
    }
    
    /**
     * Convert external dependencies to internal format
     * @param {Object} externalDependencies - Dependencies from ProjectMappingSystem
     */
    convertExternalDependencies(externalDependencies) {
        const dependencies = {
            package: {},
            imports: new Map(),
            unused: []
        };
        
        // Convert package dependencies
        if (externalDependencies.external) {
            const deps = {};
            const devDeps = {};
            
            externalDependencies.external.forEach((value, key) => {
                if (value.type === 'production') {
                    deps[key] = value.version;
                } else if (value.type === 'development') {
                    devDeps[key] = value.version;
                }
            });
            
            dependencies.package = {
                dependencies: deps,
                devDependencies: devDeps,
                peerDependencies: {}
            };
        }
        
        // Convert internal dependencies
        if (externalDependencies.internal) {
            externalDependencies.internal.forEach((value, key) => {
                dependencies.imports.set(key, value);
            });
        }
        
        // Add orphaned files as unused
        if (externalDependencies.orphaned) {
            dependencies.unused = externalDependencies.orphaned;
        }
        
        return dependencies;
    }
    
    /**
     * Extract test information from external architecture data
     * @param {Object} externalData - External architecture data
     */
    extractTestsFromExternalData(externalData) {
        const testAnalysis = {
            testFiles: [],
            testedFiles: new Set(),
            untestedFiles: []
        };
        
        // Helper function to recursively find test files
        const findTestFiles = (structure, basePath = '') => {
            for (const [name, item] of Object.entries(structure)) {
                const itemPath = path.join(basePath, name);
                
                if (item.type === 'file' && this.config.patterns.tests.test(name)) {
                    testAnalysis.testFiles.push(item.path);
                    
                    // If we have analysis data, extract tested files
                    if (item.analysis && item.analysis.imports) {
                        item.analysis.imports.forEach(importPath => {
                            if (!importPath.startsWith('.')) return;
                            
                            const resolvedPath = path.resolve(path.dirname(item.path), importPath);
                            testAnalysis.testedFiles.add(resolvedPath);
                        });
                    }
                } else if (item.type === 'directory' && item.files) {
                    findTestFiles(item.files, itemPath);
                }
            }
        };
        
        // Find test files in the structure
        if (externalData.structure) {
            findTestFiles(externalData.structure);
        }
        
        return testAnalysis;
    }
    
    /**
     * Extract config information from external architecture data
     * @param {Object} externalData - External architecture data
     */
    extractConfigsFromExternalData(externalData) {
        const configs = [];
        
        // Helper function to recursively find config files
        const findConfigFiles = (structure, basePath = '') => {
            for (const [name, item] of Object.entries(structure)) {
                const itemPath = path.join(basePath, name);
                
                if (item.type === 'file' && this.config.patterns.config.test(name)) {
                    configs.push({
                        path: item.path,
                        lastModified: item.modified || new Date(),
                        size: item.size || 0
                    });
                } else if (item.type === 'directory' && item.files) {
                    findConfigFiles(item.files, itemPath);
                }
            }
        };
        
        // Find config files in the structure
        if (externalData.structure) {
            findConfigFiles(externalData.structure);
        }
        
        return configs;
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
            spaceFreed: 0,
            timestamp: new Date().toISOString(),
            dryRun: dryRun
        };

        for (const file of this.analysisResults.obsoleteFiles) {
            try {
                if (dryRun) {
                    console.log(`🗑️  Would remove: ${file.relativePath} (${file.reason})`);
                    cleanupResults.removed.push({
                        path: file.relativePath,
                        size: file.size,
                        reason: file.reason,
                        scores: file.scores
                    });
                    cleanupResults.spaceFreed += file.size;
                } else {
                    await fs.unlink(file.path);
                    console.log(`✅ Removed: ${file.relativePath}`);
                    cleanupResults.removed.push({
                        path: file.relativePath,
                        size: file.size,
                        reason: file.reason,
                        scores: file.scores
                    });
                    cleanupResults.spaceFreed += file.size;
                }
            } catch (error) {
                const errorMsg = `❌ Failed to remove ${file.relativePath}: ${error.message}`;
                console.error(errorMsg);
                cleanupResults.errors.push({
                    path: file.relativePath,
                    error: error.message
                });
            }
        }

        // Remove empty directories
        const emptyDirs = await this.removeEmptyDirectories(dryRun);
        cleanupResults.emptyDirectoriesRemoved = emptyDirs;
        
        // Store cleanup results for reporting
        this.analysisResults.cleanupResults = cleanupResults;

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

    // Phase 4: Generate Comprehensive Report
    async generateComprehensiveReport() {
        console.log('📊 Phase 4: Generating comprehensive report...');
        
        // Ensure we have cleanup results
        if (!this.analysisResults.cleanupResults) {
            console.warn('⚠️  No cleanup results available. Run performSafeCleanup first.');
            return { error: 'No cleanup results available' };
        }
        
        const results = this.analysisResults.cleanupResults;
        
        // Generate the report object
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFilesAnalyzed: Object.keys(this.analysisResults.architecture.structure || {}).length,
                obsoleteFilesFound: this.analysisResults.obsoleteFiles.length,
                filesRemoved: results.removed.length,
                spaceFreed: results.spaceFreed,
                spaceFreedFormatted: this.formatBytes(results.spaceFreed),
                errors: results.errors.length,
                dryRun: results.dryRun
            },
            details: {
                architecture: {
                    fileCount: this.countFiles(this.analysisResults.architecture.structure),
                    directoryCount: this.countDirectories(this.analysisResults.architecture.structure),
                    testFiles: this.analysisResults.architecture.tests?.testFiles?.length || 0,
                    configFiles: this.analysisResults.architecture.configs?.length || 0
                },
                obsoleteFiles: this.analysisResults.obsoleteFiles.map(file => ({
                    path: file.relativePath,
                    size: file.size,
                    reason: file.reason,
                    scores: file.scores,
                    lastModified: file.lastModified
                })),
                cleanupResults: {
                    removed: results.removed,
                    errors: results.errors,
                    emptyDirectoriesRemoved: results.emptyDirectoriesRemoved || []
                }
            },
            recommendations: this.generateRecommendations(),
            architecturalInsights: this.generateArchitecturalInsights()
        };
        
        // Store the report in analysis results
        this.analysisResults.report = report;
        
        // Save JSON report
        const jsonReportPath = path.join(this.projectRoot, this.config.reportFile);
        await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2));
        console.log(`📋 JSON report saved to: ${this.config.reportFile}`);
        
        // Generate and save HTML report
        const htmlReportPath = path.join(this.projectRoot, this.config.reportHtmlFile);
        const htmlContent = this.generateHtmlReport(report);
        await fs.writeFile(htmlReportPath, htmlContent);
        console.log(`💻 HTML report saved to: ${this.config.reportHtmlFile}`);
        
        // Display summary
        this.displaySummary(report.summary);
        
        return {
            report,
            outputPath: jsonReportPath,
            htmlPath: htmlReportPath
        };
    }
    
    /**
     * Generate architectural insights based on analysis
     */
    generateArchitecturalInsights() {
        const insights = [];
        
        // Analyze directory structure
        const structure = this.analysisResults.architecture.structure;
        if (structure) {
            // Check for overly nested directories
            const maxDepth = this.calculateMaxDepth(structure);
            if (maxDepth > 5) {
                insights.push({
                    type: 'structure',
                    severity: 'medium',
                    message: `Deep directory nesting detected (${maxDepth} levels). Consider flattening structure.`
                });
            }
            
            // Check for large directories
            const largeDirectories = this.findLargeDirectories(structure);
            if (largeDirectories.length > 0) {
                insights.push({
                    type: 'structure',
                    severity: 'medium',
                    message: `Large directories detected: ${largeDirectories.join(', ')}. Consider breaking them down.`,
                    details: largeDirectories
                });
            }
        }
        
        // Analyze dependencies
        const dependencies = this.analysisResults.architecture.dependencies;
        if (dependencies && dependencies.unused && dependencies.unused.length > 0) {
            insights.push({
                type: 'dependencies',
                severity: 'high',
                message: `${dependencies.unused.length} unused dependencies detected. Consider removing them.`,
                details: dependencies.unused
            });
        }
        
        return insights;
    }
    
    /**
     * Calculate maximum directory depth
     */
    calculateMaxDepth(structure, currentDepth = 0) {
        let maxDepth = currentDepth;
        
        for (const [, item] of Object.entries(structure)) {
            if (item.type === 'directory' && item.files) {
                const depth = this.calculateMaxDepth(item.files, currentDepth + 1);
                maxDepth = Math.max(maxDepth, depth);
            }
        }
        
        return maxDepth;
    }
    
    /**
     * Find directories with too many files
     */
    findLargeDirectories(structure, path = '', threshold = 30) {
        const largeDirectories = [];
        
        for (const [name, item] of Object.entries(structure)) {
            if (item.type === 'directory') {
                const dirPath = path ? `${path}/${name}` : name;
                const fileCount = this.countFiles(item.files);
                
                if (fileCount > threshold) {
                    largeDirectories.push(dirPath);
                }
                
                // Check subdirectories
                if (item.files) {
                    const subLargeDirectories = this.findLargeDirectories(item.files, dirPath, threshold);
                    largeDirectories.push(...subLargeDirectories);
                }
            }
        }
        
        return largeDirectories;
    }
    
    /**
     * Count files in a structure
     */
    countFiles(structure) {
        if (!structure) return 0;
        
        let count = 0;
        
        for (const [, item] of Object.entries(structure)) {
            if (item.type === 'file') {
                count++;
            } else if (item.type === 'directory' && item.files) {
                count += this.countFiles(item.files);
            }
        }
        
        return count;
    }
    
    /**
     * Count directories in a structure
     */
    countDirectories(structure) {
        if (!structure) return 0;
        
        let count = 0;
        
        for (const [, item] of Object.entries(structure)) {
            if (item.type === 'directory') {
                count++;
                if (item.files) {
                    count += this.countDirectories(item.files);
                }
            }
        }
        
        return count;
    }
    
    /**
     * Generate HTML report from report data
     */
    generateHtmlReport(report) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Cleanup Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 5px solid #007bff;
        }
        h1 {
            color: #007bff;
            margin-top: 0;
        }
        h2 {
            color: #495057;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 10px;
            margin-top: 30px;
        }
        .summary-box {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-item {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 15px;
            flex: 1;
            min-width: 200px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .summary-item h3 {
            margin-top: 0;
            color: #6c757d;
            font-size: 14px;
            text-transform: uppercase;
        }
        .summary-item p {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0 0;
            color: #007bff;
        }
        .warning {
            color: #dc3545;
        }
        .success {
            color: #28a745;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        tr:hover {
            background-color: #f8f9fa;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-warning {
            background-color: #fff3cd;
            color: #856404;
        }
        .badge-danger {
            background-color: #f8d7da;
            color: #721c24;
        }
        .badge-info {
            background-color: #d1ecf1;
            color: #0c5460;
        }
        .badge-success {
            background-color: #d4edda;
            color: #155724;
        }
        .recommendation {
            background-color: #f8f9fa;
            border-left: 4px solid #17a2b8;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 0 5px 5px 0;
        }
        .recommendation h4 {
            margin-top: 0;
            color: #17a2b8;
        }
        .recommendation p {
            margin-bottom: 0;
        }
        .high-priority {
            border-left-color: #dc3545;
        }
        .high-priority h4 {
            color: #dc3545;
        }
        .medium-priority {
            border-left-color: #fd7e14;
        }
        .medium-priority h4 {
            color: #fd7e14;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <header>
        <h1>Project Cleanup Report</h1>
        <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        ${report.summary.dryRun ? '<p class="badge badge-warning">DRY RUN MODE - No files were actually removed</p>' : ''}
    </header>

    <section>
        <h2>Summary</h2>
        <div class="summary-box">
            <div class="summary-item">
                <h3>Files Analyzed</h3>
                <p>${report.summary.totalFilesAnalyzed}</p>
            </div>
            <div class="summary-item">
                <h3>Obsolete Files</h3>
                <p>${report.summary.obsoleteFilesFound}</p>
            </div>
            <div class="summary-item">
                <h3>Files ${report.summary.dryRun ? 'To Remove' : 'Removed'}</h3>
                <p>${report.summary.filesRemoved}</p>
            </div>
            <div class="summary-item">
                <h3>Space ${report.summary.dryRun ? 'To Free' : 'Freed'}</h3>
                <p>${report.summary.spaceFreedFormatted}</p>
            </div>
            <div class="summary-item">
                <h3>Errors</h3>
                <p class="${report.summary.errors > 0 ? 'warning' : 'success'}">${report.summary.errors}</p>
            </div>
        </div>
    </section>

    <section>
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation ${rec.priority}-priority">
                <h4>${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}</h4>
                <p>${rec.message}</p>
            </div>
        `).join('')}
        
        ${report.architecturalInsights.map(insight => `
            <div class="recommendation ${insight.severity}-priority">
                <h4>${insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Insight</h4>
                <p>${insight.message}</p>
            </div>
        `).join('')}
    </section>

    <section>
        <h2>Obsolete Files</h2>
        ${report.details.obsoleteFiles.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th>File Path</th>
                        <th>Size</th>
                        <th>Reason</th>
                        <th>Last Modified</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.details.obsoleteFiles.map(file => `
                        <tr>
                            <td>${file.path}</td>
                            <td>${this.formatBytes(file.size)}</td>
                            <td>
                                <span class="badge badge-warning">${file.reason}</span>
                            </td>
                            <td>${new Date(file.lastModified).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        ` : '<p>No obsolete files detected.</p>'}
    </section>

    ${report.details.cleanupResults.errors.length > 0 ? `
        <section>
            <h2>Errors</h2>
            <table>
                <thead>
                    <tr>
                        <th>File Path</th>
                        <th>Error</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.details.cleanupResults.errors.map(err => `
                        <tr>
                            <td>${err.path}</td>
                            <td>
                                <span class="badge badge-danger">${err.error}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>
    ` : ''}

    <section>
        <h2>Architecture Details</h2>
        <div class="summary-box">
            <div class="summary-item">
                <h3>Total Files</h3>
                <p>${report.details.architecture.fileCount}</p>
            </div>
            <div class="summary-item">
                <h3>Total Directories</h3>
                <p>${report.details.architecture.directoryCount}</p>
            </div>
            <div class="summary-item">
                <h3>Test Files</h3>
                <p>${report.details.architecture.testFiles}</p>
            </div>
            <div class="summary-item">
                <h3>Config Files</h3>
                <p>${report.details.architecture.configFiles}</p>
            </div>
        </div>
    </section>

    <div class="footer">
        <p>Generated by Project Architecture Cleanup System</p>
    </div>
</body>
</html>`;
    }
    
    // Legacy method for backward compatibility
    async generateCleanupReport(results) {
        console.log('⚠️  generateCleanupReport is deprecated, use generateComprehensiveReport instead');
        return this.generateComprehensiveReport();
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
            // Check if we should analyze this directory based on analysisTargets configuration
            if (dir !== this.projectRoot) { // Always process the project root
                const relativePath = path.relative(this.projectRoot, dir);
                const dirName = path.basename(dir);
                
                // If analysisTargets is defined and not empty, check if this directory should be analyzed
                if (this.config.analysisTargets && this.config.analysisTargets.length > 0) {
                    // Check if this directory or any parent directory is in the analysis targets
                    const shouldAnalyze = this.config.analysisTargets.some(target => {
                        // Check if the directory itself matches a target
                        if (dirName === target) {
                            console.log(`✅ ANALYZING TARGET DIRECTORY: ${relativePath} (matches target: ${target})`);
                            return true;
                        }
                        
                        // Check if the directory is within a target path
                        // For example, if target is 'src' and dir is '/project/src/components'
                        const pathParts = relativePath.split(path.sep);
                        const isInTarget = pathParts.includes(target);
                        if (isInTarget) {
                            console.log(`✅ ANALYZING SUBDIRECTORY: ${relativePath} (within target: ${target})`);
                            return true;
                        }
                        return false;
                    });
                    
                    if (!shouldAnalyze) {
                        // Skip this directory as it's not in the analysis targets
                        console.log(`❌ SKIPPING DIRECTORY: ${relativePath} (not in targets: ${this.config.analysisTargets.join(', ')})`);
                        return;
                    }
                } else {
                    console.log(`ℹ️ ANALYZING ALL DIRECTORIES: ${relativePath} (no targets configured)`);
                }
            } else {
                console.log(`🔍 ANALYZING PROJECT ROOT: ${dir}`);
            }
            
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