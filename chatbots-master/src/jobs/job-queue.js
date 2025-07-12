/**
 * Background Job Queue System
 * 
 * This module implements a background job processing system for handling
 * asynchronous tasks, improving application responsiveness and scalability.
 */

const { EventEmitter } = require('events');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Get Redis connection details from environment variables
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'chatbots:jobs:';

// Job status constants
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DELAYED: 'delayed',
  CANCELLED: 'cancelled'
};

// Job priority constants
const JOB_PRIORITY = {
  LOW: 10,
  NORMAL: 5,
  HIGH: 1,
  CRITICAL: 0
};

/**
 * Job Schema for MongoDB
 */
const jobSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: Object.values(JOB_STATUS),
    default: JOB_STATUS.PENDING,
    index: true
  },
  priority: {
    type: Number,
    default: JOB_PRIORITY.NORMAL,
    index: true
  },
  progress: {
    type: Number,
    default: 0
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  delay: {
    type: Number,
    default: 0
  },
  timeout: {
    type: Number,
    default: 60000 // 1 minute
  },
  result: mongoose.Schema.Types.Mixed,
  error: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  failedAt: Date,
  processedBy: String
}, {
  timestamps: true
});

/**
 * Job Queue class for managing background jobs
 */
class JobQueue extends EventEmitter {
  /**
   * Create a new job queue
   * @param {Object} options - Queue configuration options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      name: options.name || 'default',
      concurrency: options.concurrency || os.cpus().length,
      pollInterval: options.pollInterval || 1000,
      stalledTimeout: options.stalledTimeout || 30000,
      retryDelay: options.retryDelay || 5000,
      ...options
    };
    
    this.handlers = new Map();
    this.processing = new Map();
    this.isRunning = false;
    this.workerId = `${os.hostname()}-${process.pid}-${uuidv4().substring(0, 8)}`;
    
    // Initialize Redis client
    this.redis = new Redis(REDIS_URI, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true
    });
    
    // Handle Redis errors
    this.redis.on('error', (error) => {
      console.error('Redis error:', error);
      this.emit('error', error);
    });
    
    // Initialize MongoDB model
    this.Job = mongoose.model('Job', jobSchema);
    
    // Bind methods
    this._processNextJob = this._processNextJob.bind(this);
    this._checkStalledJobs = this._checkStalledJobs.bind(this);
  }

  /**
   * Register a job handler
   * @param {string} jobType - Type of job to handle
   * @param {Function} handler - Job handler function
   * @returns {JobQueue} This queue instance for chaining
   */
  register(jobType, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Job handler must be a function');
    }
    
    this.handlers.set(jobType, handler);
    console.log(`Registered handler for job type: ${jobType}`);
    
