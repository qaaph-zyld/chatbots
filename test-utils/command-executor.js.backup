/**
 * Command Executor - A wrapper around the robust command runner for test automation
 * 
 * This module provides a reliable way to execute commands for test automation,
 * with proper error handling, timeout detection, periodic status checks, and output capture.
 * 
 * Enhanced with automatic status checks every 60 seconds to prevent hanging.
 */

const path = require('path');
const fs = require('fs');
const { runCommand, runNodeScript, escapeShellArg } = require('../scripts/robust-command-runner');

class CommandExecutor {
  /**
   * Create a new CommandExecutor instance
   * @param {Object} options - Configuration options
   * @param {string} options.outputDir - Directory for output files
   * @param {number} options.defaultTimeout - Default command timeout in ms
   * @param {number} options.progressTimeout - Time without output before warning in ms
   * @param {boolean} options.verbose - Whether to log verbose output
   */
  constructor(options = {}) {
    this.options = {
      outputDir: path.join(process.cwd(), 'test-results'),
      defaultTimeout: 120000, // 2 minutes
      progressTimeout: 10000, // 10 seconds
      checkIntervalMs: 60000, // Check status every 60 seconds
      maxExecutionTimeMs: 300000, // 5 minutes max execution time
      verbose: true,
      ...options
    };
    
    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
    
    this.lastCommand = null;
    this.commandHistory = [];
    this.statusLogFile = path.join(this.options.outputDir, 'command-status.log');
    
    // Initialize status log
    this.logStatus('CommandExecutor initialized');
  }
  
  /**
   * Log status to file
   * @param {string} message - Status message
   */
  logStatus(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    if (this.options.verbose) {
      console.log(logEntry.trim());
    }
    
    try {
      fs.appendFileSync(this.statusLogFile, logEntry);
    } catch (error) {
      console.error('Failed to write to status log:', error);
    }
  }

