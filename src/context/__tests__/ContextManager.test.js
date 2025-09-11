const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const ContextManager = require('../ContextManager');

describe('ContextManager', () => {
  let tempDir;
  let contextManager;

  beforeAll(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `context-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Create some test files
    await fs.writeFile(
      path.join(tempDir, 'test1.js'),
      '// Test file 1\nconst test1 = () => console.log("Test 1");',
      'utf8'
    );
    
    await fs.writeFile(
      path.join(tempDir, 'test2.js'),
      '// Test file 2\nconst test2 = () => console.log("Test 2");',
      'utf8'
    );
    
    contextManager = new ContextManager(tempDir);
  });

  afterAll(async () => {
    // Clean up test files
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('should initialize with empty context', async () => {
    expect(contextManager.workspaceContext).toBeNull();
    expect(contextManager.lastUpdate).toBeNull();
  });

  test('should scan workspace and create context', async () => {
    await contextManager.scanWorkspace();
    
    expect(contextManager.workspaceContext).not.toBeNull();
    expect(contextManager.workspaceContext.files).toHaveLength(2);
    expect(contextManager.lastUpdate).toBeInstanceOf(Date);
  });

  test('should get relevant context for query', async () => {
    await contextManager.scanWorkspace();
    const relevantContext = contextManager.getRelevantContext('test1');
    
    expect(relevantContext).toHaveLength(1);
    expect(relevantContext[0].path).toContain('test1.js');
  });

  test('should update context on file change', async () => {
    await contextManager.scanWorkspace();
    const initialUpdateTime = contextManager.lastUpdate;
    
    // Update a file
    await fs.writeFile(
      path.join(tempDir, 'test1.js'),
      '// Updated test file 1\nconst test1 = () => console.log("Updated Test 1");',
      'utf8'
    );
    
    // Rescan
    await contextManager.scanWorkspace();
    
    expect(contextManager.lastUpdate.getTime()).toBeGreaterThan(initialUpdateTime.getTime());
    
    const updatedFile = contextManager.workspaceContext.files.find(f => f.path.endsWith('test1.js'));
    expect(updatedFile.content).toContain('Updated Test 1');
  });
});
