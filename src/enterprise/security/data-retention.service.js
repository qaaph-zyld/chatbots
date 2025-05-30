/**
 * Data Retention Service
 * 
 * This service provides data retention policy management and enforcement
 * for the chatbot platform, ensuring compliance with data protection regulations.
 */

// Use mock utilities for testing
const { logger, generateUuid } = require('../../utils/mock-utils');

/**
 * Data Retention Service class
 */
class DataRetentionService {
  /**
   * Initialize the data retention service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      defaultRetentionPeriod: parseInt(process.env.DEFAULT_RETENTION_DAYS || '365'),
      enableAutomaticPurge: process.env.ENABLE_AUTOMATIC_PURGE === 'true',
      purgeFrequency: process.env.PURGE_FREQUENCY || 'daily',
      backupBeforePurge: process.env.BACKUP_BEFORE_PURGE === 'true',
      ...options
    };

    // Storage for retention policies and data types
    this.retentionPolicies = new Map();
    this.dataTypes = new Map();
    this.purgeJobs = new Map();
    this.purgeHistory = [];

    // Initialize default data types and policies
    this._initializeDefaultDataTypes();
    this._initializeDefaultPolicies();

    logger.info('Data Retention Service initialized with options:', {
      defaultRetentionPeriod: this.options.defaultRetentionPeriod,
      enableAutomaticPurge: this.options.enableAutomaticPurge,
      purgeFrequency: this.options.purgeFrequency,
      backupBeforePurge: this.options.backupBeforePurge
    });
  }

  /**
   * Register a new data type
   * @param {Object} dataTypeData - Data type data
   * @returns {Object} - Registration result
   */
  registerDataType(dataTypeData) {
    try {
      const { name, description, schema, sensitivity } = dataTypeData;

      if (!name) {
        throw new Error('Data type name is required');
      }

      if (!sensitivity || !['low', 'medium', 'high', 'critical'].includes(sensitivity)) {
        throw new Error("Data type sensitivity is required and must be one of 'low', 'medium', 'high', or 'critical'");
      }

      // Check if data type already exists
      if (this.dataTypes.has(name)) {
        throw new Error(`Data type '${name}' already exists`);
      }

      // Create data type object
      const dataType = {
        id: generateUuid(),
        name,
        description: description || '',
        schema: schema || {},
        sensitivity,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store data type
      this.dataTypes.set(name, dataType);

      logger.info(`Registered data type: ${name}`, { sensitivity });
      return { success: true, dataType };
    } catch (error) {
      logger.error('Error registering data type:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a retention policy
   * @param {Object} policyData - Policy data
   * @returns {Object} - Creation result
   */
  createRetentionPolicy(policyData) {
    try {
      const { 
        name, 
        description, 
        dataTypes, 
        retentionPeriod, 
        legalHoldExempt,
        purgeAction,
        anonymizeFields
      } = policyData;

      if (!name) {
        throw new Error('Policy name is required');
      }

      if (!dataTypes || !Array.isArray(dataTypes) || dataTypes.length === 0) {
        throw new Error('Data types array is required and must not be empty');
      }

      if (retentionPeriod === undefined || retentionPeriod < 0) {
        throw new Error('Retention period is required and must be a non-negative number');
      }

      // Check if policy already exists
      if (this.retentionPolicies.has(name)) {
        throw new Error(`Policy '${name}' already exists`);
      }

      // Validate data types
      for (const dataType of dataTypes) {
        if (!this.dataTypes.has(dataType)) {
          throw new Error(`Data type '${dataType}' does not exist`);
        }
      }

      // Create policy object
      const policy = {
        id: generateUuid(),
        name,
        description: description || '',
        dataTypes,
        retentionPeriod,
        legalHoldExempt: legalHoldExempt || false,
        purgeAction: purgeAction || 'delete', // delete, anonymize, archive
        anonymizeFields: anonymizeFields || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enabled: true
      };

      // Store policy
      this.retentionPolicies.set(name, policy);

      logger.info(`Created retention policy: ${name}`, { 
        retentionPeriod, 
        dataTypes: dataTypes.join(', '),
        purgeAction: policy.purgeAction
      });
      return { success: true, policy };
    } catch (error) {
      logger.error('Error creating retention policy:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a retention policy
   * @param {string} policyName - Policy name
   * @param {Object} updates - Policy updates
   * @returns {Object} - Update result
   */
  updateRetentionPolicy(policyName, updates) {
    try {
      // Check if policy exists
      if (!this.retentionPolicies.has(policyName)) {
        throw new Error(`Policy '${policyName}' does not exist`);
      }

      const policy = this.retentionPolicies.get(policyName);
      const updatedPolicy = { ...policy };

      // Update fields
      if (updates.description !== undefined) {
        updatedPolicy.description = updates.description;
      }

      if (updates.dataTypes !== undefined) {
        if (!Array.isArray(updates.dataTypes) || updates.dataTypes.length === 0) {
          throw new Error('Data types array must not be empty');
        }

        // Validate data types
        for (const dataType of updates.dataTypes) {
          if (!this.dataTypes.has(dataType)) {
            throw new Error(`Data type '${dataType}' does not exist`);
          }
        }

        updatedPolicy.dataTypes = updates.dataTypes;
      }

      if (updates.retentionPeriod !== undefined) {
        if (updates.retentionPeriod < 0) {
          throw new Error('Retention period must be a non-negative number');
        }
        updatedPolicy.retentionPeriod = updates.retentionPeriod;
      }

      if (updates.legalHoldExempt !== undefined) {
        updatedPolicy.legalHoldExempt = updates.legalHoldExempt;
      }

      if (updates.purgeAction !== undefined) {
        if (!['delete', 'anonymize', 'archive'].includes(updates.purgeAction)) {
          throw new Error("Purge action must be one of 'delete', 'anonymize', or 'archive'");
        }
        updatedPolicy.purgeAction = updates.purgeAction;
      }

      if (updates.anonymizeFields !== undefined) {
        updatedPolicy.anonymizeFields = updates.anonymizeFields;
      }

      if (updates.enabled !== undefined) {
        updatedPolicy.enabled = updates.enabled;
      }

      // Update timestamp
      updatedPolicy.updatedAt = new Date().toISOString();

      // Store updated policy
      this.retentionPolicies.set(policyName, updatedPolicy);

      logger.info(`Updated retention policy: ${policyName}`);
      return { success: true, policy: updatedPolicy };
    } catch (error) {
      logger.error('Error updating retention policy:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a retention policy
   * @param {string} policyName - Policy name
   * @returns {Object} - Deletion result
   */
  deleteRetentionPolicy(policyName) {
    try {
      // Check if policy exists
      if (!this.retentionPolicies.has(policyName)) {
        throw new Error(`Policy '${policyName}' does not exist`);
      }

      // Delete policy
      this.retentionPolicies.delete(policyName);

      logger.info(`Deleted retention policy: ${policyName}`);
      return { success: true, message: `Policy '${policyName}' deleted successfully` };
    } catch (error) {
      logger.error('Error deleting retention policy:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all retention policies
   * @returns {Object} - Policies result
   */
  getAllPolicies() {
    try {
      const policies = Array.from(this.retentionPolicies.values());
      return { success: true, policies };
    } catch (error) {
      logger.error('Error getting all policies:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all data types
   * @returns {Object} - Data types result
   */
  getAllDataTypes() {
    try {
      const dataTypes = Array.from(this.dataTypes.values());
      return { success: true, dataTypes };
    } catch (error) {
      logger.error('Error getting all data types:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a purge job
   * @param {Object} jobData - Job data
   * @returns {Object} - Creation result
   */
  createPurgeJob(jobData) {
    try {
      const { 
        name, 
        description, 
        dataTypes, 
        olderThan, 
        dryRun,
        purgeAction,
        schedule
      } = jobData;

      if (!name) {
        throw new Error('Job name is required');
      }

      if (!dataTypes || !Array.isArray(dataTypes) || dataTypes.length === 0) {
        throw new Error('Data types array is required and must not be empty');
      }

      if (olderThan === undefined || olderThan < 0) {
        throw new Error('olderThan is required and must be a non-negative number');
      }

      // Check if job already exists
      if (this.purgeJobs.has(name)) {
        throw new Error(`Purge job '${name}' already exists`);
      }

      // Validate data types
      for (const dataType of dataTypes) {
        if (!this.dataTypes.has(dataType)) {
          throw new Error(`Data type '${dataType}' does not exist`);
        }
      }

      // Create job object
      const job = {
        id: generateUuid(),
        name,
        description: description || '',
        dataTypes,
        olderThan,
        dryRun: dryRun || false,
        purgeAction: purgeAction || 'delete', // delete, anonymize, archive
        schedule: schedule || 'manual', // manual, daily, weekly, monthly
        lastRun: null,
        nextRun: null,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Calculate next run time if scheduled
      if (job.schedule !== 'manual') {
        job.nextRun = this._calculateNextRunTime(job.schedule);
      }

      // Store job
      this.purgeJobs.set(name, job);

      logger.info(`Created purge job: ${name}`, { 
        olderThan, 
        dataTypes: dataTypes.join(', '),
        schedule: job.schedule
      });
      return { success: true, job };
    } catch (error) {
      logger.error('Error creating purge job:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run a purge job
   * @param {string} jobName - Job name
   * @param {Object} options - Run options
   * @returns {Object} - Run result
   */
  runPurgeJob(jobName, options = {}) {
    try {
      // Check if job exists
      if (!this.purgeJobs.has(jobName)) {
        throw new Error(`Purge job '${jobName}' does not exist`);
      }

      const job = this.purgeJobs.get(jobName);
      const runOptions = {
        dryRun: options.dryRun !== undefined ? options.dryRun : job.dryRun,
        override: options.override || {}
      };

      // Update job status
      job.status = 'running';
      job.lastRun = new Date().toISOString();
      this.purgeJobs.set(jobName, job);

      logger.info(`Running purge job: ${jobName}`, { dryRun: runOptions.dryRun });

      // In a real implementation, this would connect to the database
      // and perform the actual purge operation
      // For this example, we'll simulate the purge

      // Create purge result
      const purgeResult = {
        jobId: job.id,
        jobName: job.name,
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'success',
        dryRun: runOptions.dryRun,
        dataTypeResults: {},
        totalRecords: 0,
        purgedRecords: 0,
        errors: []
      };

      // Simulate purge for each data type
      for (const dataType of job.dataTypes) {
        const dataTypeInfo = this.dataTypes.get(dataType);
        
        // Simulate finding records to purge
        const recordCount = Math.floor(Math.random() * 100) + 1;
        const purgedCount = runOptions.dryRun ? 0 : recordCount;
        
        purgeResult.dataTypeResults[dataType] = {
          dataTypeId: dataTypeInfo.id,
          dataTypeName: dataType,
          recordCount,
          purgedCount,
          purgeAction: job.purgeAction,
          errors: []
        };
        
        purgeResult.totalRecords += recordCount;
        purgeResult.purgedRecords += purgedCount;
      }

      // Complete purge
      purgeResult.endTime = new Date().toISOString();

      // Update job status
      job.status = 'completed';
      if (job.schedule !== 'manual') {
        job.nextRun = this._calculateNextRunTime(job.schedule);
      }
      this.purgeJobs.set(jobName, job);

      // Add to purge history
      this.purgeHistory.push(purgeResult);

      logger.info(`Completed purge job: ${jobName}`, { 
        totalRecords: purgeResult.totalRecords,
        purgedRecords: purgeResult.purgedRecords,
        dryRun: runOptions.dryRun
      });
      return { success: true, purgeResult };
    } catch (error) {
      logger.error('Error running purge job:', error.message);
      
      // Update job status on error
      if (this.purgeJobs.has(jobName)) {
        const job = this.purgeJobs.get(jobName);
        job.status = 'failed';
        this.purgeJobs.set(jobName, job);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Get purge job history
   * @param {Object} filters - Filters to apply
   * @returns {Object} - History result
   */
  getPurgeHistory(filters = {}) {
    try {
      const { jobName, startDate, endDate, status, limit, offset } = filters;

      // Apply filters
      let filteredHistory = [...this.purgeHistory];

      if (jobName) {
        filteredHistory = filteredHistory.filter(item => item.jobName === jobName);
      }

      if (startDate) {
        filteredHistory = filteredHistory.filter(item => new Date(item.startTime) >= new Date(startDate));
      }

      if (endDate) {
        filteredHistory = filteredHistory.filter(item => new Date(item.startTime) <= new Date(endDate));
      }

      if (status) {
        filteredHistory = filteredHistory.filter(item => item.status === status);
      }

      // Sort by start time (newest first)
      filteredHistory.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

      // Apply pagination
      const totalCount = filteredHistory.length;
      const paginatedHistory = filteredHistory.slice(offset || 0, (offset || 0) + (limit || filteredHistory.length));

      return { 
        success: true, 
        history: paginatedHistory,
        totalCount,
        count: paginatedHistory.length
      };
    } catch (error) {
      logger.error('Error getting purge history:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply legal hold to data
   * @param {Object} holdData - Legal hold data
   * @returns {Object} - Hold result
   */
  applyLegalHold(holdData) {
    try {
      const { name, description, dataTypes, criteria, expirationDate } = holdData;

      if (!name) {
        throw new Error('Legal hold name is required');
      }

      if (!dataTypes || !Array.isArray(dataTypes) || dataTypes.length === 0) {
        throw new Error('Data types array is required and must not be empty');
      }

      if (!criteria) {
        throw new Error('Legal hold criteria is required');
      }

      // Validate data types
      for (const dataType of dataTypes) {
        if (!this.dataTypes.has(dataType)) {
          throw new Error(`Data type '${dataType}' does not exist`);
        }
      }

      // Create legal hold object
      const legalHold = {
        id: generateUuid(),
        name,
        description: description || '',
        dataTypes,
        criteria,
        expirationDate: expirationDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };

      // In a real implementation, this would store the legal hold
      // and apply it to the relevant data

      logger.info(`Applied legal hold: ${name}`, { 
        dataTypes: dataTypes.join(', '),
        expirationDate: expirationDate || 'indefinite'
      });
      return { success: true, legalHold };
    } catch (error) {
      logger.error('Error applying legal hold:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize default data types
   * @private
   */
  _initializeDefaultDataTypes() {
    this.registerDataType({
      name: 'user_profile',
      description: 'User profile data including personal information',
      schema: {
        userId: 'string',
        username: 'string',
        email: 'string',
        fullName: 'string',
        createdAt: 'date',
        updatedAt: 'date'
      },
      sensitivity: 'high'
    });

    this.registerDataType({
      name: 'conversation',
      description: 'Conversation data between users and chatbots',
      schema: {
        conversationId: 'string',
        userId: 'string',
        botId: 'string',
        messages: 'array',
        createdAt: 'date',
        updatedAt: 'date'
      },
      sensitivity: 'medium'
    });

    this.registerDataType({
      name: 'authentication_log',
      description: 'Authentication logs including login attempts',
      schema: {
        logId: 'string',
        userId: 'string',
        action: 'string',
        status: 'string',
        ipAddress: 'string',
        userAgent: 'string',
        timestamp: 'date'
      },
      sensitivity: 'medium'
    });

    this.registerDataType({
      name: 'system_log',
      description: 'System logs for platform operations',
      schema: {
        logId: 'string',
        action: 'string',
        component: 'string',
        details: 'object',
        timestamp: 'date'
      },
      sensitivity: 'low'
    });

    this.registerDataType({
      name: 'payment_info',
      description: 'Payment information for premium features',
      schema: {
        paymentId: 'string',
        userId: 'string',
        amount: 'number',
        currency: 'string',
        method: 'string',
        status: 'string',
        timestamp: 'date'
      },
      sensitivity: 'critical'
    });
  }

  /**
   * Initialize default policies
   * @private
   */
  _initializeDefaultPolicies() {
    this.createRetentionPolicy({
      name: 'user_data_retention',
      description: 'Retention policy for user profile data',
      dataTypes: ['user_profile'],
      retentionPeriod: 730, // 2 years
      legalHoldExempt: true,
      purgeAction: 'anonymize',
      anonymizeFields: ['fullName', 'email']
    });

    this.createRetentionPolicy({
      name: 'conversation_retention',
      description: 'Retention policy for conversation data',
      dataTypes: ['conversation'],
      retentionPeriod: 365, // 1 year
      legalHoldExempt: true,
      purgeAction: 'delete'
    });

    this.createRetentionPolicy({
      name: 'auth_log_retention',
      description: 'Retention policy for authentication logs',
      dataTypes: ['authentication_log'],
      retentionPeriod: 90, // 90 days
      legalHoldExempt: false,
      purgeAction: 'archive'
    });

    this.createRetentionPolicy({
      name: 'system_log_retention',
      description: 'Retention policy for system logs',
      dataTypes: ['system_log'],
      retentionPeriod: 30, // 30 days
      legalHoldExempt: false,
      purgeAction: 'delete'
    });

    this.createRetentionPolicy({
      name: 'payment_info_retention',
      description: 'Retention policy for payment information',
      dataTypes: ['payment_info'],
      retentionPeriod: 2555, // 7 years
      legalHoldExempt: true,
      purgeAction: 'anonymize',
      anonymizeFields: ['method']
    });
  }

  /**
   * Calculate next run time based on schedule
   * @param {string} schedule - Schedule type
   * @returns {string} - Next run time
   * @private
   */
  _calculateNextRunTime(schedule) {
    const now = new Date();
    let nextRun = new Date(now);

    switch (schedule) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1);
        nextRun.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        nextRun.setDate(now.getDate() + (7 - now.getDay()));
        nextRun.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1);
        nextRun.setDate(1);
        nextRun.setHours(0, 0, 0, 0);
        break;
      default:
        return null;
    }

    return nextRun.toISOString();
  }
}

module.exports = { dataRetentionService: new DataRetentionService() };
