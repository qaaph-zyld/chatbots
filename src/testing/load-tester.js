/**
 * Load Testing Utility
 * 
 * This module provides tools for load testing the application to measure
 * performance under various load conditions and identify bottlenecks.
 */

const axios = require('axios');
const EventEmitter = require('events');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const path = require('path');
const fs = require('fs').promises;

class LoadTester extends EventEmitter {
  /**
   * Create a new load tester
   * @param {Object} options - Load tester configuration
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      baseUrl: options.baseUrl || 'http://localhost:3000',
      numUsers: options.numUsers || 100,
      duration: options.duration || 60, // seconds
      rampUp: options.rampUp || 10, // seconds
      requestsPerSecond: options.requestsPerSecond || 10,
      scenarios: options.scenarios || [],
      headers: options.headers || {},
      timeout: options.timeout || 10000, // 10 seconds
      workers: options.workers || Math.max(1, os.cpus().length - 1),
      outputFile: options.outputFile || './load-test-results.json',
      ...options
    };
    
    this.isRunning = false;
    this.workers = [];
    this.results = {
      summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalDuration: 0,
        averageResponseTime: 0,
        minResponseTime: Number.MAX_SAFE_INTEGER,
        maxResponseTime: 0,
        requestsPerSecond: 0,
        startTime: null,
        endTime: null
      },
      scenarios: {},
      errors: [],
      requestTimings: []
    };
    
    // Bind methods
    this._onWorkerMessage = this._onWorkerMessage.bind(this);
    this._onWorkerError = this._onWorkerError.bind(this);
    this._onWorkerExit = this._onWorkerExit.bind(this);
  }

  /**
   * Start the load test
   * @returns {Promise<Object>} Test results
   */
  async start() {
    if (this.isRunning) {
      throw new Error('Load test is already running');
    }
    
    if (!isMainThread) {
      throw new Error('Load test can only be started from the main thread');
    }
    
    if (this.options.scenarios.length === 0) {
      throw new Error('No scenarios defined for load test');
    }
    
    console.log(`Starting load test with ${this.options.numUsers} users, ${this.options.duration}s duration`);
    console.log(`Base URL: ${this.options.baseUrl}`);
    console.log(`Using ${this.options.workers} worker threads`);
    
    this.isRunning = true;
    this.results.summary.startTime = Date.now();
    
    // Initialize scenario results
    this.options.scenarios.forEach(scenario => {
      this.results.scenarios[scenario.name] = {
        name: scenario.name,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalDuration: 0,
        averageResponseTime: 0,
        minResponseTime: Number.MAX_SAFE_INTEGER,
        maxResponseTime: 0
      };
    });
    
    // Calculate users per worker
    const usersPerWorker = Math.ceil(this.options.numUsers / this.options.workers);
    
    // Start workers
    const workerPromises = [];
    
    for (let i = 0; i < this.options.workers; i++) {
      const workerUsers = Math.min(usersPerWorker, this.options.numUsers - (i * usersPerWorker));
      
      if (workerUsers <= 0) {
        break;
      }
      
      const workerPromise = new Promise((resolve, reject) => {
        const worker = new Worker(path.resolve(__dirname, './load-tester-worker.js'), {
          workerData: {
            workerId: i,
            baseUrl: this.options.baseUrl,
            numUsers: workerUsers,
            duration: this.options.duration,
            rampUp: this.options.rampUp,
            requestsPerSecond: this.options.requestsPerSecond,
            scenarios: this.options.scenarios,
            headers: this.options.headers,
            timeout: this.options.timeout
          }
        });
        
        worker.on('message', (message) => {
          this._onWorkerMessage(worker, message);
          
          if (message.type === 'complete') {
            resolve();
          }
        });
        
        worker.on('error', (error) => {
          this._onWorkerError(worker, error);
          reject(error);
        });
        
        worker.on('exit', (code) => {
          this._onWorkerExit(worker, code);
          
          if (code !== 0) {
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });
        
        this.workers.push(worker);
      });
      
      workerPromises.push(workerPromise);
    }
    
    // Wait for all workers to complete
    try {
      await Promise.all(workerPromises);
      
      // Calculate final results
      this._calculateFinalResults();
      
      // Save results to file
      await this._saveResults();
      
      console.log('Load test completed successfully');
      console.log(`Results saved to ${this.options.outputFile}`);
      
      this.emit('complete', this.results);
      
      return this.results;
    } catch (error) {
      console.error('Error during load test:', error);
      this.emit('error', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Stop the load test
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    console.log('Stopping load test');
    
    this.isRunning = false;
    
    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }
    
    this.workers = [];
    
    this.emit('stopped');
  }

  /**
   * Handle messages from workers
   * @private
   * @param {Worker} worker - Worker instance
   * @param {Object} message - Message from worker
   */
  _onWorkerMessage(worker, message) {
    if (message.type === 'result') {
      // Add result to results array
      this.results.requestTimings.push(message.data);
      
      // Update summary stats
      this.results.summary.totalRequests++;
      
      if (message.data.success) {
        this.results.summary.successfulRequests++;
      } else {
        this.results.summary.failedRequests++;
        this.results.errors.push({
          scenario: message.data.scenario,
          request: message.data.request,
          error: message.data.error,
          timestamp: message.data.timestamp
        });
      }
      
      // Update scenario stats
      const scenarioStats = this.results.scenarios[message.data.scenario];
      
      if (scenarioStats) {
        scenarioStats.totalRequests++;
        
        if (message.data.success) {
          scenarioStats.successfulRequests++;
          
          // Update response time stats
          const responseTime = message.data.responseTime;
          
          scenarioStats.totalDuration += responseTime;
          scenarioStats.averageResponseTime = scenarioStats.totalDuration / scenarioStats.successfulRequests;
          scenarioStats.minResponseTime = Math.min(scenarioStats.minResponseTime, responseTime);
          scenarioStats.maxResponseTime = Math.max(scenarioStats.maxResponseTime, responseTime);
        } else {
          scenarioStats.failedRequests++;
        }
      }
      
      // Emit result event
      this.emit('result', message.data);
    } else if (message.type === 'progress') {
      // Emit progress event
      this.emit('progress', message.data);
    }
  }

  /**
   * Handle worker errors
   * @private
   * @param {Worker} worker - Worker instance
   * @param {Error} error - Error from worker
   */
  _onWorkerError(worker, error) {
    console.error(`Worker error:`, error);
    this.emit('workerError', { workerId: worker.threadId, error });
  }

  /**
   * Handle worker exit
   * @private
   * @param {Worker} worker - Worker instance
   * @param {number} code - Exit code
   */
  _onWorkerExit(worker, code) {
    console.log(`Worker ${worker.threadId} exited with code ${code}`);
    this.emit('workerExit', { workerId: worker.threadId, code });
  }

  /**
   * Calculate final test results
   * @private
   */
  _calculateFinalResults() {
    const summary = this.results.summary;
    
    summary.endTime = Date.now();
    summary.totalDuration = (summary.endTime - summary.startTime) / 1000; // in seconds
    
    // Calculate overall response time stats
    const successfulRequests = this.results.requestTimings.filter(r => r.success);
    
    if (successfulRequests.length > 0) {
      const totalResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0);
      summary.averageResponseTime = totalResponseTime / successfulRequests.length;
      summary.minResponseTime = Math.min(...successfulRequests.map(r => r.responseTime));
      summary.maxResponseTime = Math.max(...successfulRequests.map(r => r.responseTime));
    } else {
      summary.minResponseTime = 0;
    }
    
    // Calculate requests per second
    summary.requestsPerSecond = summary.totalRequests / summary.totalDuration;
    
    // Calculate percentiles
    if (successfulRequests.length > 0) {
      const sortedResponseTimes = successfulRequests
        .map(r => r.responseTime)
        .sort((a, b) => a - b);
      
      summary.percentiles = {
        p50: this._calculatePercentile(sortedResponseTimes, 50),
        p75: this._calculatePercentile(sortedResponseTimes, 75),
        p90: this._calculatePercentile(sortedResponseTimes, 90),
        p95: this._calculatePercentile(sortedResponseTimes, 95),
        p99: this._calculatePercentile(sortedResponseTimes, 99)
      };
    }
    
    // Add timestamp
    summary.timestamp = new Date().toISOString();
  }

  /**
   * Calculate a percentile from sorted values
   * @private
   * @param {Array<number>} sortedValues - Sorted array of values
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  _calculatePercentile(sortedValues, percentile) {
    if (sortedValues.length === 0) {
      return 0;
    }
    
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[index];
  }

  /**
   * Save test results to file
   * @private
   * @returns {Promise<void>}
   */
  async _saveResults() {
    try {
      const outputDir = path.dirname(this.options.outputFile);
      
      // Create directory if it doesn't exist
      await fs.mkdir(outputDir, { recursive: true });
      
      // Write results to file
      await fs.writeFile(
        this.options.outputFile,
        JSON.stringify(this.results, null, 2)
      );
    } catch (error) {
      console.error('Error saving results:', error);
      throw error;
    }
  }

  /**
   * Generate a load test report
   * @param {string} format - Report format ('json', 'html', 'text')
   * @returns {Promise<string>} Report content
   */
  async generateReport(format = 'text') {
    if (format === 'json') {
      return JSON.stringify(this.results, null, 2);
    } else if (format === 'html') {
      return this._generateHtmlReport();
    } else {
      return this._generateTextReport();
    }
  }

  /**
   * Generate a text report
   * @private
   * @returns {string} Text report
   */
  _generateTextReport() {
    const summary = this.results.summary;
    const scenarios = Object.values(this.results.scenarios);
    
    let report = '=== LOAD TEST REPORT ===\n\n';
    
    // Summary
    report += 'SUMMARY\n';
    report += '-------\n';
    report += `Duration: ${summary.totalDuration.toFixed(2)}s\n`;
    report += `Total Requests: ${summary.totalRequests}\n`;
    report += `Successful Requests: ${summary.successfulRequests} (${((summary.successfulRequests / summary.totalRequests) * 100).toFixed(2)}%)\n`;
    report += `Failed Requests: ${summary.failedRequests} (${((summary.failedRequests / summary.totalRequests) * 100).toFixed(2)}%)\n`;
    report += `Requests Per Second: ${summary.requestsPerSecond.toFixed(2)}\n`;
    report += `Average Response Time: ${summary.averageResponseTime.toFixed(2)}ms\n`;
    report += `Min Response Time: ${summary.minResponseTime}ms\n`;
    report += `Max Response Time: ${summary.maxResponseTime}ms\n`;
    
    if (summary.percentiles) {
      report += '\nPERCENTILES\n';
      report += '-----------\n';
      report += `50th Percentile (P50): ${summary.percentiles.p50.toFixed(2)}ms\n`;
      report += `75th Percentile (P75): ${summary.percentiles.p75.toFixed(2)}ms\n`;
      report += `90th Percentile (P90): ${summary.percentiles.p90.toFixed(2)}ms\n`;
      report += `95th Percentile (P95): ${summary.percentiles.p95.toFixed(2)}ms\n`;
      report += `99th Percentile (P99): ${summary.percentiles.p99.toFixed(2)}ms\n`;
    }
    
    // Scenarios
    report += '\nSCENARIOS\n';
    report += '---------\n';
    
    scenarios.forEach(scenario => {
      report += `\n${scenario.name}\n`;
      report += `${'='.repeat(scenario.name.length)}\n`;
      report += `Requests: ${scenario.totalRequests}\n`;
      report += `Success: ${scenario.successfulRequests} (${((scenario.successfulRequests / scenario.totalRequests) * 100).toFixed(2)}%)\n`;
      report += `Failed: ${scenario.failedRequests} (${((scenario.failedRequests / scenario.totalRequests) * 100).toFixed(2)}%)\n`;
      report += `Average Response Time: ${scenario.averageResponseTime.toFixed(2)}ms\n`;
      report += `Min Response Time: ${scenario.minResponseTime}ms\n`;
      report += `Max Response Time: ${scenario.maxResponseTime}ms\n`;
    });
    
    // Errors
    if (this.results.errors.length > 0) {
      report += '\nERRORS\n';
      report += '------\n';
      
      // Group errors by type
      const errorGroups = {};
      
      this.results.errors.forEach(error => {
        const key = `${error.scenario} - ${error.error.message || 'Unknown error'}`;
        
        if (!errorGroups[key]) {
          errorGroups[key] = {
            scenario: error.scenario,
            error: error.error,
            count: 0
          };
        }
        
        errorGroups[key].count++;
      });
      
      Object.values(errorGroups)
        .sort((a, b) => b.count - a.count)
        .forEach(group => {
          report += `\n[${group.scenario}] ${group.error.message || 'Unknown error'} (${group.count} occurrences)\n`;
        });
    }
    
    return report;
  }

  /**
   * Generate an HTML report
   * @private
   * @returns {string} HTML report
   */
  _generateHtmlReport() {
    const summary = this.results.summary;
    const scenarios = Object.values(this.results.scenarios);
    
    // Convert errors to a format suitable for the report
    const errorGroups = {};
    this.results.errors.forEach(error => {
      const key = `${error.scenario} - ${error.error.message || 'Unknown error'}`;
      
      if (!errorGroups[key]) {
        errorGroups[key] = {
          scenario: error.scenario,
          error: error.error,
          count: 0
        };
      }
      
      errorGroups[key].count++;
    });
    
    const errorsList = Object.values(errorGroups)
      .sort((a, b) => b.count - a.count);
    
    // Generate HTML
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Load Test Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #2c3e50;
          }
          .summary {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .percentiles {
            background-color: #e9ecef;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .scenarios {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .scenario {
            background-color: #f8f9fa;
            border-radius: 5px;
            padding: 20px;
          }
          .errors {
            background-color: #f8d7da;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
          }
          .chart-container {
            height: 300px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Load Test Report</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
        
        <div class="summary">
          <h2>Summary</h2>
          <table>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
            <tr>
              <td>Duration</td>
              <td>${summary.totalDuration.toFixed(2)}s</td>
            </tr>
            <tr>
              <td>Total Requests</td>
              <td>${summary.totalRequests}</td>
            </tr>
            <tr>
              <td>Successful Requests</td>
              <td>${summary.successfulRequests} (${((summary.successfulRequests / summary.totalRequests) * 100).toFixed(2)}%)</td>
            </tr>
            <tr>
              <td>Failed Requests</td>
              <td>${summary.failedRequests} (${((summary.failedRequests / summary.totalRequests) * 100).toFixed(2)}%)</td>
            </tr>
            <tr>
              <td>Requests Per Second</td>
              <td>${summary.requestsPerSecond.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Average Response Time</td>
              <td>${summary.averageResponseTime.toFixed(2)}ms</td>
            </tr>
            <tr>
              <td>Min Response Time</td>
              <td>${summary.minResponseTime}ms</td>
            </tr>
            <tr>
              <td>Max Response Time</td>
              <td>${summary.maxResponseTime}ms</td>
            </tr>
          </table>
        </div>
        
        ${summary.percentiles ? `
        <div class="percentiles">
          <h2>Percentiles</h2>
          <table>
            <tr>
              <th>Percentile</th>
              <th>Response Time (ms)</th>
            </tr>
            <tr>
              <td>50th (P50)</td>
              <td>${summary.percentiles.p50.toFixed(2)}</td>
            </tr>
            <tr>
              <td>75th (P75)</td>
              <td>${summary.percentiles.p75.toFixed(2)}</td>
            </tr>
            <tr>
              <td>90th (P90)</td>
              <td>${summary.percentiles.p90.toFixed(2)}</td>
            </tr>
            <tr>
              <td>95th (P95)</td>
              <td>${summary.percentiles.p95.toFixed(2)}</td>
            </tr>
            <tr>
              <td>99th (P99)</td>
              <td>${summary.percentiles.p99.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        ` : ''}
        
        <h2>Scenarios</h2>
        <div class="scenarios">
          ${scenarios.map(scenario => `
            <div class="scenario">
              <h3>${scenario.name}</h3>
              <table>
                <tr>
                  <td>Requests</td>
                  <td>${scenario.totalRequests}</td>
                </tr>
                <tr>
                  <td>Success</td>
                  <td>${scenario.successfulRequests} (${((scenario.successfulRequests / scenario.totalRequests) * 100).toFixed(2)}%)</td>
                </tr>
                <tr>
                  <td>Failed</td>
                  <td>${scenario.failedRequests} (${((scenario.failedRequests / scenario.totalRequests) * 100).toFixed(2)}%)</td>
                </tr>
                <tr>
                  <td>Average Response Time</td>
                  <td>${scenario.averageResponseTime.toFixed(2)}ms</td>
                </tr>
                <tr>
                  <td>Min Response Time</td>
                  <td>${scenario.minResponseTime}ms</td>
                </tr>
                <tr>
                  <td>Max Response Time</td>
                  <td>${scenario.maxResponseTime}ms</td>
                </tr>
              </table>
            </div>
          `).join('')}
        </div>
        
        ${errorsList.length > 0 ? `
        <div class="errors">
          <h2>Errors</h2>
          <table>
            <tr>
              <th>Scenario</th>
              <th>Error</th>
              <th>Count</th>
            </tr>
            ${errorsList.map(error => `
              <tr>
                <td>${error.scenario}</td>
                <td>${error.error.message || 'Unknown error'}</td>
                <td>${error.count}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        ` : ''}
      </body>
      </html>
    `;
  }
}

// If this is a worker thread, execute worker code
if (!isMainThread) {
  const {
    workerId,
    baseUrl,
    numUsers,
    duration,
    rampUp,
    requestsPerSecond,
    scenarios,
    headers,
    timeout
  } = workerData;
  
  console.log(`Worker ${workerId} started with ${numUsers} users`);
  
  // Create virtual users
  const users = [];
  
  for (let i = 0; i < numUsers; i++) {
    users.push({
      id: `user-${workerId}-${i}`,
      startTime: Date.now() + (i * (rampUp * 1000 / numUsers))
    });
  }
  
  // Calculate delay between requests
  const requestDelay = 1000 / (requestsPerSecond / numUsers);
  
  // Start test
  const startTime = Date.now();
  const endTime = startTime + (duration * 1000);
  
  // Execute requests
  const executeRequests = async () => {
    const currentTime = Date.now();
    
    // Check if test is complete
    if (currentTime >= endTime) {
      parentPort.postMessage({ type: 'complete' });
      return;
    }
    
    // Execute requests for active users
    const activeUsers = users.filter(user => currentTime >= user.startTime);
    
    for (const user of activeUsers) {
      // Select a random scenario
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      // Execute scenario
      try {
        const requestStartTime = Date.now();
        
        // Create request config
        const requestConfig = {
          method: scenario.method || 'GET',
          url: `${baseUrl}${scenario.endpoint}`,
          headers: {
            ...headers,
            ...scenario.headers
          },
          timeout
        };
        
        // Add request body if provided
        if (scenario.body) {
          requestConfig.data = typeof scenario.body === 'function' ? 
            scenario.body(user) : scenario.body;
        }
        
        // Execute request
        try {
          const response = await axios(requestConfig);
          
          const requestEndTime = Date.now();
          const responseTime = requestEndTime - requestStartTime;
          
          // Send result to main thread
          parentPort.postMessage({
            type: 'result',
            data: {
              userId: user.id,
              scenario: scenario.name,
              request: {
                method: requestConfig.method,
                url: requestConfig.url
              },
              success: true,
              statusCode: response.status,
              responseTime,
              timestamp: requestEndTime
            }
          });
        } catch (error) {
          const requestEndTime = Date.now();
          const responseTime = requestEndTime - requestStartTime;
          
          // Send error to main thread
          parentPort.postMessage({
            type: 'result',
            data: {
              userId: user.id,
              scenario: scenario.name,
              request: {
                method: requestConfig.method,
                url: requestConfig.url
              },
              success: false,
              error: {
                message: error.message,
                code: error.code,
                response: error.response ? {
                  status: error.response.status,
                  statusText: error.response.statusText
                } : null
              },
              responseTime,
              timestamp: requestEndTime
            }
          });
        }
      } catch (error) {
        console.error(`Error executing scenario ${scenario.name}:`, error);
      }
    }
    
    // Send progress update
    parentPort.postMessage({
      type: 'progress',
      data: {
        workerId,
        activeUsers: activeUsers.length,
        totalUsers: numUsers,
        progress: Math.min(100, ((currentTime - startTime) / (duration * 1000)) * 100),
        elapsedTime: (currentTime - startTime) / 1000,
        remainingTime: Math.max(0, (endTime - currentTime) / 1000)
      }
    });
    
    // Schedule next execution
    setTimeout(executeRequests, requestDelay);
  };
  
  // Start executing requests
  executeRequests();
}

module.exports = LoadTester;