    return this;
  }

  /**
   * Start the job queue processor
   * @returns {Promise<void>}
   */
  async start() {
    if (this.isRunning) {
      return;
    }
    
    console.log(`Starting job queue '${this.options.name}' with concurrency ${this.options.concurrency}`);
    
    this.isRunning = true;
    
    // Start processing jobs
    this._startProcessing();
    
    // Start checking for stalled jobs
    this._startStalledJobsCheck();
    
    this.emit('started');
  }

  /**
   * Stop the job queue processor
   * @param {Object} options - Stop options
   * @param {boolean} options.force - Force stop even with active jobs
   * @param {number} options.timeout - Timeout in ms to wait for jobs to complete
   * @returns {Promise<void>}
   */
  async stop(options = {}) {
    if (!this.isRunning) {
      return;
    }
    
    const force = options.force === true;
    const timeout = options.timeout || 5000;
    
    console.log(`Stopping job queue '${this.options.name}' (force=${force}, timeout=${timeout}ms)`);
    
    this.isRunning = false;
    
    // Clear intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    if (this.stalledJobsInterval) {
      clearInterval(this.stalledJobsInterval);
      this.stalledJobsInterval = null;
    }
    
    // Wait for active jobs to complete
    if (!force && this.processing.size > 0) {
      console.log(`Waiting for ${this.processing.size} active jobs to complete`);
      
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.processing.size === 0) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Set timeout
        setTimeout(() => {
          clearInterval(checkInterval);
          console.log(`Timeout reached, force stopping with ${this.processing.size} active jobs`);
          resolve();
        }, timeout);
      });
    }
    
    // Close Redis connection
    await this.redis.quit();
    
    this.emit('stopped');
  }

  /**
   * Create a new job
   * @param {string} jobType - Type of job
   * @param {Object} data - Job data
   * @param {Object} options - Job options
   * @returns {Promise<Object>} Created job
   */
  async createJob(jobType, data = {}, options = {}) {
    // Validate job type
    if (!jobType) {
      throw new Error('Job type is required');
    }
    
    // Create job document
    const job = new this.Job({
      id: uuidv4(),
      type: jobType,
      data,
      priority: options.priority || JOB_PRIORITY.NORMAL,
      delay: options.delay || 0,
      timeout: options.timeout || 60000,
      maxAttempts: options.maxAttempts || 3
    });
    
    // Set status based on delay
    if (job.delay > 0) {
      job.status = JOB_STATUS.DELAYED;
    }
    
    // Save job to database
    await job.save();
    
    console.log(`Created job ${job.id} of type ${jobType}`);
    
    // Add job to Redis queue
    if (job.status === JOB_STATUS.PENDING) {
      await this._addJobToQueue(job);
    } else if (job.status === JOB_STATUS.DELAYED) {
      await this._scheduleDelayedJob(job);
    }
    
    this.emit('job:created', job);
    
    return job;
  }

  /**
   * Get a job by ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Job document
   */
  async getJob(jobId) {
    return this.Job.findOne({ id: jobId });
  }

  /**
   * Cancel a job
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} Updated job
   */
  async cancelJob(jobId) {
    const job = await this.Job.findOne({ id: jobId });
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    // Only cancel if not completed or failed
    if (![JOB_STATUS.COMPLETED, JOB_STATUS.FAILED].includes(job.status)) {
      job.status = JOB_STATUS.CANCELLED;
      job.updatedAt = new Date();
      
      await job.save();
      
      // Remove from Redis queue
      await this.redis.zrem(`${REDIS_KEY_PREFIX}queue:${this.options.name}`, jobId);
      await this.redis.zrem(`${REDIS_KEY_PREFIX}delayed:${this.options.name}`, jobId);
      
      console.log(`Cancelled job ${jobId}`);
      this.emit('job:cancelled', job);
    }
    
    return job;
  }

  /**
   * Update job progress
   * @param {string} jobId - Job ID
   * @param {number} progress - Progress percentage (0-100)
   * @returns {Promise<Object>} Updated job
   */
  async updateProgress(jobId, progress) {
    const job = await this.Job.findOne({ id: jobId });
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    // Validate progress
    progress = Math.max(0, Math.min(100, progress));
    
    job.progress = progress;
    job.updatedAt = new Date();
    
    await job.save();
    
    this.emit('job:progress', { job, progress });
    
    return job;
  }

  /**
   * Get queue statistics
   * @returns {Promise<Object>} Queue statistics
   */
  async getStats() {
    const [
      pending,
      processing,
      completed,
      failed,
      delayed,
      cancelled
    ] = await Promise.all([
      this.Job.countDocuments({ status: JOB_STATUS.PENDING }),
      this.Job.countDocuments({ status: JOB_STATUS.PROCESSING }),
      this.Job.countDocuments({ status: JOB_STATUS.COMPLETED }),
      this.Job.countDocuments({ status: JOB_STATUS.FAILED }),
      this.Job.countDocuments({ status: JOB_STATUS.DELAYED }),
      this.Job.countDocuments({ status: JOB_STATUS.CANCELLED })
    ]);
    
    return {
      name: this.options.name,
      concurrency: this.options.concurrency,
      active: this.processing.size,
      pending,
      processing,
      completed,
      failed,
      delayed,
      cancelled,
      total: pending + processing + completed + failed + delayed + cancelled,
      handlers: Array.from(this.handlers.keys())
    };
  }

  /**
   * Start processing jobs
   * @private
   */
  _startProcessing() {
    this.processingInterval = setInterval(
      this._processNextJob,
      this.options.pollInterval
    );
  }

  /**
   * Start checking for stalled jobs
   * @private
   */
  _startStalledJobsCheck() {
    this.stalledJobsInterval = setInterval(
      this._checkStalledJobs,
      this.options.stalledTimeout
    );
  }

  /**
   * Process the next job in the queue
   * @private
   */
  async _processNextJob() {
    if (!this.isRunning || this.processing.size >= this.options.concurrency) {
      return;
    }
    
    try {
      // Get next job from Redis sorted set
      const result = await this.redis.zpopmin(`${REDIS_KEY_PREFIX}queue:${this.options.name}`);
      
      if (!result || result.length === 0) {
        // No jobs in queue, check for delayed jobs that are ready
        await this._checkDelayedJobs();
        return;
      }
      
      const jobId = result[0];
      
      // Get job from database
      const job = await this.Job.findOne({ id: jobId });
      
      if (!job) {
        console.warn(`Job ${jobId} not found in database`);
        return;
      }
      
      // Check if job is still pending
      if (job.status !== JOB_STATUS.PENDING) {
        console.warn(`Job ${jobId} is not pending (status: ${job.status})`);
        return;
      }
      
      // Update job status
      job.status = JOB_STATUS.PROCESSING;
      job.startedAt = new Date();
      job.updatedAt = new Date();
      job.attempts += 1;
      job.processedBy = this.workerId;
      
      await job.save();
      
      // Add to processing map
      this.processing.set(job.id, job);
      
      // Emit event
      this.emit('job:processing', job);
      
      // Get handler for job type
      const handler = this.handlers.get(job.type);
      
      if (!handler) {
        console.error(`No handler registered for job type: ${job.type}`);
        await this._failJob(job, new Error(`No handler registered for job type: ${job.type}`));
        return;
      }
      
      // Execute handler with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Job ${job.id} timed out after ${job.timeout}ms`));
        }, job.timeout);
      });
      
      try {
        // Create job context
        const jobContext = {
          id: job.id,
          type: job.type,
          data: job.data,
          updateProgress: (progress) => this.updateProgress(job.id, progress)
        };
        
        // Execute handler with timeout
        const result = await Promise.race([
          handler(jobContext),
          timeoutPromise
        ]);
        
        // Complete job
        await this._completeJob(job, result);
      } catch (error) {
        // Handle job failure
        await this._handleJobFailure(job, error);
      }
    } catch (error) {
      console.error('Error processing job:', error);
      this.emit('error', error);
    }
  }

  /**
   * Check for delayed jobs that are ready to be processed
   * @private
   */
  async _checkDelayedJobs() {
    try {
      const now = Date.now();
      
      // Get delayed jobs that are ready
      const jobs = await this.redis.zrangebyscore(
        `${REDIS_KEY_PREFIX}delayed:${this.options.name}`,
        0,
        now
      );
      
      if (jobs.length === 0) {
        return;
      }
      
      console.log(`Found ${jobs.length} delayed jobs ready to be processed`);
      
      // Move jobs to queue
      for (const jobId of jobs) {
        // Get job from database
        const job = await this.Job.findOne({ id: jobId });
        
        if (!job) {
          // Remove from delayed set
          await this.redis.zrem(`${REDIS_KEY_PREFIX}delayed:${this.options.name}`, jobId);
          continue;
        }
        
        // Update job status
        job.status = JOB_STATUS.PENDING;
        job.updatedAt = new Date();
        
        await job.save();
        
        // Add to queue
        await this._addJobToQueue(job);
        
        // Remove from delayed set
        await this.redis.zrem(`${REDIS_KEY_PREFIX}delayed:${this.options.name}`, jobId);
        
        this.emit('job:ready', job);
      }
    } catch (error) {
      console.error('Error checking delayed jobs:', error);
      this.emit('error', error);
    }
  }

  /**
   * Check for stalled jobs
   * @private
   */
  async _checkStalledJobs() {
    try {
      const stalledTimeout = Date.now() - this.options.stalledTimeout;
      
      // Find stalled jobs
      const stalledJobs = await this.Job.find({
        status: JOB_STATUS.PROCESSING,
        updatedAt: { $lt: new Date(stalledTimeout) }
      });
      
      if (stalledJobs.length === 0) {
        return;
      }
      
      console.log(`Found ${stalledJobs.length} stalled jobs`);
      
      // Process stalled jobs
      for (const job of stalledJobs) {
        // Check if max attempts reached
        if (job.attempts >= job.maxAttempts) {
          // Fail job
          await this._failJob(job, new Error(`Job stalled and reached max attempts (${job.maxAttempts})`));
        } else {
          // Retry job
          job.status = JOB_STATUS.PENDING;
          job.updatedAt = new Date();
          
          await job.save();
          
          // Add to queue
          await this._addJobToQueue(job);
          
          this.emit('job:stalled', job);
        }
      }
    } catch (error) {
      console.error('Error checking stalled jobs:', error);
      this.emit('error', error);
    }
  }

  /**
   * Add a job to the queue
   * @private
   * @param {Object} job - Job document
   */
  async _addJobToQueue(job) {
    await this.redis.zadd(
      `${REDIS_KEY_PREFIX}queue:${this.options.name}`,
      job.priority,
      job.id
    );
  }

  /**
   * Schedule a delayed job
   * @private
   * @param {Object} job - Job document
   */
  async _scheduleDelayedJob(job) {
    const processAt = Date.now() + job.delay;
    
    await this.redis.zadd(
      `${REDIS_KEY_PREFIX}delayed:${this.options.name}`,
      processAt,
      job.id
    );
  }

  /**
   * Complete a job
   * @private
   * @param {Object} job - Job document
   * @param {*} result - Job result
   */
  async _completeJob(job, result) {
    // Update job
    job.status = JOB_STATUS.COMPLETED;
    job.result = result;
    job.progress = 100;
    job.completedAt = new Date();
    job.updatedAt = new Date();
    
    await job.save();
    
    // Remove from processing map
    this.processing.delete(job.id);
    
    // Emit event
    this.emit('job:completed', job);
    
    console.log(`Job ${job.id} completed successfully`);
  }

  /**
   * Fail a job
   * @private
   * @param {Object} job - Job document
   * @param {Error} error - Error object
   */
  async _failJob(job, error) {
    // Update job
    job.status = JOB_STATUS.FAILED;
    job.error = {
      message: error.message,
      stack: error.stack
    };
    job.failedAt = new Date();
    job.updatedAt = new Date();
    
    await job.save();
    
    // Remove from processing map
    this.processing.delete(job.id);
    
    // Emit event
    this.emit('job:failed', { job, error });
    
    console.error(`Job ${job.id} failed:`, error.message);
  }

  /**
   * Handle job failure
   * @private
   * @param {Object} job - Job document
   * @param {Error} error - Error object
   */
  async _handleJobFailure(job, error) {
    // Check if max attempts reached
    if (job.attempts >= job.maxAttempts) {
      // Fail job
      await this._failJob(job, error);
    } else {
      // Retry job with delay
      job.status = JOB_STATUS.DELAYED;
      job.delay = this.options.retryDelay * Math.pow(2, job.attempts - 1); // Exponential backoff
      job.updatedAt = new Date();
      
      await job.save();
      
      // Schedule delayed job
      await this._scheduleDelayedJob(job);
      
      // Emit event
      this.emit('job:retry', { job, error, delay: job.delay });
      
      console.log(`Job ${job.id} failed, retrying in ${job.delay}ms (attempt ${job.attempts}/${job.maxAttempts})`);
    }
    
    // Remove from processing map
    this.processing.delete(job.id);
  }
}

module.exports = {
  JobQueue,
  JOB_STATUS,
  JOB_PRIORITY
};
