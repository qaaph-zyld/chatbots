/**
 * Edge Case Tests for Command Executor
 * 
 * These tests verify the robustness of the command execution module
 * against various edge cases and error conditions.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Import the robust command runner
const { runCommand } = require('../../scripts/robust-command-runner');

describe('Command Executor Edge Cases', () => {
  // Setup temporary directory for test files
  const tempDir = path.join(os.tmpdir(), 'command-executor-edge-tests-' + Date.now());
  
  beforeAll(() => {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });
  
  afterAll(() => {
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Error cleaning up temp directory: ${err.message}`);
    }
  });
  
  test('should handle very long command output', async () => {
    // Create a script that generates a lot of output
    const scriptPath = path.join(tempDir, 'generate-long-output' + (os.platform() === 'win32' ? '.bat' : '.sh'));
    
    if (os.platform() === 'win32') {
      fs.writeFileSync(scriptPath, '@echo off\nfor /L %%i in (1,1,10000) do echo Line %%i of test output');
    } else {
      fs.writeFileSync(scriptPath, '#!/bin/bash\nfor i in {1..10000}; do echo "Line $i of test output"; done');
      fs.chmodSync(scriptPath, '755');
    }
    
    const result = await runCommand(scriptPath, tempDir, 30000);
    
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(50000);
    expect(result.stdout).toContain('Line 1 of test output');
    expect(result.stdout).toContain('Line 1000 of test output');
  }, 60000);
  
  test('should handle commands with special characters', async () => {
    const specialCharsFile = path.join(tempDir, 'special-chars.txt');
    const specialContent = 'Test with special chars: !@#$%^&*()_+-=[]{}|;:\'",.<>/?\\';
    
    fs.writeFileSync(specialCharsFile, specialContent);
    
    const command = os.platform() === 'win32'
      ? `type "${specialCharsFile}"`
      : `cat "${specialCharsFile}"`;
    
    const result = await runCommand(command, tempDir);
    
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(specialContent);
  });
  
  test('should handle commands with Unicode characters', async () => {
    const unicodeFile = path.join(tempDir, 'unicode.txt');
    const unicodeContent = 'Unicode test: 你好 こんにちは 안녕하세요 Привет مرحبا';
    
    fs.writeFileSync(unicodeFile, unicodeContent);
    
    const command = os.platform() === 'win32'
      ? `type "${unicodeFile}"`
      : `cat "${unicodeFile}"`;
    
    const result = await runCommand(command, tempDir);
    
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(unicodeContent);
  });
  
  test('should handle very long command lines', async () => {
    // Create a very long argument string
    const longArg = 'x'.repeat(5000);
    const echoCommand = os.platform() === 'win32'
      ? `echo ${longArg.substring(0, 100)}`  // Windows has command line length limits
      : `echo "${longArg}"`;
    
    const result = await runCommand(echoCommand, tempDir);
    
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBeDefined();
  });
  
  test('should handle commands with environment variables', async () => {
    const testEnvVar = 'TEST_ENV_VAR_' + Date.now();
    const testEnvValue = 'test-value-' + Date.now();
    
    // Set environment variable
    process.env[testEnvVar] = testEnvValue;
    
    const command = os.platform() === 'win32'
      ? `echo %${testEnvVar}%`
      : `echo $${testEnvVar}`;
    
    const result = await runCommand(command, tempDir);
    
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(testEnvValue);
    
    // Clean up
    delete process.env[testEnvVar];
  });
  
  test('should handle multiple commands in sequence', async () => {
    const file1 = path.join(tempDir, 'file1.txt');
    const file2 = path.join(tempDir, 'file2.txt');
    
    // Create test files
    fs.writeFileSync(file1, 'Content of file 1');
    fs.writeFileSync(file2, 'Content of file 2');
    
    const command = os.platform() === 'win32'
      ? `type "${file1}" && type "${file2}"`
      : `cat "${file1}" && cat "${file2}"`;
    
    const result = await runCommand(command, tempDir);
    
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Content of file 1');
    expect(result.stdout).toContain('Content of file 2');
  });
  
  test('should handle commands with input redirection', async () => {
    const inputFile = path.join(tempDir, 'input.txt');
    fs.writeFileSync(inputFile, 'Line 1\nLine 2\nLine 3');
    
    const command = os.platform() === 'win32'
      ? `findstr "Line" < "${inputFile}"`
      : `grep "Line" < "${inputFile}"`;
    
    const result = await runCommand(command, tempDir);
    
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Line 1');
    expect(result.stdout).toContain('Line 2');
    expect(result.stdout).toContain('Line 3');
  });
  
  test('should handle commands with output redirection', async () => {
    const outputFile = path.join(tempDir, 'output.txt');
    const content = 'Test output redirection';
    
    const command = os.platform() === 'win32'
      ? `echo ${content} > "${outputFile}"`
      : `echo "${content}" > "${outputFile}"`;
    
    const result = await runCommand(command, tempDir);
    
    expect(result).toBeDefined();
    expect(result.exitCode).toBe(0);
    
    // Verify file was created with correct content
    expect(fs.existsSync(outputFile)).toBe(true);
    expect(fs.readFileSync(outputFile, 'utf8').trim()).toBe(content);
  });
  
  test('should handle non-existent commands gracefully', async () => {
    const nonExistentCommand = 'command-that-does-not-exist-' + Date.now();
    
    const result = await runCommand(nonExistentCommand, tempDir);
    
    expect(result).toBeDefined();
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toBeDefined();
    expect(result.stderr.length).toBeGreaterThan(0);
  });
  
  test('should handle commands that exceed timeout', async () => {
    const sleepCommand = os.platform() === 'win32'
      ? 'timeout /t 5'
      : 'sleep 5';
    
    // Set timeout to 1 second
    const result = await runCommand(sleepCommand, tempDir, 1000);
    
    expect(result).toBeDefined();
    expect(result.timedOut).toBe(true);
    expect(result.exitCode).not.toBe(0);
  });
});
