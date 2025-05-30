/**
 * Report Generator Service
 * 
 * This service provides functionality for generating custom reports on demand
 * with specific parameters, scheduling, and distribution capabilities.
 */

// Use mock utilities for testing
const { logger, generateUuid } = require('./test-utils');
const { reportBuilderService } = require('./report-builder.service');

/**
 * Report Generator Service class
 */
class ReportGeneratorService {
  /**
   * Initialize the report generator service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_REPORT_JOBS || '5'),
      defaultTimeZone: process.env.DEFAULT_TIMEZONE || 'UTC',
      reportRetentionDays: parseInt(process.env.REPORT_RETENTION_DAYS || '90'),
      ...options
    };

    // Report jobs and schedules storage
    this.jobs = new Map();
    this.schedules = new Map();
    this.generatedReports = new Map();
    this.activeJobs = 0;
    this.jobQueue = [];

    // Initialize job processor
    this._startJobProcessor();

    logger.info('Report Generator Service initialized with options:', {
      maxConcurrentJobs: this.options.maxConcurrentJobs,
      defaultTimeZone: this.options.defaultTimeZone,
      reportRetentionDays: this.options.reportRetentionDays
    });
  }

  /**
   * Create a report generation job
   * @param {Object} jobConfig - Job configuration
   * @returns {Object} - Job details
   */
  createJob(jobConfig) {
    try {
      const {
        name,
        description = '',
        templateId,
        parameters = {},
        schedule = null,
        distribution = null,
        tags = []
      } = jobConfig;

      if (!name) {
        throw new Error('Job name is required');
      }

      if (!templateId) {
        throw new Error('Template ID is required');
      }

      // Validate template exists
      const templates = reportBuilderService.getTemplates();
      const templateExists = templates.some(template => template.id === templateId);
      if (!templateExists) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      // Generate job ID
      const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      // Create job object
      const job = {
        id: jobId,
        name,
        description,
        templateId,
        parameters,
        schedule,
        distribution,
        tags,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastRunAt: null,
        nextRunAt: this._calculateNextRunTime(schedule),
        runs: []
      };

      // Store job
      this.jobs.set(jobId, job);

      // Add to schedule if needed
      if (schedule) {
        this._scheduleJob(job);
      }

      logger.info('Created report generation job:', { jobId, name, templateId });
      return {
        success: true,
        job: {
          ...job
        }
      };
    } catch (error) {
      logger.error('Error creating report generation job:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run a report generation job
   * @param {string} jobId - Job ID
   * @returns {Object} - Operation result
   */
  runJob(jobId) {
    try {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`);
      }

      // Update job status
      job.status = 'queued';
      job.updatedAt = new Date().toISOString();

      // Add to queue
      this.jobQueue.push(job);

      logger.info(`Queued report generation job: ${job.name}`, { jobId });
      return { success: true, job };
    } catch (error) {
      logger.error('Error running report generation job:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel a report generation job
   * @param {string} jobId - Job ID
   * @returns {Object} - Operation result
   */
  cancelJob(jobId) {
    try {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`);
      }

      // Remove from queue if queued
      if (job.status === 'queued') {
        this.jobQueue = this.jobQueue.filter(j => j.id !== jobId);
      }

      // Update job status
      job.status = 'cancelled';
      job.updatedAt = new Date().toISOString();

      logger.info(`Cancelled report generation job: ${job.name}`, { jobId });
      return { success: true, job };
    } catch (error) {
      logger.error('Error cancelling report generation job:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a report generation job
   * @param {string} jobId - Job ID
   * @param {Object} updates - Job updates
   * @returns {Object} - Operation result
   */
  updateJob(jobId, updates) {
    try {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`);
      }

      // Apply updates
      const updatableFields = ['name', 'description', 'parameters', 'schedule', 'distribution', 'tags'];
      for (const field of updatableFields) {
        if (updates[field] !== undefined) {
          job[field] = updates[field];
        }
      }

      // Update metadata
      job.updatedAt = new Date().toISOString();

      // Update schedule if changed
      if (updates.schedule !== undefined) {
        job.nextRunAt = this._calculateNextRunTime(job.schedule);
        this._scheduleJob(job);
      }

      logger.info(`Updated report generation job: ${job.name}`, { jobId });
      return { success: true, job };
    } catch (error) {
      logger.error('Error updating report generation job:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a list of report generation jobs
   * @param {Object} filters - Filters to apply
   * @returns {Array} - List of jobs
   */
  getJobs(filters = {}) {
    try {
      let jobList = Array.from(this.jobs.values());

      // Apply filters
      if (filters.status) {
        jobList = jobList.filter(job => job.status === filters.status);
      }

      if (filters.templateId) {
        jobList = jobList.filter(job => job.templateId === filters.templateId);
      }

      if (filters.tag) {
        jobList = jobList.filter(job => job.tags.includes(filters.tag));
      }

      // Sort by creation date (newest first)
      jobList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        success: true,
        jobs: jobList.map(job => ({
          id: job.id,
          name: job.name,
          description: job.description,
          templateId: job.templateId,
          status: job.status,
          schedule: job.schedule ? { type: job.schedule.type, interval: job.schedule.interval } : null,
          lastRunAt: job.lastRunAt,
          nextRunAt: job.nextRunAt,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          runCount: job.runs.length
        }))
      };
    } catch (error) {
      logger.error('Error getting report generation jobs:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get job details
   * @param {string} jobId - Job ID
   * @returns {Object} - Job details
   */
  getJobDetails(jobId) {
    try {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`);
      }

      return {
        success: true,
        job: {
          ...job,
          runs: job.runs.map(run => ({
            id: run.id,
            status: run.status,
            startTime: run.startTime,
            endTime: run.endTime,
            reportId: run.reportId,
            error: run.error
          }))
        }
      };
    } catch (error) {
      logger.error('Error getting job details:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get generated reports
   * @param {Object} filters - Filters to apply
   * @returns {Array} - List of reports
   */
  getGeneratedReports(filters = {}) {
    try {
      let reportList = Array.from(this.generatedReports.values());

      // Apply filters
      if (filters.jobId) {
        reportList = reportList.filter(report => report.jobId === filters.jobId);
      }

      if (filters.templateId) {
        reportList = reportList.filter(report => report.templateId === filters.templateId);
      }

      if (filters.status) {
        reportList = reportList.filter(report => report.status === filters.status);
      }

      // Sort by creation date (newest first)
      reportList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return {
        success: true,
        reports: reportList.map(report => ({
          id: report.id,
          name: report.name,
          jobId: report.jobId,
          templateId: report.templateId,
          parameters: report.parameters,
          status: report.status,
          createdAt: report.createdAt,
          completedAt: report.completedAt,
          downloadUrl: report.downloadUrl
        }))
      };
    } catch (error) {
      logger.error('Error getting generated reports:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a generated report
   * @param {string} reportId - Report ID
   * @param {string} format - Export format
   * @returns {Promise<Object>} - Report content
   */
  async downloadReport(reportId, format = 'html') {
    try {
      const report = this.generatedReports.get(reportId);
      if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
      }

      // Get the report content from the report builder service
      const exportResult = await reportBuilderService.exportReport(report.reportId, format);
      if (!exportResult.success) {
        throw new Error(`Error exporting report: ${exportResult.error}`);
      }

      logger.info(`Downloaded report: ${report.name} in ${format} format`);
      return {
        success: true,
        report: {
          id: report.id,
          name: report.name,
          format,
          data: exportResult.data,
          createdAt: report.createdAt
        }
      };
    } catch (error) {
      logger.error('Error downloading report:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start the job processor
   * @private
   */
  _startJobProcessor() {
    // Process the job queue periodically
    setInterval(() => {
      this._processJobQueue();
      this._checkScheduledJobs();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process the job queue
   * @private
   */
  _processJobQueue() {
    // Process jobs if there are any in the queue and we're not at max capacity
    while (this.jobQueue.length > 0 && this.activeJobs < this.options.maxConcurrentJobs) {
      const job = this.jobQueue.shift();
      this._processJob(job);
    }
  }

  /**
   * Process a job
   * @param {Object} job - Job to process
   * @private
   */
  async _processJob(job) {
    try {
      // Increment active jobs counter
      this.activeJobs++;

      // Update job status
      job.status = 'running';
      job.updatedAt = new Date().toISOString();
      job.lastRunAt = new Date().toISOString();

      // Create a run record
      const runId = `run-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const run = {
        id: runId,
        status: 'running',
        startTime: new Date().toISOString(),
        endTime: null,
        reportId: null,
        error: null
      };

      job.runs.push(run);

      logger.info(`Processing report generation job: ${job.name}`, { jobId: job.id, runId });

      // Generate the report
      const reportResult = await reportBuilderService.generateReport(job.templateId, job.parameters);

      if (reportResult.success) {
        // Update run record
        run.status = 'completed';
        run.endTime = new Date().toISOString();
        run.reportId = reportResult.report.id;

        // Create generated report record
        const generatedReportId = `gen-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const generatedReport = {
          id: generatedReportId,
          name: reportResult.report.name,
          jobId: job.id,
          runId,
          templateId: job.templateId,
          reportId: reportResult.report.id,
          parameters: job.parameters,
          status: 'completed',
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          downloadUrl: `/api/reports/${generatedReportId}/download`
        };

        this.generatedReports.set(generatedReportId, generatedReport);

        // Handle distribution if configured
        if (job.distribution) {
          this._distributeReport(generatedReport, job.distribution);
        }

        logger.info(`Completed report generation job: ${job.name}`, { 
          jobId: job.id, 
          runId, 
          reportId: reportResult.report.id,
          generatedReportId
        });
      } else {
        // Update run record with error
        run.status = 'failed';
        run.endTime = new Date().toISOString();
        run.error = reportResult.error;

        logger.error(`Failed report generation job: ${job.name}`, { 
          jobId: job.id, 
          runId, 
          error: reportResult.error 
        });
      }

      // Update job status if it was a one-time job
      if (!job.schedule) {
        job.status = reportResult.success ? 'completed' : 'failed';
      } else {
        job.status = 'scheduled';
        job.nextRunAt = this._calculateNextRunTime(job.schedule);
      }

      job.updatedAt = new Date().toISOString();
    } catch (error) {
      // Handle unexpected errors
      logger.error(`Error processing job ${job.id}:`, error.message);

      // Update job status
      job.status = job.schedule ? 'scheduled' : 'failed';
      job.updatedAt = new Date().toISOString();

      // Update run record if it exists
      if (job.runs.length > 0) {
        const run = job.runs[job.runs.length - 1];
        run.status = 'failed';
        run.endTime = new Date().toISOString();
        run.error = error.message;
      }
    } finally {
      // Decrement active jobs counter
      this.activeJobs--;
    }
  }

  /**
   * Check for scheduled jobs that need to run
   * @private
   */
  _checkScheduledJobs() {
    const now = new Date();

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'scheduled' && job.nextRunAt && new Date(job.nextRunAt) <= now) {
        // Queue the job for execution
        job.status = 'queued';
        job.updatedAt = now.toISOString();
        this.jobQueue.push(job);

        // Calculate next run time
        job.nextRunAt = this._calculateNextRunTime(job.schedule);

        logger.info(`Scheduled job queued for execution: ${job.name}`, { jobId });
      }
    }
  }

  /**
   * Schedule a job
   * @param {Object} job - Job to schedule
   * @private
   */
  _scheduleJob(job) {
    if (!job.schedule) {
      return;
    }

    // Update job status
    job.status = 'scheduled';
    job.updatedAt = new Date().toISOString();

    logger.info(`Scheduled report generation job: ${job.name}`, { 
      jobId: job.id, 
      schedule: job.schedule,
      nextRunAt: job.nextRunAt
    });
  }

  /**
   * Calculate the next run time for a scheduled job
   * @param {Object} schedule - Schedule configuration
   * @returns {string|null} - Next run time ISO string
   * @private
   */
  _calculateNextRunTime(schedule) {
    if (!schedule) {
      return null;
    }

    const now = new Date();
    let nextRun = new Date(now);

    switch (schedule.type) {
      case 'hourly':
        nextRun.setHours(nextRun.getHours() + (schedule.interval || 1));
        break;
      case 'daily':
        nextRun.setDate(nextRun.getDate() + (schedule.interval || 1));
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
          if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + (schedule.interval || 1));
          }
        }
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7 * (schedule.interval || 1));
        if (schedule.dayOfWeek !== undefined) {
          const currentDay = nextRun.getDay();
          const targetDay = schedule.dayOfWeek;
          const daysToAdd = (targetDay - currentDay + 7) % 7;
          nextRun.setDate(nextRun.getDate() + daysToAdd);
        }
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        }
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7 * (schedule.interval || 1));
        }
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + (schedule.interval || 1));
        if (schedule.dayOfMonth) {
          nextRun.setDate(Math.min(schedule.dayOfMonth, this._getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth())));
        }
        if (schedule.time) {
          const [hours, minutes] = schedule.time.split(':').map(Number);
          nextRun.setHours(hours, minutes, 0, 0);
        }
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + (schedule.interval || 1));
        }
        break;
      case 'cron':
        // For a real implementation, this would use a cron parser library
        // For this example, we'll just add a day
        nextRun.setDate(nextRun.getDate() + 1);
        break;
    }

