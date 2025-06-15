#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const crypto = require('crypto');

class ProjectMappingSystem {
    constructor(projectRoot = '.') {
        this.projectRoot = path.resolve(projectRoot);
        this.mappingFile = path.join(this.projectRoot, '.project-mapping.json');
        this.configFile = path.join(this.projectRoot, '.mapping-config.json');
        this.watcher = null;
        
        this.architecture = {
            metadata: {
                lastUpdate: null,
                version: '1.0.0',
                totalFiles: 0,
                totalDirectories: 0,
                projectHash: null
            },
            structure: {},
            explanations: {},
            dependencies: {},
            patterns: {},
            changes: []
        };

        this.config = {
            watchPatterns: [
                '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx',
                '**/*.py', '**/*.java', '**/*.cpp', '**/*.c', '**/*.h',
                '**/*.json', '**/*.yaml', '**/*.yml', '**/*.toml',
                '**/*.md', '**/*.txt', '**/*.rst',
                '**/*.sql', '**/*.sh', '**/*.bat',
                '**/*.css', '**/*.scss', '**/*.html',
                '**/*.dockerfile', '**/Makefile', '**/package.json'
            ],
            ignorePatterns: [
                'node_modules/**', '.git/**', '*.log',
                'dist/**', 'build/**', 'coverage/**',
                '*.tmp', '*.temp', '.DS_Store'
            ],
            analysisRules: {
                // File type classification
                source: /\.(js|ts|jsx|tsx|py|java|cpp|c|h)$/,
                config: /\.(json|yaml|yml|toml|ini|conf)$/,
                documentation: /\.(md|txt|rst|adoc)$/,
                test: /\.(test|spec)\.(js|ts|jsx|tsx|py)$/,
                build: /\.(dockerfile|makefile|gulpfile|webpack|rollup)$/i,
                style: /\.(css|scss|sass|less)$/,
                data: /\.(sql|json|csv|xml)$/
            },
            explanationTemplates: {
                directory: "Directory containing {fileCount} files, purpose: {purpose}",
                sourceFile: "Source file: {language}, exports: {exports}, imports: {imports}",
                configFile: "Configuration: {configType}, affects: {scope}",
                testFile: "Test suite for: {testTarget}, coverage: {coverage}",
                documentationFile: "Documentation: {docType}, covers: {topics}"
            }
        };
    }

    // Core System Initialization
    async initialize() {
        console.log('🏗️  Initializing Project Mapping System...');
        
        await this.loadExistingMapping();
        await this.loadConfiguration();
        await this.performInitialScan();
        await this.startFileWatcher();
        
        console.log('✅ Project Mapping System initialized');
        return this.architecture;
    }

    async loadExistingMapping() {
        try {
            const mappingContent = await fs.readFile(this.mappingFile, 'utf8');
            this.architecture = { ...this.architecture, ...JSON.parse(mappingContent) };
            console.log('📋 Loaded existing project mapping');
        } catch (error) {
            console.log('📋 No existing mapping found, creating new one');
        }
    }

    async loadConfiguration() {
        try {
            const configContent = await fs.readFile(this.configFile, 'utf8');
            this.config = { ...this.config, ...JSON.parse(configContent) };
            console.log('⚙️  Loaded custom configuration');
        } catch (error) {
            await this.saveConfiguration();
            console.log('⚙️  Created default configuration');
        }
    }

    // Architecture Analysis Engine
    async performInitialScan() {
        console.log('🔍 Performing comprehensive project scan...');
        
        const scanResults = {
            structure: await this.scanDirectoryStructure(),
            dependencies: await this.analyzeDependencies(),
            patterns: await this.identifyPatterns(),
            explanations: await this.generateExplanations()
        };

        this.architecture = {
            ...this.architecture,
            ...scanResults,
            metadata: {
                ...this.architecture.metadata,
                lastUpdate: new Date().toISOString(),
                totalFiles: this.countFiles(scanResults.structure),
                totalDirectories: this.countDirectories(scanResults.structure),
                projectHash: await this.generateProjectHash()
            }
        };

        await this.saveMapping();
        return scanResults;
    }

