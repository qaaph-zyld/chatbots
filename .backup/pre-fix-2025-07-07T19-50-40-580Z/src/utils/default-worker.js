/**
 * Default Worker Thread
 * 
 * This is the default worker thread script used by the worker pool.
 * It handles task execution and communicates results back to the main thread.
 */

const { parentPort, workerData } = require('worker_threads');

// Worker ID from worker data
const workerId = workerData.workerId;

console.log(`Worker ${workerId} started`);

// Handle messages from the main thread
parentPort.on('message', async (message) => {
  if (message.type === 'task') {
    const taskId = message.id;
    const task = message.task;
    
    try {
      // Log task received
      console.log(`Worker ${workerId} received task ${taskId} of type ${task.type}`);
      
      // Execute the task
      const result = await executeTask(task);
      
      // Send result back to main thread
      parentPort.postMessage({
        type: 'result',
        id: taskId,
        result
      });
      
      // Log task completed
      console.log(`Worker ${workerId} completed task ${taskId}`);
    } catch (error) {
      // Send error back to main thread
      parentPort.postMessage({
        type: 'error',
        id: taskId,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
      
      // Log task error
      console.error(`Worker ${workerId} error on task ${taskId}:`, error);
    }
  }
});

/**
 * Execute a task based on its type
 * @param {Object} task - Task to execute
 * @param {string} task.type - Task type
 * @param {Object} task.data - Task data
 * @returns {Promise<any>} Task result
 */
async function executeTask(task) {
  switch (task.type) {
    case 'compute':
      return handleComputeTask(task.data);
    case 'process-text':
      return handleTextProcessingTask(task.data);
    case 'analyze-data':
      return handleDataAnalysisTask(task.data);
    case 'custom':
      return handleCustomTask(task.data);
    default:
      throw new Error(`Unknown task type: ${task.type}`);
  }
}

/**
 * Handle CPU-intensive computation tasks
 * @param {Object} data - Task data
 * @returns {Promise<any>} Computation result
 */
async function handleComputeTask(data) {
  // Example computation task
  if (data.operation === 'fibonacci') {
    return calculateFibonacci(data.n);
  } else if (data.operation === 'prime') {
    return findPrimes(data.min, data.max);
  } else if (data.operation === 'matrix') {
    return multiplyMatrices(data.matrixA, data.matrixB);
  }
  
  throw new Error(`Unknown compute operation: ${data.operation}`);
}

/**
 * Handle text processing tasks
 * @param {Object} data - Task data
 * @returns {Promise<any>} Processing result
 */
async function handleTextProcessingTask(data) {
  // Example text processing task
  if (data.operation === 'tokenize') {
    return tokenizeText(data.text);
  } else if (data.operation === 'sentiment') {
    return analyzeSentiment(data.text);
  } else if (data.operation === 'extract') {
    return extractEntities(data.text);
  }
  
  throw new Error(`Unknown text processing operation: ${data.operation}`);
}

/**
 * Handle data analysis tasks
 * @param {Object} data - Task data
 * @returns {Promise<any>} Analysis result
 */
async function handleDataAnalysisTask(data) {
  // Example data analysis task
  if (data.operation === 'aggregate') {
    return aggregateData(data.items);
  } else if (data.operation === 'filter') {
    return filterData(data.items, data.criteria);
  } else if (data.operation === 'transform') {
    return transformData(data.items, data.transformation);
  }
  
  throw new Error(`Unknown data analysis operation: ${data.operation}`);
}

/**
 * Handle custom tasks
 * @param {Object} data - Task data
 * @returns {Promise<any>} Task result
 */
async function handleCustomTask(data) {
  // Custom tasks should provide their own implementation
  if (typeof data.execute === 'function') {
    return data.execute();
  } else if (data.code) {
    // WARNING: Evaluating code is potentially dangerous
    // This is just for demonstration purposes
    // eslint-disable-next-line no-new-func
    const fn = new Function('data', data.code);
    return fn(data);
  }
  
  throw new Error('Custom task must provide either execute function or code');
}

/**
 * Calculate Fibonacci number (CPU-intensive example)
 * @param {number} n - Position in Fibonacci sequence
 * @returns {number} Fibonacci number
 */
function calculateFibonacci(n) {
  if (n <= 1) return n;
  
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  
  return b;
}

/**
 * Find prime numbers in a range (CPU-intensive example)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Array<number>} Prime numbers
 */
function findPrimes(min, max) {
  const primes = [];
  
  for (let num = Math.max(2, min); num <= max; num++) {
    let isPrime = true;
    
    for (let i = 2, sqrt = Math.sqrt(num); i <= sqrt; i++) {
      if (num % i === 0) {
        isPrime = false;
        break;
      }
    }
    
    if (isPrime) {
      primes.push(num);
    }
  }
  
  return primes;
}

/**
 * Multiply two matrices (CPU-intensive example)
 * @param {Array<Array<number>>} matrixA - First matrix
 * @param {Array<Array<number>>} matrixB - Second matrix
 * @returns {Array<Array<number>>} Result matrix
 */
function multiplyMatrices(matrixA, matrixB) {
  const rowsA = matrixA.length;
  const colsA = matrixA[0].length;
  const colsB = matrixB[0].length;
  
  // Initialize result matrix with zeros
  const result = Array(rowsA).fill().map(() => Array(colsB).fill(0));
  
  // Multiply matrices
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += matrixA[i][k] * matrixB[k][j];
      }
    }
  }
  
  return result;
}