    return nextRun.toISOString();
  }

  /**
   * Get the number of days in a month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @returns {number} - Number of days
   * @private
   */
  _getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Distribute a report
   * @param {Object} report - Generated report
   * @param {Object} distribution - Distribution configuration
   * @private
   */
  _distributeReport(report, distribution) {
    try {
      logger.info(`Distributing report: ${report.name}`, { reportId: report.id, distribution });

      // In a real implementation, this would handle different distribution methods
      // such as email, Slack, file storage, etc.
      
      // For this example, we'll just log the distribution
      switch (distribution.method) {
        case 'email':
          logger.info(`Would send report by email to: ${distribution.recipients.join(', ')}`);
          break;
        case 'slack':
          logger.info(`Would send report to Slack channel: ${distribution.channel}`);
          break;
        case 'storage':
          logger.info(`Would save report to storage location: ${distribution.location}`);
          break;
        default:
          logger.warn(`Unknown distribution method: ${distribution.method}`);
      }
    } catch (error) {
      logger.error(`Error distributing report: ${error.message}`);
    }
  }

  /**
   * Clean up old reports
   * @returns {Object} - Cleanup result
   */
  cleanupOldReports() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.options.reportRetentionDays);
      const cutoffDateStr = cutoffDate.toISOString();

      let deletedCount = 0;

      // Clean up generated reports
      for (const [id, report] of this.generatedReports.entries()) {
        if (report.createdAt < cutoffDateStr) {
          this.generatedReports.delete(id);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} old reports`);
      return { success: true, deletedCount };
    } catch (error) {
      logger.error('Error cleaning up old reports:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Create and export service instance
const reportGeneratorService = new ReportGeneratorService();

module.exports = {
  ReportGeneratorService,
  reportGeneratorService
};