    async scanDirectoryStructure() {
        const structure = {};
        
        async function scanRecursive(currentPath, currentStructure) {
            try {
                const items = await fs.readdir(currentPath);
                
                for (const item of items) {
                    const fullPath = path.join(currentPath, item);
                    const relativePath = path.relative(this.projectRoot, fullPath);
                    
                    // Skip ignored patterns
                    if (this.shouldIgnore(relativePath)) continue;
                    
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isDirectory()) {
                        currentStructure[item] = {
                            type: 'directory',
                            path: fullPath,
                            relativePath,
                            created: stats.birthtime,
                            modified: stats.mtime,
                            size: 0,
                            files: {},
                            metadata: {
                                fileCount: 0,
                                subdirectoryCount: 0,
                                purpose: await this.inferDirectoryPurpose(fullPath),
                                patterns: []
                            }
                        };
                        
                        await scanRecursive.call(this, fullPath, currentStructure[item].files);
                        
                        // Update directory metadata
                        currentStructure[item].metadata.fileCount = this.countFiles(currentStructure[item].files);
                        currentStructure[item].metadata.subdirectoryCount = this.countDirectories(currentStructure[item].files);
                        
                    } else {
                        const fileAnalysis = await this.analyzeFile(fullPath);
                        
                        currentStructure[item] = {
                            type: 'file',
                            path: fullPath,
                            relativePath,
                            extension: path.extname(item),
                            size: stats.size,
                            created: stats.birthtime,
                            modified: stats.mtime,
                            accessed: stats.atime,
                            analysis: fileAnalysis,
                            hash: await this.generateFileHash(fullPath)
                        };
                    }
                }
            } catch (error) {
                console.warn(`⚠️  Cannot scan directory: ${currentPath}`);
            }
        }

