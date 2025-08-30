/**
 * Performance Tests for Command Executor
 * 
 * These tests evaluate the performance characteristics of the command execution module
 * under various load conditions and resource constraints.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// Import the robust command runner
const { runCommand } = require('../../scripts/robust-command-runner');

describe('Command Executor Performance', () => {
  // Setup temporary directory for test files
  const tempDir = path.join(os.tmpdir(), 'command-executor-perf-tests-' + Date.now());
  
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
  
  test('should handle multiple concurrent commands efficiently', async () => {
    // Create a simple echo script
    const scriptPath = path.join(tempDir, 'echo-script' + (os.platform() === 'win32' ? '.bat' : '.sh'));
    
    if (os.platform() === 'win32') {
      fs.writeFileSync(scriptPath, '@echo off\necho %1\ntimeout /t 1 > nul');
    } else {
      fs.writeFileSync(scriptPath, '#!/bin/bash\necho $1\nsleep 1');
      fs.chmodSync(scriptPath, '755');
    }
    
    const startTime = Date.now();
    
    // Run 5 commands concurrently
    const promises = [];
    for (let i = 1; i <= 5; i++) {
      const command = os.platform() === 'win32'
        ? `${scriptPath} "Test ${i}"`
        : `${scriptPath} "Test ${i}"`;
      
      promises.push(runCommand(command, tempDir));
    }
    
    const results = await Promise.all(promises);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // All commands should succeed
    results.forEach((result, index) => {
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(`Test ${index + 1}`);
    });
    
    // Total time should be less than running them sequentially
    // If truly sequential, it would take at least 5 seconds (5 * 1s sleep)
    // With concurrency, it should be closer to 1-2 seconds plus overhead
    console.log(`Concurrent execution time: ${totalTime}ms`);
    expect(totalTime).toBeLessThan(5000);
  }, 30000);
  
  test('should handle high CPU load efficiently', async () => {
    // Create a CPU-intensive script
    const scriptPath = path.join(tempDir, 'cpu-intensive' + (os.platform() === 'win32' ? '.js' : '.js'));
    
    const scriptContent = `
      // CPU-intensive calculation
      function calculatePrimes(max) {
        const sieve = Array(max).fill(true);
        sieve[0] = sieve[1] = false;
        
        for (let i = 2; i * i < max; i++) {
          if (sieve[i]) {
            for (let j = i * i; j < max; j += i) {
              sieve[j] = false;
            }
          }
        }
        
        return sieve.reduce((count, isPrime, index) => {
          if (isPrime) {
            console.log(\`Prime: \${index}\`);
            return count + 1;
          }
          return count;
        }, 0);
      }
      
      const count = calculatePrimes(100000);
      console.log(\`Found \${count} prime numbers\`);
    `;
    
    fs.writeFileSync(scriptPath, scriptContent);
    
    const startTime = Date.now();
    const result = await runCommand(`node "${scriptPath}"`, tempDir);
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Found');
    expect(result.stdout).toContain('prime numbers');
    
    // Log execution time for analysis
    console.log(`CPU-intensive execution time: ${executionTime}ms`);
  }, 30000);
  
  test('should handle memory-intensive commands', async () => {
    // Create a memory-intensive script
    const scriptPath = path.join(tempDir, 'memory-intensive.js');
    
    const scriptContent = `
      // Memory-intensive operation
      function consumeMemory() {
        const arrays = [];
        const size = 1024 * 1024; // 1MB per array
        const count = 50; // Allocate ~50MB
        
        console.log('Starting memory allocation...');
        
        for (let i = 0; i < count; i++) {
          const array = new Array(size).fill('X');
          arrays.push(array);
          console.log(\`Allocated array \${i+1}/\${count}\`);
        }
        
        console.log('Memory allocation complete');
        console.log(\`Total allocated: ~\${count}MB\`);
        
        // Hold the memory for a moment
        return arrays.length;
      }
      
      const result = consumeMemory();
      console.log(\`Operation complete with \${result} arrays\`);
    `;
    
    fs.writeFileSync(scriptPath, scriptContent);
    
    const startTime = Date.now();
    const result = await runCommand(`node "${scriptPath}"`, tempDir);
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Memory allocation complete');
    expect(result.stdout).toContain('Operation complete');
    
    // Log execution time for analysis
    console.log(`Memory-intensive execution time: ${executionTime}ms`);
  }, 30000);
  
  test('should handle I/O-intensive commands', async () => {
    // Create an I/O-intensive script
    const scriptPath = path.join(tempDir, 'io-intensive' + (os.platform() === 'win32' ? '.js' : '.js'));
    const testDir = path.join(tempDir, 'io-test');
    
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const scriptContent = `
      const fs = require('fs');
      const path = require('path');
      
      const testDir = '${testDir.replace(/\\/g, '\\\\')}';
      const fileCount = 100;
      const fileSize = 10240; // 10KB per file
      
      console.log('Starting I/O operations...');
      
      // Write files
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(testDir, \`file-\${i}.txt\`);
        const content = 'X'.repeat(fileSize);
        fs.writeFileSync(filePath, content);
        
        if (i % 10 === 0) {
          console.log(\`Written \${i} files\`);
        }
      }
      
      console.log('Write operations complete');
      
      // Read files
      let totalSize = 0;
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(testDir, \`file-\${i}.txt\`);
        const content = fs.readFileSync(filePath, 'utf8');
        totalSize += content.length;
        
        if (i % 10 === 0) {
          console.log(\`Read \${i} files\`);
        }
      }
      
      console.log('Read operations complete');
      console.log(\`Total bytes read: \${totalSize}\`);
      
      // Delete files
      for (let i = 0; i < fileCount; i++) {
        const filePath = path.join(testDir, \`file-\${i}.txt\`);
        fs.unlinkSync(filePath);
      }
      
      console.log('Delete operations complete');
    `;
    
    fs.writeFileSync(scriptPath, scriptContent);
    
    const startTime = Date.now();
    const result = await runCommand(`node "${scriptPath}"`, tempDir);
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Write operations complete');
    expect(result.stdout).toContain('Read operations complete');
    expect(result.stdout).toContain('Delete operations complete');
    
    // Log execution time for analysis
    console.log(`I/O-intensive execution time: ${executionTime}ms`);
  }, 60000);
  
  test('should handle long-running commands with progress monitoring', async () => {
    // Create a long-running script with progress output
    const scriptPath = path.join(tempDir, 'long-running' + (os.platform() === 'win32' ? '.js' : '.js'));
    
    const scriptContent = `
      // Long-running operation with progress updates
      function longRunningTask() {
        const iterations = 10;
        const delayMs = 500;
        
        console.log('Starting long-running task...');
        
        for (let i = 1; i <= iterations; i++) {
          // Simulate work
          const startTime = Date.now();
          while (Date.now() - startTime < delayMs) {
            // CPU busy-wait
            for (let j = 0; j < 1000000; j++) {
              Math.sqrt(j);
            }
          }
          
          // Report progress
          console.log(\`Progress: \${i * 10}% complete\`);
        }
        
        console.log('Long-running task complete');
      }
      
      longRunningTask();
    `;
    
    fs.writeFileSync(scriptPath, scriptContent);
    
    const startTime = Date.now();
    const result = await runCommand(`node "${scriptPath}"`, tempDir);
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Starting long-running task');
    expect(result.stdout).toContain('Progress: 10% complete');
    expect(result.stdout).toContain('Progress: 50% complete');
    expect(result.stdout).toContain('Progress: 100% complete');
    expect(result.stdout).toContain('Long-running task complete');
    
    // Log execution time for analysis
    console.log(`Long-running task execution time: ${executionTime}ms`);
    
    // Execution time should be at least 5 seconds (10 iterations * 500ms)
    expect(executionTime).toBeGreaterThan(5000);
  }, 30000);
  
  test('should handle rapid successive command executions', async () => {
    const commandCount = 20;
    const commands = [];
    
    // Create a series of quick commands
    for (let i = 1; i <= commandCount; i++) {
      const command = os.platform() === 'win32'
        ? `echo Test command ${i}`
        : `echo "Test command ${i}"`;
      
      commands.push(command);
    }
    
    const startTime = Date.now();
    
    // Execute commands in rapid succession
    for (const command of commands) {
      const result = await runCommand(command, tempDir);
      expect(result.exitCode).toBe(0);
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const averageTime = totalTime / commandCount;
    
    console.log(`Executed ${commandCount} commands in ${totalTime}ms`);
    console.log(`Average time per command: ${averageTime}ms`);
    
    // Each command should be reasonably fast
    expect(averageTime).toBeLessThan(500);
  });
});
