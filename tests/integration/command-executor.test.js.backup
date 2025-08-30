/**
 * Integration tests for the CommandExecutor module
 * 
 * These tests validate that the CommandExecutor correctly integrates with
 * the robust-command-runner and handles various command execution scenarios.
 */

const path = require('path');
const fs = require('fs');
const CommandExecutor = require('../../test-utils/command-executor');
const { runCommand } = require('../../scripts/robust-command-runner');

// Mock paths for test output
const TEST_OUTPUT_DIR = path.join(process.cwd(), 'test-results', 'integration-tests');

// Ensure test output directory exists
beforeAll(() => {
  if (!fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  }
});

describe('CommandExecutor Integration Tests', () => {
  let executor;
  
  beforeEach(() => {
    // Create a fresh CommandExecutor instance for each test
    executor = new CommandExecutor({
      outputDir: TEST_OUTPUT_DIR,
      defaultTimeout: 10000, // 10 seconds for tests
      progressTimeout: 2000, // 2 seconds for progress checks
      verbose: false // Disable verbose logging for cleaner test output
    });
  });
  
  afterEach(() => {
    // Clean up any resources if needed
  });
  
  test('should execute a simple echo command successfully', async () => {
    const testMessage = 'Hello from integration test';
    const result = await executor.runCommand('echo', [testMessage]);
    
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(testMessage);
    expect(fs.existsSync(result.stdoutFile)).toBe(true);
    expect(fs.existsSync(result.stderrFile)).toBe(true);
    expect(fs.existsSync(result.statusFile)).toBe(true);
  });
  
  test('should handle command with arguments', async () => {
    const result = await executor.runCommand('node', ['-e', 'console.log(process.version)']);
    
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(process.version);
  });
  
  test('should capture stderr output', async () => {
    const result = await executor.runCommand('node', [
      '-e', 
      'console.error("This is an error message"); process.exit(0);'
    ]);
    
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.stderr).toContain('This is an error message');
    
    // Verify stderr was written to file
    const stderrContent = fs.readFileSync(result.stderrFile, 'utf8');
    expect(stderrContent).toContain('This is an error message');
  });
  
  test('should handle non-zero exit codes', async () => {
    const result = await executor.runCommand('node', [
      '-e', 
      'console.log("About to exit with code 2"); process.exit(2);'
    ]);
    
    expect(result).toBeDefined();
    expect(result.code).toBe(2);
    expect(result.stdout).toContain('About to exit with code 2');
  });
  
  test('should maintain command execution history', async () => {
    // Run a few commands
    await executor.runCommand('echo', ['Command 1']);
    await executor.runCommand('echo', ['Command 2']);
    await executor.runCommand('echo', ['Command 3']);
    
    // Check history
    const history = executor.getCommandHistory();
    expect(history).toHaveLength(3);
    expect(history[0].args).toContain('Command 1');
    expect(history[1].args).toContain('Command 2');
    expect(history[2].args).toContain('Command 3');
  });
  
  test('should save command history to file', async () => {
    // Run a command
    await executor.runCommand('echo', ['Save history test']);
    
    // Save history to file
    const historyFile = executor.saveCommandHistory('test-history.json');
    
    // Verify file exists and contains valid JSON
    expect(fs.existsSync(historyFile)).toBe(true);
    const historyContent = fs.readFileSync(historyFile, 'utf8');
    const historyData = JSON.parse(historyContent);
    
    expect(historyData).toHaveProperty('history');
    expect(Array.isArray(historyData.history)).toBe(true);
    expect(historyData.history.length).toBeGreaterThan(0);
  });
  
  test('should run npm commands correctly', async () => {
    // This test assumes npm is available in the PATH
    const result = await executor.runNpmCommand(['--version']);
    
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // npm version format
  });
  
  test('should handle platform-specific commands', async () => {
    // Use a command that works on both Windows and Unix-like systems
    const command = process.platform === 'win32' ? 'dir' : 'ls';
    const args = process.platform === 'win32' ? ['/b'] : ['-la'];
    
    const result = await executor.runCommand(command, args);
    
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });
});

// Test direct interaction with robust-command-runner
describe('Direct robust-command-runner Integration', () => {
  test('should execute commands directly with runCommand', async () => {
    const result = await runCommand('echo', ['Direct runner test'], {
      cwd: process.cwd(),
      timeout: 5000
    });
    
    expect(result).toBeDefined();
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Direct runner test');
  });
  
  test('should handle command errors gracefully', async () => {
    try {
      // Try to run a command that doesn't exist
      await runCommand('command-that-does-not-exist', [], {
        timeout: 5000
      });
      
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Verify error contains useful information
      expect(error).toBeDefined();
      expect(error.error).toBeDefined();
    }
  });
});
