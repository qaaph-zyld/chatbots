const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ContextManager {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.workspaceContext = null;
    this.lastUpdate = null;
    this.fileHashes = new Map();
    this.scanCachePath = path.join(workspaceRoot, '.context-cache.json');
  }

  async initialize() {
    try {
      await this.loadCachedContext();
      await this.scanWorkspace();
      await this.saveContextToCache();
    } catch (error) {
      console.error('Error initializing ContextManager:', error);
      await this.scanWorkspace(); // Full scan if cache is corrupted
    }
  }

  async loadCachedContext() {
    try {
      const data = await fs.readFile(this.scanCachePath, 'utf-8');
      const cached = JSON.parse(data);
      
      // Validate cache
      if (cached.metadata && cached.metadata.version === '1.0') {
        this.workspaceContext = cached;
        this.lastUpdate = new Date(cached.metadata.scan_date);
        
        // Initialize file hashes for change detection
        if (cached.files) {
          cached.files.forEach(file => {
            if (file.path && file.hash) {
              this.fileHashes.set(file.path, file.hash);
            }
          });
        }
        
        console.log(`Loaded cached context with ${cached.files?.length || 0} files`);
        return true;
      }
    } catch (error) {
      console.log('No valid cache found, performing full scan...');
    }
    return false;
  }

  async saveContextToCache() {
    if (!this.workspaceContext) return;
    
    try {
      await fs.mkdir(path.dirname(this.scanCachePath), { recursive: true });
      await fs.writeFile(this.scanCachePath, JSON.stringify(this.workspaceContext, null, 2));
    } catch (error) {
      console.error('Error saving context cache:', error);
    }
  }

  async scanWorkspace() {
    console.log('Scanning workspace for changes...');
    const scanResult = {
      metadata: {
        version: '1.0',
        scan_date: new Date().toISOString(),
        scanner: 'workspace-scanner',
      },
      files: []
    };

    const changedFiles = await this.findChangedFiles(this.workspaceRoot);
    
    // Process changed files
    for (const file of changedFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const hash = this.calculateHash(content);
        const relativePath = path.relative(this.workspaceRoot, file);
        
        scanResult.files.push({
          path: relativePath,
          content: content,
          hash: hash,
          last_modified: (await fs.stat(file)).mtime.toISOString()
        });
        
        this.fileHashes.set(relativePath, hash);
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    this.workspaceContext = scanResult;
    this.lastUpdate = new Date();
    await this.saveContextToCache();
    
    console.log(`Scan complete. Processed ${changedFiles.length} changed files.`);
    return scanResult;
  }

  async findChangedFiles(dir) {
    const changedFiles = [];
    
    async function scanDirectory(currentDir) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          try {
            const relativePath = path.relative(this.workspaceRoot, fullPath);
            const content = await fs.readFile(fullPath, 'utf-8');
            const currentHash = this.calculateHash(content);
            
            if (!this.fileHashes.has(relativePath) || this.fileHashes.get(relativePath) !== currentHash) {
              changedFiles.push(fullPath);
            }
          } catch (error) {
            console.error(`Error checking file ${fullPath}:`, error);
          }
        }
      }
    }
    
    await scanDirectory.call(this, dir);
    return changedFiles;
  }

  calculateHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  getRelevantContext(query) {
    if (!this.workspaceContext) return [];
    
    // Simple keyword matching - can be enhanced with more sophisticated NLP
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return this.workspaceContext.files.filter(file => {
      const content = `${file.path} ${file.content}`.toLowerCase();
      return queryTerms.some(term => content.includes(term));
    });
  }

  injectContextIntoPrompt(userPrompt, maxTokens = 10000) {
    if (!this.workspaceContext) {
      return userPrompt;
    }
    
    const relevantContext = this.getRelevantContext(userPrompt);
    let tokenCount = 0;
    const includedFiles = [];
    
    // Simple token estimation (1 token ≈ 4 characters in English)
    for (const file of relevantContext) {
      const fileTokenEstimate = Math.ceil(file.content.length / 4);
      
      if (tokenCount + fileTokenEstimate <= maxTokens) {
        includedFiles.push(file);
        tokenCount += fileTokenEstimate;
      } else {
        break;
      }
    }
    
    const contextSections = includedFiles.map(file => 
      `// File: ${file.path}\n${file.content}`
    ).join('\n\n');
    
    return `WORKSPACE CONTEXT (${includedFiles.length} relevant files):
${contextSections}

USER REQUEST:
${userPrompt}`;
  }
}

module.exports = ContextManager;