  /**
   * Run a command with robust error handling and periodic status checks
   * @param {string} command - Command to run
   * @param {string[]} args - Command arguments
   * @param {Object} options - Command options
   * @returns {Promise<Object>} - Command result
   */
  async runCommand(command, args = [], options = {}) {
    const cmdId = `${command}-${Date.now()}`;
    const startTime = Date.now();
    let statusCheckInterval = null;
    let timeoutId = null;
    
    const cmdOptions = {
      cwd: process.cwd(),
      timeout: this.options.defaultTimeout,
      progressTimeout: this.options.progressTimeout,
      ...options
    };
    
    this.logStatus(`Starting command: ${command} ${args.map(escapeShellArg).join(' ')}`);
    this.logStatus(`Working directory: ${cmdOptions.cwd}`);
    
    if (this.options.verbose) {
      console.log(`[CommandExecutor] Running: ${command} ${args.map(escapeShellArg).join(' ')}`);
      console.log(`[CommandExecutor] Working directory: ${cmdOptions.cwd}`);
    }
    
    try {
      // Set up status check interval
      statusCheckInterval = setInterval(() => {
        const elapsedMs = Date.now() - startTime;
        this.logStatus(`Status check for command ${cmdId}: Running for ${Math.round(elapsedMs / 1000)}s`);
        
        // Check if command has been running too long
        if (elapsedMs > this.options.maxExecutionTimeMs) {
          this.logStatus(`Command ${cmdId} exceeded maximum execution time (${this.options.maxExecutionTimeMs}ms), will terminate`);
          clearInterval(statusCheckInterval);
          // The command will be terminated in the finally block
        }
      }, this.options.checkIntervalMs);
      
      // Set overall timeout
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Command timed out after ${this.options.maxExecutionTimeMs}ms`));
        }, this.options.maxExecutionTimeMs);
      });
      
      // Run the command with a race against the timeout
      const commandPromise = runCommand(command, args, cmdOptions);
      const result = await Promise.race([commandPromise, timeoutPromise]);
      
      // Command completed successfully
      this.logStatus(`Command ${cmdId} completed with exit code: ${result.code}`);
      
      // Store command history
      this.lastCommand = {
        id: cmdId,
        command,
        args,
        options: cmdOptions,
        result,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: result.code === 0
      };
      
      this.commandHistory.push(this.lastCommand);
      
      if (this.options.verbose) {
        console.log(`[CommandExecutor] Command completed with exit code: ${result.code}`);
        console.log(`[CommandExecutor] Duration: ${result.duration}ms`);
        console.log(`[CommandExecutor] Output files: ${result.stdoutFile}, ${result.stderrFile}, ${result.statusFile}`);
      }
      
      return result;
    } catch (error) {
      // Handle command errors
      this.logStatus(`Command ${cmdId} failed: ${error.message}`);
      
      const errorInfo = {
        id: cmdId,
        command,
        args,
        options: cmdOptions,
        error: error.error || error,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        startTime: new Date(startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false
      };
      
      this.lastCommand = errorInfo;
      this.commandHistory.push(errorInfo);
      
      if (this.options.verbose) {
        console.error(`[CommandExecutor] Command failed with error: ${error.error ? error.error.message : 'Unknown error'}`);
        console.error(`[CommandExecutor] Duration: ${error.duration || 0}ms`);
      }
      
      throw error;
    } finally {
      // Clean up
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
  
  /**
   * Run a Node.js script with robust error handling
   * @param {string} scriptContent - JavaScript code to execute
   * @param {Object} options - Script options
   * @returns {Promise<Object>} - Script result
   */
  async runNodeScript(scriptContent, options = {}) {
    const scriptOptions = {
      timeout: this.options.defaultTimeout,
      progressTimeout: this.options.progressTimeout,
      ...options
    };
    
    if (this.options.verbose) {
      console.log(`[CommandExecutor] Running Node.js script (${scriptContent.length} bytes)`);
    }
    
    try {
      const result = await runNodeScript(scriptContent, scriptOptions);
      
      // Store command history
      this.lastCommand = {
        type: 'node-script',
        scriptLength: scriptContent.length,
        options: scriptOptions,
        result,
        timestamp: new Date().toISOString(),
        success: result.code === 0
      };
      
      this.commandHistory.push(this.lastCommand);
      
      if (this.options.verbose) {
        console.log(`[CommandExecutor] Script completed with exit code: ${result.code}`);
        console.log(`[CommandExecutor] Duration: ${result.duration}ms`);
        console.log(`[CommandExecutor] Output files: ${result.stdoutFile}, ${result.stderrFile}, ${result.statusFile}`);
      }
      
      return result;
    } catch (error) {
      // Handle script errors
      const errorInfo = {
        type: 'node-script',
        scriptLength: scriptContent.length,
        options: scriptOptions,
        error: error.error || error,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        duration: error.duration || 0,
        timestamp: new Date().toISOString(),
        success: false
      };
      
      this.lastCommand = errorInfo;
      this.commandHistory.push(errorInfo);
      
      if (this.options.verbose) {
        console.error(`[CommandExecutor] Script failed with error: ${error.error ? error.error.message : 'Unknown error'}`);
        console.error(`[CommandExecutor] Duration: ${error.duration || 0}ms`);
        if (error.stdoutFile) console.log(`[CommandExecutor] Output files: ${error.stdoutFile}, ${error.stderrFile}, ${error.statusFile}`);
      }
      
      throw error;
    }
  }
  
  /**
   * Run npm command with proper error handling
   * @param {string[]} args - npm command arguments
   * @param {Object} options - Command options
   * @returns {Promise<Object>} - Command result
   */
  async runNpmCommand(args = [], options = {}) {
    return this.runCommand('npm', args, options);
  }
  
  /**
   * Run Jest tests with proper error handling
   * @param {string} testPattern - Optional test pattern
   * @param {Object} options - Command options
   * @returns {Promise<Object>} - Test result
   */
  async runJestTests(testPattern = '', options = {}) {
    const args = ['test'];
    if (testPattern) {
      args.push(testPattern);
    }
    
    return this.runNpmCommand(args, {
      timeout: 120000, // 2 minutes
      ...options
    });
  }
  
  /**
   * Run ESLint with proper error handling
   * @param {string} targetPath - Path to lint
   * @param {Object} options - Command options
   * @returns {Promise<Object>} - Lint result
   */
  async runESLint(targetPath, options = {}) {
    return this.runCommand('npx', ['eslint', targetPath], {
      timeout: 60000, // 1 minute
      ...options
    });
  }
  
  /**
   * Get command execution history
   * @returns {Array} - Command history
   */
  getCommandHistory() {
    return this.commandHistory;
  }
  
  /**
   * Get the last command execution
   * @returns {Object|null} - Last command info
   */
  getLastCommand() {
    return this.lastCommand;
  }
  
  /**
   * Save command history to file
   * @param {string} filename - Output filename
   * @returns {string} - Path to saved file
   */
  saveCommandHistory(filename = 'command-history.json') {
    const outputPath = path.join(this.options.outputDir, filename);
    
    fs.writeFileSync(outputPath, JSON.stringify({
      history: this.commandHistory,
      timestamp: new Date().toISOString(),
      count: this.commandHistory.length
    }, null, 2));
    
    return outputPath;
  }
}

module.exports = CommandExecutor;
