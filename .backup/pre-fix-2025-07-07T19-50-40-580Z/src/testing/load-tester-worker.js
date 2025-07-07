/**
 * Load Tester Worker
 * 
 * This worker script handles the execution of load test scenarios
 * for a single worker thread in the load testing system.
 */

const { parentPort, workerData } = require('worker_threads');
const axios = require('axios');

// Extract configuration from worker data
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
      
      // Add query parameters if provided
      if (scenario.params) {
        requestConfig.params = typeof scenario.params === 'function' ?
          scenario.params(user) : scenario.params;
      }
      
      // Execute request
      try {
        const response = await axios(requestConfig);
        
        const requestEndTime = Date.now();
        const responseTime = requestEndTime - requestStartTime;
        
        // Validate response if validator provided
        let validationResult = { valid: true };
        if (scenario.validateResponse && typeof scenario.validateResponse === 'function') {
          try {
            validationResult = scenario.validateResponse(response);
          } catch (validationError) {
            validationResult = { 
              valid: false, 
              error: validationError.message 
            };
          }
        }
        
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
            success: validationResult.valid,
            statusCode: response.status,
            responseTime,
            timestamp: requestEndTime,
            validationResult: validationResult.valid ? undefined : validationResult,
            responseSize: JSON.stringify(response.data).length
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

// Handle messages from main thread
parentPort.on('message', (message) => {
  if (message.type === 'stop') {
    console.log(`Worker ${workerId} received stop command`);
    parentPort.postMessage({ type: 'complete' });
  }
});

// Notify main thread that worker is ready
parentPort.postMessage({
  type: 'ready',
  data: {
    workerId,
    numUsers
  }
});