        await scanRecursive.call(this, this.projectRoot, structure);
        return structure;
    }

    async analyzeFile(filePath) {
        const analysis = {
            category: this.categorizeFile(filePath),
            language: this.detectLanguage(filePath),
            imports: [],
            exports: [],
            functions: [],
            classes: [],
            complexity: 0,
            lineCount: 0,
            purpose: ''
        };

        try {
            const content = await fs.readFile(filePath, 'utf8');
            analysis.lineCount = content.split('\n').length;
            
            // Language-specific analysis
            switch (analysis.language) {
                case 'javascript':
                case 'typescript':
                    analysis.imports = this.extractJSImports(content);
                    analysis.exports = this.extractJSExports(content);
                    analysis.functions = this.extractJSFunctions(content);
                    analysis.classes = this.extractJSClasses(content);
                    break;
                case 'python':
                    analysis.imports = this.extractPythonImports(content);
                    analysis.functions = this.extractPythonFunctions(content);
                    analysis.classes = this.extractPythonClasses(content);
                    break;
                case 'json':
                    analysis.purpose = this.analyzeJSONPurpose(content, path.basename(filePath));
                    break;
            }
            
            analysis.complexity = this.calculateComplexity(content, analysis.language);
            analysis.purpose = analysis.purpose || this.inferFilePurpose(filePath, analysis);
            
        } catch (error) {
            console.warn(`⚠️  Cannot analyze file: ${filePath}`);
        }

        return analysis;
    }

    async analyzeDependencies() {
        const dependencies = {
            internal: new Map(), // Internal project dependencies
            external: new Map(), // External package dependencies
            circular: [],        // Circular dependency detection
            orphaned: [],        // Files with no dependencies
            graph: {}           // Complete dependency graph
        };

        // Analyze package.json dependencies
        try {
            const packagePath = path.join(this.projectRoot, 'package.json');
            const packageContent = await fs.readFile(packagePath, 'utf8');
            const packageData = JSON.parse(packageContent);
            
            Object.keys(packageData.dependencies || {}).forEach(dep => {
                dependencies.external.set(dep, {
                    version: packageData.dependencies[dep],
                    type: 'production'
                });
            });
            
            Object.keys(packageData.devDependencies || {}).forEach(dep => {
                dependencies.external.set(dep, {
                    version: packageData.devDependencies[dep],
                    type: 'development'
                });
            });
        } catch (error) {
            console.warn('⚠️  No package.json found');
        }

        // Build internal dependency graph
        await this.walkFiles(async (filePath, fileData) => {
            if (fileData.analysis && fileData.analysis.imports) {
                const fileDeps = [];
                
                fileData.analysis.imports.forEach(importPath => {
                    if (importPath.startsWith('.')) {
                        // Internal dependency
                        const resolvedPath = path.resolve(path.dirname(filePath), importPath);
                        fileDeps.push(resolvedPath);
                        
                        if (!dependencies.internal.has(filePath)) {
                            dependencies.internal.set(filePath, []);
                        }
                        dependencies.internal.get(filePath).push(resolvedPath);
                    }
                });
                
                dependencies.graph[filePath] = fileDeps;
            }
        });

        // Detect circular dependencies
        dependencies.circular = this.detectCircularDependencies(dependencies.graph);
        
        // Find orphaned files
        const allFiles = new Set();
        const referencedFiles = new Set();
        
        Object.keys(dependencies.graph).forEach(file => {
            allFiles.add(file);
            dependencies.graph[file].forEach(dep => referencedFiles.add(dep));
        });
        
        dependencies.orphaned = [...allFiles].filter(file => !referencedFiles.has(file));

        return dependencies;
    }

    async identifyPatterns() {
        const patterns = {
            architectural: this.identifyArchitecturalPatterns(),
            naming: this.identifyNamingPatterns(),
            structure: this.identifyStructuralPatterns(),
            antipatterns: this.identifyAntipatterns()
        };

        return patterns;
    }

    async generateExplanations() {
        const explanations = {};
        
        await this.walkStructure(async (path, item) => {
            if (item.type === 'directory') {
                explanations[path] = this.generateDirectoryExplanation(item);
            } else {
                explanations[path] = this.generateFileExplanation(item);
            }
        });

        return explanations;
    }

    // Real-time File System Monitoring
    async startFileWatcher() {
        console.log('👀 Starting file system watcher...');
        
        this.watcher = chokidar.watch(this.config.watchPatterns, {
            cwd: this.projectRoot,
            ignored: this.config.ignorePatterns,
            persistent: true,
            ignoreInitial: true
        });

        this.watcher
            .on('add', (filePath) => this.handleFileChange('added', filePath))
            .on('change', (filePath) => this.handleFileChange('modified', filePath))
            .on('unlink', (filePath) => this.handleFileChange('deleted', filePath))
            .on('addDir', (dirPath) => this.handleDirectoryChange('added', dirPath))
            .on('unlinkDir', (dirPath) => this.handleDirectoryChange('deleted', dirPath));

        console.log('✅ File system watcher active');
    }

    async handleFileChange(changeType, filePath) {
        const fullPath = path.join(this.projectRoot, filePath);
        const relativePath = filePath;
        
        console.log(`📝 File ${changeType}: ${relativePath}`);
        
        const change = {
            type: changeType,
            target: 'file',
            path: fullPath,
            relativePath,
            timestamp: new Date().toISOString()
        };

        switch (changeType) {
            case 'added':
            case 'modified':
                await this.updateFileInStructure(fullPath);
                break;
            case 'deleted':
                this.removeFileFromStructure(fullPath);
                break;
        }

        this.architecture.changes.push(change);
        await this.saveMapping();
        
        // Trigger dependency re-analysis if needed
        if (this.isStructuralChange(filePath)) {
            await this.updateDependencies();
        }
    }

    async handleDirectoryChange(changeType, dirPath) {
        const fullPath = path.join(this.projectRoot, dirPath);
        const relativePath = dirPath;
        
        console.log(`📁 Directory ${changeType}: ${relativePath}`);
        
        const change = {
            type: changeType,
            target: 'directory',
            path: fullPath,
            relativePath,
            timestamp: new Date().toISOString()
        };

        switch (changeType) {
            case 'added':
                await this.addDirectoryToStructure(fullPath);
                break;
            case 'deleted':
                this.removeDirectoryFromStructure(fullPath);
                break;
        }

        this.architecture.changes.push(change);
        await this.saveMapping();
    }

    // Architecture Query Interface
    async getCompleteMapping() {
        return this.architecture;
    }

    async getDirectoryInfo(dirPath) {
        const relativePath = path.relative(this.projectRoot, dirPath);
        return this.findInStructure(relativePath);
    }

    async getFileInfo(filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);
        return this.findInStructure(relativePath);
    }

    async searchByPattern(pattern) {
        const results = [];
        
        await this.walkStructure(async (path, item) => {
            if (pattern.test(path) || pattern.test(item.relativePath)) {
                results.push({ path, item });
            }
        });

        return results;
    }

    async getDependencyGraph() {
        return this.architecture.dependencies;
    }

    async getProjectStats() {
        return {
            metadata: this.architecture.metadata,
            summary: {
                totalFiles: this.architecture.metadata.totalFiles,
                totalDirectories: this.architecture.metadata.totalDirectories,
                languages: this.getLanguageDistribution(),
                categories: this.getCategoryDistribution(),
                recentChanges: this.architecture.changes.slice(-10)
            }
        };
    }

    // Utility Methods
    categorizeFile(filePath) {
        const rules = this.config.analysisRules;
        
        for (const [category, pattern] of Object.entries(rules)) {
            if (pattern.test(filePath)) return category;
        }
        
        return 'unknown';
    }

    detectLanguage(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const languageMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.h': 'c',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.sql': 'sql',
            '.css': 'css',
            '.scss': 'scss',
            '.html': 'html'
        };
        
        return languageMap[ext] || 'unknown';
    }

    extractJSImports(content) {
        const imports = [];
        const patterns = [
            /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
            /require\(['"`]([^'"`]+)['"`]\)/g,
            /import\(['"`]([^'"`]+)['"`]\)/g
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                imports.push(match[1]);
            }
        });

        return imports;
    }

    extractJSExports(content) {
        const exports = [];
        const patterns = [
            /export\s+(?:default\s+)?(?:function|class|const|let|var)\s+(\w+)/g,
            /export\s*{\s*([^}]+)\s*}/g,
            /module\.exports\s*=\s*(\w+)/g
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                exports.push(match[1]);
            }
        });

        return exports;
    }

    extractJSFunctions(content) {
        const functions = [];
        const patterns = [
            /function\s+(\w+)\s*\(/g,
            /(\w+)\s*:\s*function\s*\(/g,
            /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
            /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                functions.push(match[1]);
            }
        });

        return functions;
    }

    extractJSClasses(content) {
        const classes = [];
        const pattern = /class\s+(\w+)/g;
        let match;
        
        while ((match = pattern.exec(content)) !== null) {
            classes.push(match[1]);
        }

        return classes;
    }

    extractPythonImports(content) {
        const imports = [];
        const patterns = [
            /from\s+(\S+)\s+import/g,
            /import\s+(\S+)/g
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                imports.push(match[1]);
            }
        });

        return imports;
    }

    extractPythonFunctions(content) {
        const functions = [];
        const pattern = /def\s+(\w+)\s*\(/g;
        let match;
        
        while ((match = pattern.exec(content)) !== null) {
            functions.push(match[1]);
        }

        return functions;
    }

    extractPythonClasses(content) {
        const classes = [];
        const pattern = /class\s+(\w+)/g;
        let match;
        
        while ((match = pattern.exec(content)) !== null) {
            classes.push(match[1]);
        }

        return classes;
    }

    calculateComplexity(content, language) {
        // Simple complexity metric based on control structures
        const complexityPatterns = [
            /if\s*\(/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /switch\s*\(/g,
            /catch\s*\(/g,
            /else\s*{/g
        ];

        let complexity = 1; // Base complexity
        
        complexityPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) complexity += matches.length;
        });

        return complexity;
    }

    async inferDirectoryPurpose(dirPath) {
        const dirName = path.basename(dirPath).toLowerCase();
        const purposeMap = {
            'src': 'Source code directory',
            'lib': 'Library code',
            'test': 'Test files',
            'tests': 'Test files',
            'spec': 'Specification files',
            'docs': 'Documentation',
            'config': 'Configuration files',
            'utils': 'Utility functions',
            'helpers': 'Helper functions',
            'services': 'Service layer',
            'controllers': 'Controller layer',
            'models': 'Data models',
            'views': 'View layer',
            'components': 'UI components',
            'pages': 'Page components',
            'assets': 'Static assets',
            'public': 'Public static files',
            'dist': 'Distribution build',
            'build': 'Build output',
            'node_modules': 'Package dependencies',
            'scripts': 'Build/utility scripts',
            'tools': 'Development tools',
            'types': 'Type definitions'
        };

        return purposeMap[dirName] || 'General purpose directory';
    }

    inferFilePurpose(filePath, analysis) {
        const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
        const category = analysis.category;
        
        // Purpose inference based on file name and category
        if (category === 'config') {
            return `Configuration file for ${fileName}`;
        } else if (category === 'test') {
            return `Test suite for ${fileName.replace(/\.(test|spec)$/, '')}`;
        } else if (category === 'documentation') {
            return `Documentation for ${fileName}`;
        } else if (analysis.exports.length > 0) {
            return `Module exporting: ${analysis.exports.join(', ')}`;
        } else if (analysis.functions.length > 0) {
            return `Utility functions: ${analysis.functions.slice(0, 3).join(', ')}`;
        }
        
        return `${category} file`;
    }

    analyzeJSONPurpose(content, fileName) {
        try {
            const data = JSON.parse(content);
            
            if (fileName === 'package.json') {
                return `Package configuration for ${data.name || 'project'}`;
            } else if (data.scripts) {
                return 'Build configuration with scripts';
            } else if (data.dependencies || data.devDependencies) {
                return 'Dependency configuration';
            } else if (Array.isArray(data)) {
                return `Data array with ${data.length} items`;
            } else {
                return 'Configuration data';
            }
        } catch (error) {
            return 'JSON data file';
        }
    }

    detectCircularDependencies(graph) {
        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];

        function dfs(node, path) {
            if (recursionStack.has(node)) {
                const cycleStart = path.indexOf(node);
                cycles.push(path.slice(cycleStart));
                return true;
            }

            if (visited.has(node)) return false;

            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            const dependencies = graph[node] || [];
            for (const dep of dependencies) {
                if (dfs(dep, [...path])) {
                    return true;
                }
            }

            recursionStack.delete(node);
            return false;
        }

        Object.keys(graph).forEach(node => {
            if (!visited.has(node)) {
                dfs(node, []);
            }
        });

        return cycles;
    }

    identifyArchitecturalPatterns() {
        // Identify common architectural patterns
        const patterns = [];
        
        // MVC Pattern
        if (this.hasDirectories(['models', 'views', 'controllers'])) {
            patterns.push('MVC (Model-View-Controller)');
        }
        
        // Component-based architecture
        if (this.hasDirectories(['components'])) {
            patterns.push('Component-based architecture');
        }
        
        // Service layer pattern
        if (this.hasDirectories(['services'])) {
            patterns.push('Service layer pattern');
        }
        
        // Microservices indicators
        if (this.hasFiles(['docker-compose.yml', 'kubernetes']) || this.hasDirectories(['services'])) {
            patterns.push('Microservices architecture');
        }

        return patterns;
    }

    identifyNamingPatterns() {
        const patterns = {
            camelCase: 0,
            kebabCase: 0,
            snakeCase: 0,
            PascalCase: 0
        };

        // Analyze file names for patterns
        this.walkStructure((path, item) => {
            if (item.type === 'file') {
                const baseName = path.basename(item.path, item.extension);
                
                if (/^[a-z][a-zA-Z0-9]*$/.test(baseName)) patterns.camelCase++;
                else if (/^[a-z][a-z0-9-]*$/.test(baseName)) patterns.kebabCase++;
                else if (/^[a-z][a-z0-9_]*$/.test(baseName)) patterns.snakeCase++;
                else if (/^[A-Z][a-zA-Z0-9]*$/.test(baseName)) patterns.PascalCase++;
            }
        });

        return patterns;
    }

    identifyStructuralPatterns() {
        const patterns = [];
        
        // Monorepo pattern
        if (this.hasFiles(['lerna.json', 'nx.json']) || this.hasDirectories(['packages', 'apps'])) {
            patterns.push('Monorepo structure');
        }
        
        // Standard Node.js project
        if (this.hasFiles(['package.json']) && this.hasDirectories(['node_modules'])) {
            patterns.push('Node.js project');
        }
        
        // Frontend project patterns
        if (this.hasDirectories(['src', 'public']) && this.hasFiles(['package.json'])) {
            patterns.push('Frontend application');
        }

        return patterns;
    }

    identifyAntipatterns() {
        const antipatterns = [];
        
        // Large files
        const largeFiles = [];
        this.walkStructure((path, item) => {
            if (item.type === 'file' && item.size > 100000) { // 100KB threshold
                largeFiles.push(item.relativePath);
            }
        });
        
        if (largeFiles.length > 0) {
            antipatterns.push(`Large files detected: ${largeFiles.length} files > 100KB`);
        }
        
        // Deep nesting
        const maxDepth = this.calculateMaxDepth();
        if (maxDepth > 8) {
            antipatterns.push(`Deep directory nesting: ${maxDepth} levels`);
        }
        
        // Circular dependencies
        if (this.architecture.dependencies && this.architecture.dependencies.circular) {
            this.architecture.dependencies.circular.forEach(circle => {
                antipatterns.push({
                    type: 'circular_dependency',
                    severity: 'high',
                    message: `Circular dependency detected: ${circle.join(' → ')}`,
                    files: circle
                });
            });
        }
        
        // Long dependency chains
        if (this.architecture.dependencies && this.architecture.dependencies.longChains) {
            this.architecture.dependencies.longChains.forEach(chain => {
                if (chain.length > 5) {
                    antipatterns.push({
                        type: 'long_dependency_chain',
                        severity: 'medium',
                        message: `Long dependency chain (${chain.length} levels): ${chain.join(' → ')}`,
                        files: chain
                    });
                }
            });
        }
        
        // Orphaned files
        if (this.architecture.dependencies && this.architecture.dependencies.orphanedFiles) {
            this.architecture.dependencies.orphanedFiles.forEach(file => {
                antipatterns.push({
                    type: 'orphaned_file',
                    severity: 'low',
                    message: `Orphaned file: ${file}`
                });
            });
        }
        
        // Duplicate files
        if (this.architecture.dependencies && this.architecture.dependencies.duplicateFiles) {
            this.architecture.dependencies.duplicateFiles.forEach(group => {
                antipatterns.push({
                    type: 'duplicate_files',
                    severity: 'medium',
                    message: `Duplicate files found: ${group.join(', ')}`
                });
            });
        }
        
        return antipatterns;
    }

    // Persistence Layer
    async saveMapping() {
        try {
            await fs.writeFile(this.mappingFile, JSON.stringify(this.architecture, null, 2));
            console.log('💾 Project mapping saved');
        } catch (error) {
            console.error('❌ Failed to save mapping:', error.message);
        }
    }

    async saveConfiguration() {
        try {
            await fs.writeFile(this.configFile, JSON.stringify(this.config, null, 2));
            console.log('⚙️  Configuration saved');
        } catch (error) {
            console.error('❌ Failed to save configuration:', error.message);
        }
    }

    // Helper Methods
    shouldIgnore(filePath) {
        return this.config.ignorePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(filePath);
        });
    }

    async generateFileHash(filePath) {
        try {
            const content = await fs.readFile(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
            return null;
        }
    }

    async generateProjectHash() {
        const structure = JSON.stringify(this.architecture.structure);
        return crypto.createHash('md5').update(structure).digest('hex');
    }

    countFiles(structure) {
        let count = 0;
        
        Object.values(structure).forEach(item => {
            if (item.type === 'file') {
                count++;
            } else if (item.type === 'directory' && item.files) {
                count += this.countFiles(item.files);
            }
        });
        
        return count;
    }

    countDirectories(structure) {
        let count = 0;
        
        Object.values(structure).forEach(item => {
            if (item.type === 'directory') {
                count++;
                if (item.files) {
                    count += this.countDirectories(item.files);
                }
            }
        });
        
        return count;
    }

    async walkStructure(callback) {
        async function walk(structure, basePath = '') {
            for (const [name, item] of Object.entries(structure)) {
                const currentPath = path.join(basePath, name);
                await callback(currentPath, item);
                
                if (item.type === 'directory' && item.files) {
                    await walk(item.files, currentPath);
                }
            }
        }
        
        await walk(this.architecture.structure);
    }

    async walkFiles(callback) {
        await this.walkStructure(async (path, item) => {
            if (item.type === 'file') {
                await callback(path, item);
            }
        });
    }

    findInStructure(relativePath) {
        const pathParts = relativePath.split(path.sep);
        let current = this.architecture.structure;
        
        for (const part of pathParts) {
            if (current[part]) {
                current = current[part].type === 'directory' ? current[part].files : current[part];
            } else {
                return null;
            }
        }
        
        return current;
    }
 
    getLanguageDistribution() {
        const distribution = {};
        
        this.walkStructure((path, item) => {
            if (item.type === 'file' && item.analysis) {
                const lang = item.analysis.language;
                distribution[lang] = (distribution[lang] || 0) + 1;
            }
        });
        
        return distribution;
    }
 
    getCategoryDistribution() {
        const distribution = {};
        
        this.walkStructure((path, item) => {
            if (item.type === 'file' && item.analysis) {
                const category = item.analysis.category;
                distribution[category] = (distribution[category] || 0) + 1;
            }
        });
        
        return distribution;
    }
 
    hasDirectories(dirNames) {
        const existingDirs = new Set();
        
        this.walkStructure((path, item) => {
            if (item.type === 'directory') {
                existingDirs.add(path.basename(item.path));
            }
        });
        
        return dirNames.every(dir => existingDirs.has(dir));
    }
 
    hasFiles(fileNames) {
        const existingFiles = new Set();
        
        this.walkStructure((path, item) => {
            if (item.type === 'file') {
                existingFiles.add(path.basename(item.path));
            }
        });
        
        return fileNames.some(file => existingFiles.has(file));
    }
 
    calculateMaxDepth() {
        let maxDepth = 0;
        
        function calculateDepth(structure, currentDepth = 0) {
            maxDepth = Math.max(maxDepth, currentDepth);
            
            Object.values(structure).forEach(item => {
                if (item.type === 'directory' && item.files) {
                    calculateDepth(item.files, currentDepth + 1);
                }
            });
        }
        
        calculateDepth(this.architecture.structure);
        return maxDepth;
    }
 
    generateDirectoryExplanation(directory) {
        const template = this.config.explanationTemplates.directory;
        return template
            .replace('{fileCount}', directory.metadata.fileCount)
            .replace('{purpose}', directory.metadata.purpose);
    }
 
    generateFileExplanation(file) {
        if (!file.analysis) return 'File without analysis data';
        
        const category = file.analysis.category;
        const template = this.config.explanationTemplates[category + 'File'] || 
                        `${category} file with ${file.analysis.lineCount} lines`;
        
        return template
            .replace('{language}', file.analysis.language)
            .replace('{exports}', file.analysis.exports.join(', '))
            .replace('{imports}', file.analysis.imports.join(', '))
            .replace('{lineCount}', file.analysis.lineCount);
    }
 
    async updateFileInStructure(fullPath) {
        const relativePath = path.relative(this.projectRoot, fullPath);
        const pathParts = relativePath.split(path.sep);
        
        try {
            const stats = await fs.stat(fullPath);
            const fileAnalysis = await this.analyzeFile(fullPath);
            
            let current = this.architecture.structure;
            for (let i = 0; i < pathParts.length - 1; i++) {
                if (!current[pathParts[i]]) {
                    current[pathParts[i]] = {
                        type: 'directory',
                        files: {}
                    };
                }
                current = current[pathParts[i]].files;
            }
            
            const fileName = pathParts[pathParts.length - 1];
            current[fileName] = {
                type: 'file',
                path: fullPath,
                relativePath,
                extension: path.extname(fileName),
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime,
                analysis: fileAnalysis,
                hash: await this.generateFileHash(fullPath)
            };
            
        } catch (error) {
            console.warn(`⚠️  Cannot update file: ${fullPath}`);
        }
    }
 
    removeFileFromStructure(fullPath) {
        const relativePath = path.relative(this.projectRoot, fullPath);
        const pathParts = relativePath.split(path.sep);
        
        let current = this.architecture.structure;
        const pathToFile = pathParts.slice(0, -1);
        
        for (const part of pathToFile) {
            if (current[part] && current[part].type === 'directory') {
                current = current[part].files;
            } else {
                return; // Path doesn't exist
            }
        }
        
        const fileName = pathParts[pathParts.length - 1];
        delete current[fileName];
    }
 
    async addDirectoryToStructure(fullPath) {
        const relativePath = path.relative(this.projectRoot, fullPath);
        const pathParts = relativePath.split(path.sep);
        
        try {
            const stats = await fs.stat(fullPath);
            
            let current = this.architecture.structure;
            for (let i = 0; i < pathParts.length - 1; i++) {
                if (!current[pathParts[i]]) {
                    current[pathParts[i]] = {
                        type: 'directory',
                        files: {}
                    };
                }
                current = current[pathParts[i]].files;
            }
            
            const dirName = pathParts[pathParts.length - 1];
            current[dirName] = {
                type: 'directory',
                path: fullPath,
                relativePath,
                created: stats.birthtime,
                modified: stats.mtime,
                size: 0,
                files: {},
                metadata: {
                    fileCount: 0,
                    subdirectoryCount: 0,
                    purpose: await this.inferDirectoryPurpose(fullPath),
                    patterns: []
                }
            };
            
        } catch (error) {
            console.warn(`⚠️  Cannot add directory: ${fullPath}`);
        }
    }
 
    removeDirectoryFromStructure(fullPath) {
        const relativePath = path.relative(this.projectRoot, fullPath);
        const pathParts = relativePath.split(path.sep);
        
        let current = this.architecture.structure;
        const pathToDir = pathParts.slice(0, -1);
        
        for (const part of pathToDir) {
            if (current[part] && current[part].type === 'directory') {
                current = current[part].files;
            } else {
                return; // Path doesn't exist
            }
        }
        
        const dirName = pathParts[pathParts.length - 1];
        delete current[dirName];
    }
 
    isStructuralChange(filePath) {
        const structuralFiles = [
            'package.json', 'package-lock.json', 'yarn.lock',
            'tsconfig.json', 'webpack.config.js', 'rollup.config.js',
            '.gitignore', '.dockerignore', 'Dockerfile',
            'index.js', 'index.ts', 'main.js', 'main.ts'
        ];
        
        const fileName = path.basename(filePath);
        return structuralFiles.includes(fileName) || 
               fileName.includes('config') || 
               fileName.includes('setup');
    }
 
    async updateDependencies() {
        console.log('🔄 Updating dependency analysis...');
        this.architecture.dependencies = await this.analyzeDependencies();
        await this.saveMapping();
    }
 
    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            console.log('🛑 File system watcher stopped');
        }
    }
 
    // Export interface for CLI usage
    async exportMapping(format = 'json') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const exportPath = path.join(this.projectRoot, `project-mapping-${timestamp}.${format}`);
        
        switch (format) {
            case 'json':
                await fs.writeFile(exportPath, JSON.stringify(this.architecture, null, 2));
                break;
            case 'yaml':
                const yaml = require('js-yaml');
                await fs.writeFile(exportPath, yaml.dump(this.architecture));
                break;
            case 'html':
                const htmlReport = this.generateHTMLReport();
                await fs.writeFile(exportPath, htmlReport);
                break;
        }
        
        console.log(`📄 Mapping exported to: ${exportPath}`);
        return exportPath;
    }
 
    generateHTMLReport() {
        return `
 <!DOCTYPE html>
 <html>
 <head>
    <title>Project Architecture Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .section { margin: 20px 0; border: 1px solid #ddd; padding: 15px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat-card { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        .file-tree { font-family: monospace; white-space: pre-line; }
        .dependency-graph { max-height: 400px; overflow-y: auto; }
    </style>
 </head>
 <body>
    <h1>Project Architecture Report</h1>
    
    <div class="section">
        <h2>Project Statistics</h2>
        <div class="stats">
            <div class="stat-card">
                <h3>Total Files</h3>
                <p>${this.architecture.metadata.totalFiles}</p>
            </div>
            <div class="stat-card">
                <h3>Total Directories</h3>
                <p>${this.architecture.metadata.totalDirectories}</p>
            </div>
            <div class="stat-card">
                <h3>Last Updated</h3>
                <p>${this.architecture.metadata.lastUpdate}</p>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Language Distribution</h2>
        <pre>${JSON.stringify(this.getLanguageDistribution(), null, 2)}</pre>
    </div>
    
    <div class="section">
        <h2>Architectural Patterns</h2>
        <ul>
            ${this.architecture.patterns.architectural.map(pattern => `<li>${pattern}</li>`).join('')}
        </ul>
    </div>
    
    <div class="section">
        <h2>Recent Changes</h2>
        <div class="dependency-graph">
            ${this.architecture.changes.slice(-20).map(change => `
                <p><strong>${change.type}</strong> ${change.target}: ${change.relativePath} 
                <em>(${new Date(change.timestamp).toLocaleString()})</em></p>
            `).join('')}
        </div>
    </div>
    
    <div class="section">
        <h2>Project Structure</h2>
        <div class="file-tree">${this.generateTreeVisualization()}</div>
    </div>
 </body>
 </html>
        `;
    }
 
    generateTreeVisualization() {
        let tree = '';
        
        function buildTree(structure, prefix = '', isLast = true) {
            const entries = Object.entries(structure);
            
            entries.forEach(([name, item], index) => {
                const isLastItem = index === entries.length - 1;
                const connector = isLastItem ? '└── ' : '├── ';
                const icon = item.type === 'directory' ? '📁' : '📄';
                
                tree += `${prefix}${connector}${icon} ${name}\n`;
                
                if (item.type === 'directory' && item.files) {
                    const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
                    buildTree(item.files, newPrefix, isLastItem);
                }
            });
        }
        
        buildTree(this.architecture.structure);
        return tree;
    }
 }
 
 // CLI Interface
 async function main() {
    const args = process.argv.slice(2);
    const projectPath = args.find(arg => !arg.startsWith('--')) || '.';
    const shouldExport = args.includes('--export');
    const exportFormat = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'json';
    
    console.log('🚀 Starting Project Mapping System...');
    
    const mapper = new ProjectMappingSystem(projectPath);
    
    try {
        await mapper.initialize();
        
        if (shouldExport) {
            await mapper.exportMapping(exportFormat);
        }
        
        // Keep running for file watching
        console.log('🎯 System active - Press Ctrl+C to stop');
        
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down...');
            await mapper.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ System error:', error.message);
        process.exit(1);
    }
 }
 
 // Export for module usage
 module.exports = ProjectMappingSystem;
 
 // Run CLI if called directly
 if (require.main === module) {
    main();
 }