/**
 * Tokenize text into words (example text processing)
 * @param {string} text - Input text
 * @returns {Array<string>} Tokens
 */
function tokenizeText(text) {
  // Simple tokenization by splitting on whitespace and removing punctuation
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Analyze sentiment of text (example text processing)
 * @param {string} text - Input text
 * @returns {Object} Sentiment analysis result
 */
function analyzeSentiment(text) {
  // This is a very simplified example
  // In a real application, you would use a proper NLP library
  
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'like'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'dislike'];
  
  const tokens = tokenizeText(text);
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  tokens.forEach(token => {
    if (positiveWords.includes(token)) {
      positiveCount++;
    } else if (negativeWords.includes(token)) {
      negativeCount++;
    }
  });
  
  const score = (positiveCount - negativeCount) / tokens.length;
  
  return {
    score,
    positive: positiveCount,
    negative: negativeCount,
    neutral: tokens.length - positiveCount - negativeCount,
    sentiment: score > 0.05 ? 'positive' : score < -0.05 ? 'negative' : 'neutral'
  };
}

/**
 * Extract entities from text (example text processing)
 * @param {string} text - Input text
 * @returns {Object} Extracted entities
 */
function extractEntities(text) {
  // This is a very simplified example
  // In a real application, you would use a proper NLP library
  
  const entities = {
    emails: [],
    urls: [],
    dates: [],
    numbers: []
  };
  
  // Extract emails
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
  entities.emails = text.match(emailRegex) || [];
  
  // Extract URLs
  const urlRegex = /https?:\/\/[^\s]+/g;
  entities.urls = text.match(urlRegex) || [];
  
  // Extract dates (simple format)
  const dateRegex = /\d{1,2}\/\d{1,2}\/\d{2,4}/g;
  entities.dates = text.match(dateRegex) || [];
  
  // Extract numbers
  const numberRegex = /\b\d+(?:\.\d+)?\b/g;
  entities.numbers = text.match(numberRegex) || [];
  
  return entities;
}

/**
 * Aggregate data (example data analysis)
 * @param {Array<Object>} items - Data items
 * @returns {Object} Aggregation result
 */
function aggregateData(items) {
  // Example: Calculate sum, average, min, max for numeric fields
  const result = {};
  
  if (items.length === 0) {
    return result;
  }
  
  // Get numeric fields from the first item
  const numericFields = Object.keys(items[0]).filter(key => {
    return typeof items[0][key] === 'number';
  });
  
  // Initialize aggregation for each numeric field
  numericFields.forEach(field => {
    result[field] = {
      sum: 0,
      avg: 0,
      min: Number.MAX_VALUE,
      max: Number.MIN_VALUE,
      count: items.length
    };
  });
  
  // Calculate aggregations
  items.forEach(item => {
    numericFields.forEach(field => {
      const value = item[field];
      
      result[field].sum += value;
      result[field].min = Math.min(result[field].min, value);
      result[field].max = Math.max(result[field].max, value);
    });
  });
  
  // Calculate averages
  numericFields.forEach(field => {
    result[field].avg = result[field].sum / items.length;
  });
  
  return result;
}

/**
 * Filter data based on criteria (example data analysis)
 * @param {Array<Object>} items - Data items
 * @param {Object} criteria - Filter criteria
 * @returns {Array<Object>} Filtered items
 */
function filterData(items, criteria) {
  return items.filter(item => {
    // Check if item matches all criteria
    return Object.entries(criteria).every(([field, value]) => {
      // Handle different types of criteria
      if (typeof value === 'object' && value !== null) {
        if (value.$eq !== undefined) return item[field] === value.$eq;
        if (value.$ne !== undefined) return item[field] !== value.$ne;
        if (value.$gt !== undefined) return item[field] > value.$gt;
        if (value.$gte !== undefined) return item[field] >= value.$gte;
        if (value.$lt !== undefined) return item[field] < value.$lt;
        if (value.$lte !== undefined) return item[field] <= value.$lte;
        if (value.$in !== undefined) return value.$in.includes(item[field]);
        if (value.$nin !== undefined) return !value.$nin.includes(item[field]);
      }
      
      // Simple equality check
      return item[field] === value;
    });
  });
}

/**
 * Transform data using a transformation function (example data analysis)
 * @param {Array<Object>} items - Data items
 * @param {Object} transformation - Transformation specification
 * @returns {Array<Object>} Transformed items
 */
function transformData(items, transformation) {
  // Apply projection if specified
  if (transformation.project) {
    const fields = transformation.project;
    
    return items.map(item => {
      const result = {};
      
      fields.forEach(field => {
        if (typeof field === 'string') {
          // Simple field projection
          result[field] = item[field];
        } else if (typeof field === 'object') {
          // Computed field
          const [name, expression] = Object.entries(field)[0];
          // eslint-disable-next-line no-new-func
          const compute = new Function('item', `return ${expression}`);
          result[name] = compute(item);
        }
      });
      
      return result;
    });
  }
  
  // Apply map function if specified
  if (transformation.map && typeof transformation.map === 'function') {
    return items.map(transformation.map);
  }
  
  // Apply reduce function if specified
  if (transformation.reduce && typeof transformation.reduce === 'function') {
    return items.reduce(transformation.reduce, transformation.initial || {});
  }
  
  return items;
}

// Notify main thread that worker is ready
parentPort.postMessage({
  type: 'ready',
  workerId
});
