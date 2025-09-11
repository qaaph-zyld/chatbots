const chokidar = require('chokidar');
const path = require('path');
const ContextManager = require('./ContextManager');

class WorkspaceWatcher {
  constructor(workspaceRoot, contextManager) {
    this.workspaceRoot = workspaceRoot;
    this.contextManager = contextManager || new ContextManager(workspaceRoot);
    this.watcher = null;
    this.debounceTimer = null;
    this.pendingUpdates = new Set();
    this.isScanning = false;
  }

  async start() {
    // Initialize context manager
    await this.contextManager.initialize();

    // Set up file watcher
    this.watcher = chokidar.watch(this.workspaceRoot, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**',
        '**/.*', // Hidden files/directories
        '**/*.log',
        '**/*.tmp',
        '**/*.swp',
        '**/*.swo',
        '**/*.lock',
      ],
      ignoreInitial: true,
      persistent: true,
      ignorePermissionErrors: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    });

    // Set up event handlers
    this.watcher
      .on('add', file => this.handleFileChange('add', file))
      .on('change', file => this.handleFileChange('change', file))
      .on('unlink', file => this.handleFileChange('unlink', file))
      .on('error', error => console.error('Watcher error:', error));

    console.log(`Watching for file changes in ${this.workspaceRoot}`);
  }

  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  handleFileChange(event, filePath) {
    // Skip if we're already scanning or if it's a directory
    if (this.isScanning || !filePath) return;

    // Add to pending updates
    this.pendingUpdates.add(path.relative(this.workspaceRoot, filePath));

    // Debounce rapid file changes
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processPendingUpdates();
    }, 1000); // 1 second debounce
  }

  async processPendingUpdates() {
    if (this.pendingUpdates.size === 0 || this.isScanning) return;

    try {
      this.isScanning = true;
      const updatedFiles = Array.from(this.pendingUpdates);
      this.pendingUpdates.clear();

      console.log(`Processing updates for ${updatedFiles.length} files...`);
      await this.contextManager.scanWorkspace();
      console.log('Context updated successfully');
    } catch (error) {
      console.error('Error processing file updates:', error);
    } finally {
      this.isScanning = false;
      
      // Check for new updates that came in while we were scanning
      if (this.pendingUpdates.size > 0) {
        this.processPendingUpdates();
      }
    }
  }

  async forceRescan() {
    await this.contextManager.scanWorkspace();
  }
}

module.exports = WorkspaceWatcher;
