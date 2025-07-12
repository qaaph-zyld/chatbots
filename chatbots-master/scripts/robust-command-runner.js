/**
 * Robust command runner for reliable command execution
 * Addresses issues with the run_command tool
 */
const childProcess = require('child_process');
const { spawn } = childProcess;
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Escape command arguments for shell execution
 * @param {string} arg - Command argument to escape
 * @returns {string} - Escaped argument
 */
function escapeShellArg(arg) {
  if (typeof arg !== 'string') {
    return arg;
  }
  
  if (os.platform() === 'win32') {
    // Windows escaping - wrap in quotes and escape internal quotes
    if (arg.includes('"')) {
      arg = arg.replace(/"/g, '\\"');
    }
    if (arg.includes(' ') || arg.includes('&') || arg.includes('|') || 
        arg.includes('<') || arg.includes('>') || arg.includes('^')) {
      return `"${arg}"`;
    }
    return arg;
  } else {
    // Unix escaping
    return arg.replace(/(["`$\\!])/g, '\\$1');
  }
}

/**
 * Escape JavaScript code for node -e execution
 * @param {string} code - JavaScript code to escape
 * @returns {string} - Escaped code
 */
function escapeNodeEval(code) {
  if (os.platform() === 'win32') {
    // For Windows PowerShell, we need to escape quotes differently
    return `"${code.replace(/"/g, '\\"').replace(/'/g, "\\'")}"`;
  }
  // For Unix-like systems
  return `'${code.replace(/'/g, "\\'")}'`;
}

/**
 * Run a command with robust error handling and output streaming
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @param {object} options - Command options
 * @returns {Promise<object>} - Promise resolving to command result
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    // Default options
    const opts = {
      cwd: process.cwd(),
      timeout: 30000,
      progressTimeout: 10000, // Time without output before warning
      shell: true,
      ...options
    };
    
    // Create output files for logging
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const outputDir = path.join(process.cwd(), 'test-results');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const stdoutFile = path.join(outputDir, `stdout-${timestamp}.txt`);
    const stderrFile = path.join(outputDir, `stderr-${timestamp}.txt`);
    const statusFile = path.join(outputDir, `status-${timestamp}.json`);
    
    // Log command execution
    console.log(`Executing: ${command} ${args.map(escapeShellArg).join(' ')}`);
    console.log(`Working directory: ${opts.cwd}`);
    console.log(`Output files: ${stdoutFile}, ${stderrFile}`);
    
    // Create write streams for output files
    const stdoutStream = fs.createWriteStream(stdoutFile);
    const stderrStream = fs.createWriteStream(stderrFile);
    
    // Track execution state
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let timeoutId = null;
    let progressTimeoutId = null;
    let lastOutputTime = Date.now();
    let isRunning = true;
    
    // Write initial status to file without referencing childProcess
    const writeStatus = (status, childProc = null) => {
      const statusData = {
        command: `${command} ${args.join(' ')}`,
        cwd: opts.cwd,
        startTime: new Date(startTime).toISOString(),
        currentTime: new Date().toISOString(),
        duration: Date.now() - startTime,
        status,
        exitCode: null,
        pid: childProc ? childProc.pid : null
      };
      
      fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2));
      return statusData;
    };
    
    // Write initial status before spawning process
    writeStatus('starting');
    
    // Write command info to output files
    const commandInfo = `Command: ${command} ${args.join(' ')}\nWorking directory: ${opts.cwd}\nTimestamp: ${timestamp}\n\n`;
    stdoutStream.write(commandInfo);
    stderrStream.write(commandInfo);
    
    // Progress monitoring function
    const checkProgress = (childProc) => {
      if (!isRunning) return;
      
      const timeSinceOutput = Date.now() - lastOutputTime;
      if (timeSinceOutput > opts.progressTimeout) {
        console.warn(`\n[WARNING] No output received for ${Math.floor(timeSinceOutput/1000)}s`);
        fs.appendFileSync(stderrFile, `\n[WARNING] No output received for ${Math.floor(timeSinceOutput/1000)}s\n`);
        writeStatus('stalled', childProc);
      }
      
      // Reset the progress timeout
      progressTimeoutId = setTimeout(() => checkProgress(childProc), Math.min(5000, opts.progressTimeout / 2));
    };
    
    try {
      // Spawn process
      const childProcess = spawn(command, args, {
        cwd: opts.cwd,
        shell: opts.shell,
        stdio: 'pipe'
      });
      
      // Update PID in command info
      stdoutStream.write(`PID: ${childProcess.pid}\n\n`);
      stderrStream.write(`PID: ${childProcess.pid}\n\n`);
      
      // Update status with PID
      writeStatus('running', childProcess);
      
      // Start progress monitoring after process is spawned
      progressTimeoutId = setTimeout(() => checkProgress(childProcess), opts.progressTimeout);
      
      // Create timeout handler
      if (opts.timeout > 0) {
        timeoutId = setTimeout(() => {
          if (childProcess && !childProcess.killed) {
            childProcess.kill();
            const error = new Error(`Command timed out after ${opts.timeout}ms`);
            error.code = 'TIMEOUT';
            
            // Write error to stderr file
            fs.appendFileSync(stderrFile, `\n[ERROR] Command timed out after ${opts.timeout}ms\n`);
            writeStatus('timeout', childProcess);
            
            isRunning = false;
            if (progressTimeoutId) clearTimeout(progressTimeoutId);
            
            reject({ error, stdout, stderr, duration: Date.now() - startTime, stdoutFile, stderrFile, statusFile });
          }
        }, opts.timeout);
      }
      
      // Handle stdout
      childProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        process.stdout.write(chunk);
        stdoutStream.write(chunk);
        
        // Update last output time
        lastOutputTime = Date.now();
      });
      
      // Handle stderr
      childProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        process.stderr.write(chunk);
        stderrStream.write(chunk);
        
        // Update last output time
        lastOutputTime = Date.now();
      });
      
      // Handle process completion
      childProcess.on('close', (code, signal) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (progressTimeoutId) clearTimeout(progressTimeoutId);
        
        isRunning = false;
        
        // Write completion info to output files
        const completionInfo = `\n\nCommand completed with exit code: ${code}\nDuration: ${Date.now() - startTime}ms\n`;
        stdoutStream.write(completionInfo);
        stderrStream.write(completionInfo);
        
        // Close output streams
        stdoutStream.end();
        stderrStream.end();
        
        // Update status
        writeStatus(code === 0 ? 'success' : 'failed', childProcess);
        
        resolve({
          code,
          signal,
          stdout,
          stderr,
          duration: Date.now() - startTime,
          stdoutFile,
          stderrFile,
          statusFile
        });
      });
      
      // Handle process errors
      childProcess.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (progressTimeoutId) clearTimeout(progressTimeoutId);
        
        isRunning = false;
        
        // Write error info to output files
        const errorInfo = `\n\nCommand failed with error: ${error.message}\nDuration: ${Date.now() - startTime}ms\n`;
        stdoutStream.write(errorInfo);
        stderrStream.write(errorInfo);
        
        // Close output streams
        stdoutStream.end();
        stderrStream.end();
        
        // Update status
        writeStatus('error', childProcess);
        
        reject({
          error,
          stdout,
          stderr,
          duration: Date.now() - startTime,
          stdoutFile,
          stderrFile,
          statusFile
        });
      });
    } catch (error) {
      // Handle any errors during process spawning
      isRunning = false;
      
      // Write error info to output files
      const errorInfo = `\n\nFailed to spawn process: ${error.message}\nDuration: ${Date.now() - startTime}ms\n`;
      stdoutStream.write(errorInfo);
      stderrStream.write(errorInfo);
      
      // Close output streams
      stdoutStream.end();
      stderrStream.end();
      
      // Update status
      writeStatus('spawn_error');
      
      reject({
        error,
        stdout,
        stderr,
        duration: Date.now() - startTime,
        stdoutFile,
        stderrFile,
        statusFile
      });
    }
  });
}

/**
 * Run a Node.js script with proper argument handling
 * @param {string} scriptContent - JavaScript code to run
 * @param {object} options - Command options
 * @returns {Promise<object>} - Promise resolving to command result
 */
function runNodeScript(scriptContent, options = {}) {
  // Create a temporary script file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const tempDir = path.join(process.cwd(), 'test-results', 'temp-scripts');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const scriptFile = path.join(tempDir, `script-${timestamp}.js`);
  fs.writeFileSync(scriptFile, scriptContent);
  
  // Run the script
  return runCommand('node', [scriptFile], options)
    .finally(() => {
      // Clean up the temporary script file
      try {
        fs.unlinkSync(scriptFile);
      } catch (error) {
        console.error(`Failed to delete temporary script file: ${error.message}`);
      }
    });
}

// Export functions for use in other modules
module.exports = {
  runCommand,
  runNodeScript,
  escapeShellArg,
  escapeNodeEval
};

// If run directly from command line
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node robust-command-runner.js <command> [args...]');
    process.exit(1);
  }
  
  const command = args[0];
  const commandArgs = args.slice(1);
  
  // Run the command
  runCommand(command, commandArgs, {
    cwd: process.cwd(),
    timeout: 60000
  })
    .then((result) => {
      console.log(`Command completed with exit code: ${result.code}`);
      console.log(`Output written to: ${result.stdoutFile}, ${result.stderrFile}`);
      process.exit(result.code);
    })
    .catch((error) => {
      console.error(`Command failed: ${error.error ? error.error.message : 'Unknown error'}`);
      process.exit(1);
    });
}
