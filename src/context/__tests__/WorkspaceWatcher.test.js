const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const WorkspaceWatcher = require('../WorkspaceWatcher');

// Increase timeout for file system operations
jest.setTimeout(30000);

describe('WorkspaceWatcher', () => {
  let tempDir;
  let watcher;
  let contextManager;

  beforeAll(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `watcher-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Initialize context manager
    contextManager = {
      scanWorkspace: jest.fn().mockResolvedValue({ files: [] }),
      initialize: jest.fn().mockResolvedValue(true)
    };
    
    watcher = new WorkspaceWatcher(tempDir, contextManager);
  });

  afterEach(async () => {
    // Stop watching after each test
    if (watcher) {
      await watcher.stop();
    }
  });

  afterAll(async () => {
    // Clean up test files
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should initialize and start watching', async () => {
    await watcher.start();
    expect(contextManager.initialize).toHaveBeenCalled();
    expect(watcher.watcher).not.toBeNull();
  });

  test('should detect file changes', async () => {
    await watcher.start();
    
    // Create a new file
    const testFilePath = path.join(tempDir, 'test-file.txt');
    await fs.writeFile(testFilePath, 'test content', 'utf8');
    
    // Wait for debounce and processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    expect(contextManager.scanWorkspace).toHaveBeenCalled();
  });

  test('should debounce rapid file changes', async () => {
    await watcher.start();
    
    // Make multiple rapid changes
    const testFilePath = path.join(tempDir, 'rapid-test.txt');
    await fs.writeFile(testFilePath, 'first', 'utf8');
    await fs.writeFile(testFilePath, 'second', 'utf8');
    await fs.writeFile(testFilePath, 'third', 'utf8');
    
    // Wait for debounce and processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Should only process once due to debouncing
    expect(contextManager.scanWorkspace).toHaveBeenCalledTimes(1);
  });
});
