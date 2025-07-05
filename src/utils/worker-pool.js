/**
 * Worker Thread Pool
 * 
 * This module implements a worker thread pool for offloading CPU-intensive operations
 * to improve application responsiveness and utilize multi-core processors efficiently.
 */

const { Worker } = require('worker_threads');
const os = require('os');
const path = require('path');
const EventEmitter = require('events');

class WorkerPool extends EventEmitter {
  /**
   * Create a new worker pool
   * @param {Object} options - Pool configuration options
   * @param {number} options.size - Number of workers in the pool (default: number of CPU cores)
   * @param {string} options.workerScript - Path to the worker script
   * @param {Object} options.workerOptions - Options to pass to each worker
   */
  constructor(options = {}) {
    super();
    
    this.size = options.size || os.cpus().length;
    this.workerScript = options.workerScript || path.resolve(__dirname, './default-worker.js');
    this.workerOptions = options.workerOptions || {};
    
    this.workers = [];
    this.taskQueue = [];
    this.activeWorkers = new Map();
    this.isInitialized = false;
    this.isShuttingDown = false;
    
    // Statistics
    this.stats = {
      totalTasksSubmitted: 0,
      totalTasksCompleted: 0,
      totalTasksFailed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0
    };
  }

  /**
   * Initialize the worker pool
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }
    
    try {
      console.log(`Initializing worker pool with ${this.size} workers`);
      
      // Create workers
      for (let i = 0; i < this.size; i++) {
        const worker = new Worker(this.workerScript, {
          workerData: {
            workerId: i,
            ...this.workerOptions
          }
        });
        
        // Set up event listeners
        worker.on('message', (message) => this._handleWorkerMessage(worker, message));
        worker.on('error', (error) => this._handleWorkerError(worker, error));
        worker.on('exit', (code) => this._handleWorkerExit(worker, code));
        
        // Store worker
        this.workers.push({
          worker,
          id: i,
          status: 'idle',
          taskId: null,
          startTime: null
        });
      }
      
      this.isInitialized = true;
      this.emit('initialized');
      
      console.log('Worker pool initialized successfully');
    } catch (error) {
      console.error('Failed to initialize worker pool:', error);
      throw error;
    }
  }

  /**
   * Submit a task to the worker pool
   * @param {Object} task - Task to execute
   * @param {string} task.type - Task type
   * @param {Object} task.data - Task data
   * @returns {Promise<any>} Task result
   */
  async submitTask(task) {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down, cannot accept new tasks');
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    this.stats.totalTasksSubmitted++;
    
    return new Promise((resolve, reject) => {
      const taskWrapper = {
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        task,
        resolve,
        reject,
        submittedAt: Date.now()
      };
      
      // Try to find an idle worker
      const idleWorker = this.workers.find(w => w.status === 'idle');
      
      if (idleWorker) {
        this._assignTaskToWorker(idleWorker, taskWrapper);
      } else {
        // No idle workers, queue the task
        this.taskQueue.push(taskWrapper);
      }
    });
  }

  /**
   * Assign a task to a worker
   * @private
   * @param {Object} workerInfo - Worker information
   * @param {Object} taskWrapper - Task wrapper
   */
  _assignTaskToWorker(workerInfo, taskWrapper) {
    try {
      // Update worker status
      workerInfo.status = 'busy';
      workerInfo.taskId = taskWrapper.id;
      workerInfo.startTime = Date.now();
      
      // Store task in active workers map
      this.activeWorkers.set(taskWrapper.id, {
        workerInfo,
        taskWrapper
      });
      
      // Send task to worker
      workerInfo.worker.postMessage({
        type: 'task',
        id: taskWrapper.id,
        task: taskWrapper.task
      });
      
      // Emit event
      this.emit('taskAssigned', {
        taskId: taskWrapper.id,
        workerId: workerInfo.id,
        task: taskWrapper.task
      });
    } catch (error) {
      console.error(`Error assigning task ${taskWrapper.id} to worker ${workerInfo.id}:`, error);
      
      // Reset worker status
      workerInfo.status = 'idle';
      workerInfo.taskId = null;
      workerInfo.startTime = null;
      
      // Remove from active workers
      this.activeWorkers.delete(taskWrapper.id);
      
      // Reject the task
      taskWrapper.reject(error);
      
      // Update stats
      this.stats.totalTasksFailed++;
    }
  }

  /**
   * Handle a message from a worker
   * @private
   * @param {Worker} worker - Worker instance
   * @param {Object} message - Message from worker
   */
  _handleWorkerMessage(worker, message) {
    if (message.type === 'result') {
      const activeTask = this.activeWorkers.get(message.id);
      
      if (activeTask) {
        const { workerInfo, taskWrapper } = activeTask;
        
        // Calculate processing time
        const processingTime = Date.now() - workerInfo.startTime;
        
        // Update stats
        this.stats.totalTasksCompleted++;
        this.stats.totalProcessingTime += processingTime;
        this.stats.averageProcessingTime = this.stats.totalProcessingTime / this.stats.totalTasksCompleted;
        
        // Reset worker status
        workerInfo.status = 'idle';
        workerInfo.taskId = null;
        workerInfo.startTime = null;
        
        // Remove from active workers
        this.activeWorkers.delete(message.id);
        
        // Resolve the task
        taskWrapper.resolve(message.result);
        
        // Emit event
        this.emit('taskCompleted', {
          taskId: message.id,
          workerId: workerInfo.id,
          processingTime
        });
        
        // Check if there are queued tasks
        if (this.taskQueue.length > 0) {
          const nextTask = this.taskQueue.shift();
          this._assignTaskToWorker(workerInfo, nextTask);
        }
      }
    }
  }

