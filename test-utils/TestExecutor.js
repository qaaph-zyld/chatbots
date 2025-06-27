/**
 * TestExecutor - Responsible for executing test commands and handling process management
 * 
 * This class extracts the test execution logic from TestAutomationRunner to improve
 * maintainability and separation of concerns.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestExecutor {
  /**
   * Creates a new TestExecutor instance
   * 
   * @param {Object} options - Configuration options
   * @param {number} options.networkTimeoutMs - Timeout for network operations in milliseconds
   * @param {string} options.outputDir - Directory for output files
   * @param {Object} options.logger - Logger instance (optional)
   */
  constructor(options = {}) {
    this.networkTimeoutMs = options.networkTimeoutMs || 120000; // 2 minutes default
    this.outputDir = options.outputDir || path.join(process.cwd(), 'test-results');
    this.logger = options.logger;
    
    // Ensure output directory exists
    this.ensureOutputDirectoryExists();
  }
  
  /**
   * Ensures the output directory exists, creating it if necessary
   * 
   * @private
   */
  ensureOutputDirectoryExists() {
    if (!fs.existsSync(this.outputDir)) {
      try {
        fs.mkdirSync(this.outputDir, { recursive: true });
        console.log(`Created output directory: ${this.outputDir}`);
      } catch (error) {
        console.error(`Failed to create output directory: ${error.message}`);
        throw new Error(`Cannot create output directory: ${error.message}`);
      }
    }
  }
  
  /**
   * Executes a command and returns the results using spawn for better I/O handling
   * 
   * @param {string} command - Command to execute
   * @param {Object} options - Execution options
   * @param {number} options.timeout - Command timeout in milliseconds
   * @param {boolean} options.captureOutput - Whether to capture stdout/stderr to files
   * @returns {Promise<Object>} - Promise resolving to command results
   */
  async runCommand(command, options = {}) {
    const timeout = options.timeout || this.networkTimeoutMs;
    const captureOutput = options.captureOutput !== false;
    
    // Generate unique filenames for stdout/stderr if capturing output
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const stdoutFile = captureOutput ? path.join(this.outputDir, `stdout-${timestamp}.txt`) : null;
    const stderrFile = captureOutput ? path.join(this.outputDir, `stderr-${timestamp}.txt`) : null;
    
    // Log command execution
    if (this.logger) {
      this.logger.info(`Executing command: ${command}`, { timeout });
    } else {
      console.log(`Executing command: ${command} (timeout: ${timeout}ms)`);
    }
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      
      // Split the command into command and args for spawn
      const parts = command.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);
      
      // Create stdout/stderr write streams if capturing output
      const stdoutStream = stdoutFile ? fs.createWriteStream(stdoutFile) : null;
      const stderrStream = stderrFile ? fs.createWriteStream(stderrFile) : null;
      
      // Spawn the process
      const childProcess = spawn(cmd, args, {
        shell: true,
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe'
      });
      
      // Set up stdout handling
      childProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        
        if (stdoutStream) {
          stdoutStream.write(chunk);
        }
        
        if (options.onStdout) {
          options.onStdout(chunk);
        }
      });
      
      // Set up stderr handling
      childProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        
        if (stderrStream) {
          stderrStream.write(chunk);
        }
        
        if (options.onStderr) {
          options.onStderr(chunk);
        }
      });
      
      // Handle process completion
      childProcess.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Close output streams if they exist
        if (stdoutStream) stdoutStream.end();
        if (stderrStream) stderrStream.end();
        
        const result = {
          command,
          exitCode: code,
          stdout,
          stderr,
          duration,
          stdoutFile: stdoutFile || null,
          stderrFile: stderrFile || null
        };
        
        if (this.logger) {
          this.logger.info(`Command completed with exit code ${code}`, {
            duration,
            command
          });
        } else {
          console.log(`Command completed with exit code ${code} (${duration}ms)`);
        }
        
        resolve(result);
      });
      
      // Handle process errors
      childProcess.on('error', (error) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Close output streams if they exist
        if (stdoutStream) stdoutStream.end();
        if (stderrStream) stderrStream.end();
        
        if (this.logger) {
          this.logger.error(`Command failed: ${error.message}`, {
            duration,
            command,
            error: error.toString()
          });
        } else {
          console.error(`Command failed: ${error.message}`);
        }
        
        reject(new Error(`Command failed: ${error.message}`));
      });
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        childProcess.kill();
        
        // Close output streams if they exist
        if (stdoutStream) stdoutStream.end();
        if (stderrStream) stderrStream.end();
        
        if (this.logger) {
          this.logger.error(`Command timed out after ${timeout}ms`, {
            command,
            timeout
          });
        } else {
          console.error(`Command timed out after ${timeout}ms`);
        }
        
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);
      
      // Clear timeout when process completes
      childProcess.on('close', () => {
        clearTimeout(timeoutId);
      });
      
      childProcess.on('error', () => {
        clearTimeout(timeoutId);
      });
    });
  }
  
  /**
   * Runs a test command with the specified options
   * 
   * @param {string} testCommand - Test command to execute
   * @param {Object} options - Test execution options
   * @returns {Promise<Object>} - Test execution results
   */
  async runTest(testCommand, options = {}) {
    const timeout = options.timeout || this.networkTimeoutMs;
    
    if (this.logger) {
      this.logger.info(`Running test: ${testCommand}`, { timeout });
    } else {
      console.log(`Running test: ${testCommand} (timeout: ${timeout}ms)`);
    }
    
    try {
      const result = await this.runCommand(testCommand, {
        timeout,
        captureOutput: true,
        onStdout: options.onStdout,
        onStderr: options.onStderr
      });
      
      return result;
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Test execution failed: ${error.message}`);
      } else {
        console.error(`Test execution failed: ${error.message}`);
      }
      
      throw error;
    }
  }
}

module.exports = TestExecutor;