  /**
   * Handle an error from a worker
   * @private
   * @param {Worker} worker - Worker instance
   * @param {Error} error - Error from worker
   */
  _handleWorkerError(worker, error) {
    // Find the worker info
    const workerInfo = this.workers.find(w => w.worker === worker);
    
    if (workerInfo && workerInfo.taskId) {
      const activeTask = this.activeWorkers.get(workerInfo.taskId);
      
      if (activeTask) {
        const { taskWrapper } = activeTask;
        
        // Update stats
        this.stats.totalTasksFailed++;
        
        // Remove from active workers
        this.activeWorkers.delete(workerInfo.taskId);
        
        // Reject the task
        taskWrapper.reject(error);
        
        // Emit event
        this.emit('taskFailed', {
          taskId: workerInfo.taskId,
          workerId: workerInfo.id,
          error
        });
      }
    }
    
    // Emit worker error event
    this.emit('workerError', {
      workerId: workerInfo ? workerInfo.id : 'unknown',
      error
    });
    
    // Restart the worker
    this._restartWorker(workerInfo);
  }

  /**
   * Handle a worker exit
   * @private
   * @param {Worker} worker - Worker instance
   * @param {number} code - Exit code
   */
  _handleWorkerExit(worker, code) {
    // Find the worker info
    const workerInfo = this.workers.find(w => w.worker === worker);
    
    if (workerInfo) {
      console.log(`Worker ${workerInfo.id} exited with code ${code}`);
      
      // Emit worker exit event
      this.emit('workerExit', {
        workerId: workerInfo.id,
        code
      });
      
      // If not shutting down, restart the worker
      if (!this.isShuttingDown) {
        this._restartWorker(workerInfo);
      }
    }
  }

  /**
   * Restart a worker
   * @private
   * @param {Object} workerInfo - Worker information
   */
  _restartWorker(workerInfo) {
    if (!workerInfo || this.isShuttingDown) {
      return;
    }
    
    try {
      console.log(`Restarting worker ${workerInfo.id}`);
      
      // Create a new worker
      const worker = new Worker(this.workerScript, {
        workerData: {
          workerId: workerInfo.id,
          ...this.workerOptions
        }
      });
      
      // Set up event listeners
      worker.on('message', (message) => this._handleWorkerMessage(worker, message));
      worker.on('error', (error) => this._handleWorkerError(worker, error));
      worker.on('exit', (code) => this._handleWorkerExit(worker, code));
      
      // Update worker info
      workerInfo.worker = worker;
      workerInfo.status = 'idle';
      workerInfo.taskId = null;
      workerInfo.startTime = null;
      
      // Emit worker restart event
      this.emit('workerRestarted', {
        workerId: workerInfo.id
      });
      
      // Check if there are queued tasks
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        this._assignTaskToWorker(workerInfo, nextTask);
      }
    } catch (error) {
      console.error(`Error restarting worker ${workerInfo.id}:`, error);
      
      // Emit worker restart failed event
      this.emit('workerRestartFailed', {
        workerId: workerInfo.id,
        error
      });
    }
  }

  /**
   * Get pool statistics
   * @returns {Object} Pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.size,
      queueLength: this.taskQueue.length,
      activeWorkers: this.activeWorkers.size,
      idleWorkers: this.workers.filter(w => w.status === 'idle').length
    };
  }

  /**
   * Shutdown the worker pool
   * @param {Object} options - Shutdown options
   * @param {boolean} options.force - Force shutdown even with active tasks
   * @param {number} options.timeout - Timeout in ms to wait for tasks to complete
   * @returns {Promise<void>}
   */
  async shutdown(options = {}) {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    
    const force = options.force === true;
    const timeout = options.timeout || 5000;
    
    console.log(`Shutting down worker pool (force=${force}, timeout=${timeout}ms)`);
    
    return new Promise((resolve) => {
      // If force shutdown or no active tasks, terminate immediately
      if (force || this.activeWorkers.size === 0) {
        this._terminateAllWorkers();
        resolve();
        return;
      }
      
      // Wait for active tasks to complete
      const timeoutId = setTimeout(() => {
        console.log(`Shutdown timeout reached, terminating ${this.activeWorkers.size} active workers`);
        this._terminateAllWorkers();
        resolve();
      }, timeout);
      
      // Check if all tasks completed
      const checkInterval = setInterval(() => {
        if (this.activeWorkers.size === 0) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          this._terminateAllWorkers();
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Terminate all workers
   * @private
   */
  _terminateAllWorkers() {
    for (const workerInfo of this.workers) {
      try {
        workerInfo.worker.terminate();
      } catch (error) {
        console.error(`Error terminating worker ${workerInfo.id}:`, error);
      }
    }
    
    this.workers = [];
    this.activeWorkers.clear();
    this.taskQueue = [];
    this.isInitialized = false;
    
    console.log('Worker pool shutdown complete');
    this.emit('shutdown');
  }
}

module.exports = WorkerPool;
