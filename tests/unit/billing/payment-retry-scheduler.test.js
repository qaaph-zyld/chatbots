/**
 * Payment Retry Scheduler Unit Tests
 * 
 * Tests for payment retry scheduler functionality including:
 * - Scheduler initialization
 * - Retry processing
 * - Error handling
 */

const sinon = require('sinon');
const { expect } = require('chai');
const cron = require('node-cron');
const paymentRetryScheduler = require('../../../src/billing/jobs/payment-retry-scheduler');
const paymentRecoveryService = require('../../../src/billing/services/payment-recovery.service');
const logger = require('../../../src/utils/logger');

describe('Payment Retry Scheduler', () => {
  let cronStub;
  let paymentRecoveryServiceStub;
  let loggerStub;
  let processEnvBackup;
  
  beforeEach(() => {
    // Backup process.env
    processEnvBackup = { ...process.env };
    
    // Stub cron
    cronStub = {
      schedule: sinon.stub(cron, 'schedule').returns({
        start: sinon.stub(),
        stop: sinon.stub()
      }),
      validate: sinon.stub(cron, 'validate').returns(true)
    };
    
    // Stub payment recovery service
    paymentRecoveryServiceStub = sinon.stub(paymentRecoveryService, 'processScheduledRetries');
    
    // Stub logger
    loggerStub = {
      info: sinon.stub(logger, 'info'),
      error: sinon.stub(logger, 'error')
    };
  });
  
  afterEach(() => {
    // Restore stubs
    sinon.restore();
    
    // Restore process.env
    process.env = processEnvBackup;
  });
  
  describe('initScheduler', () => {
    it('should initialize the scheduler with default schedule', () => {
      // Set environment variables
      process.env.ENABLE_PAYMENT_RETRY_SCHEDULER = 'true';
      
      // Call the function
      const job = paymentRetryScheduler.initScheduler();
      
      // Assertions
      expect(cronStub.validate.calledOnce).to.be.true;
      expect(cronStub.schedule.calledOnce).to.be.true;
      expect(cronStub.schedule.firstCall.args[0]).to.equal('0 * * * *'); // Default schedule
      expect(loggerStub.info.calledWith(sinon.match(/Initializing payment retry scheduler/))).to.be.true;
      expect(job).to.exist;
    });
    
    it('should initialize the scheduler with custom schedule', () => {
      // Set environment variables
      process.env.ENABLE_PAYMENT_RETRY_SCHEDULER = 'true';
      process.env.PAYMENT_RETRY_CRON = '*/30 * * * *'; // Every 30 minutes
      
      // Call the function
      const job = paymentRetryScheduler.initScheduler();
      
      // Assertions
      expect(cronStub.validate.calledOnce).to.be.true;
      expect(cronStub.schedule.calledOnce).to.be.true;
      expect(cronStub.schedule.firstCall.args[0]).to.equal('*/30 * * * *'); // Custom schedule
      expect(loggerStub.info.calledWith(sinon.match(/Initializing payment retry scheduler/))).to.be.true;
      expect(job).to.exist;
    });
    
    it('should not initialize the scheduler when disabled', () => {
      // Set environment variables
      process.env.ENABLE_PAYMENT_RETRY_SCHEDULER = 'false';
      
      // Call the function
      const job = paymentRetryScheduler.initScheduler();
      
      // Assertions
      expect(cronStub.validate.called).to.be.false;
      expect(cronStub.schedule.called).to.be.false;
      expect(loggerStub.info.calledWith('Payment retry scheduler is disabled')).to.be.true;
      expect(job).to.be.undefined;
    });
    
    it('should log error and return when cron schedule is invalid', () => {
      // Set environment variables
      process.env.ENABLE_PAYMENT_RETRY_SCHEDULER = 'true';
      process.env.PAYMENT_RETRY_CRON = 'invalid-cron';
      
      // Make validate return false
      cronStub.validate.returns(false);
      
      // Call the function
      const job = paymentRetryScheduler.initScheduler();
      
      // Assertions
      expect(cronStub.validate.calledOnce).to.be.true;
      expect(cronStub.schedule.called).to.be.false;
      expect(loggerStub.error.calledWith(sinon.match(/Invalid cron schedule/))).to.be.true;
      expect(job).to.be.undefined;
    });
    
    it('should run immediately on startup when configured', () => {
      // Set environment variables
      process.env.ENABLE_PAYMENT_RETRY_SCHEDULER = 'true';
      process.env.RUN_PAYMENT_RETRY_ON_STARTUP = 'true';
      
      // Mock successful processing
      paymentRecoveryServiceStub.resolves([
        { status: 'succeeded' },
        { status: 'failed' }
      ]);
      
      // Call the function
      const job = paymentRetryScheduler.initScheduler();
      
      // Assertions
      expect(cronStub.schedule.calledOnce).to.be.true;
      expect(loggerStub.info.calledWith('Running payment retry processing on startup')).to.be.true;
      expect(job).to.exist;
      
      // We can't easily test the async call directly, but we can verify the stub was prepared
      expect(paymentRecoveryServiceStub.called).to.be.false; // Not called synchronously
    });
    
    it('should handle initialization errors gracefully', () => {
      // Set environment variables
      process.env.ENABLE_PAYMENT_RETRY_SCHEDULER = 'true';
      
      // Force an error
      const error = new Error('Initialization error');
      cronStub.schedule.throws(error);
      
      // Expect the function to throw
      expect(() => paymentRetryScheduler.initScheduler()).to.throw(error);
      
      // Assertions
      expect(loggerStub.error.calledWith(sinon.match(/Failed to initialize payment retry scheduler/))).to.be.true;
    });
  });
  
  describe('processRetries', () => {
    it('should process retries successfully', async () => {
      // Mock successful processing
      const mockResults = [
        { status: 'succeeded' },
        { status: 'succeeded' },
        { status: 'failed' }
      ];
      paymentRecoveryServiceStub.resolves(mockResults);
      
      // Call the function
      const result = await paymentRetryScheduler.processRetries();
      
      // Assertions
      expect(paymentRecoveryServiceStub.calledOnce).to.be.true;
      expect(loggerStub.info.calledWith('Starting scheduled payment retry processing')).to.be.true;
      expect(loggerStub.info.calledWith(sinon.match(/Completed payment retry processing/))).to.be.true;
      
      // Verify result
      expect(result).to.be.an('object');
      expect(result.processed).to.equal(3);
      expect(result.succeeded).to.equal(2);
      expect(result.failed).to.equal(1);
      expect(result.duration).to.be.a('number');
    });
    
    it('should handle processing errors gracefully', async () => {
      // Mock error
      const error = new Error('Processing error');
      paymentRecoveryServiceStub.rejects(error);
      
      // Call the function and expect it to throw
      try {
        await paymentRetryScheduler.processRetries();
        // Should not reach here
        expect.fail('Should have thrown an error');
      } catch (err) {
        // Assertions
        expect(err).to.equal(error);
        expect(paymentRecoveryServiceStub.calledOnce).to.be.true;
        expect(loggerStub.error.calledWith(sinon.match(/Error processing payment retries/))).to.be.true;
      }
    });
    
    it('should calculate correct statistics from results', async () => {
      // Mock mixed results
      const mockResults = [
        { status: 'succeeded' },
        { status: 'failed' },
        { status: 'succeeded' },
        { status: 'pending' }, // Should not count as success or failure
        { status: 'succeeded' }
      ];
      paymentRecoveryServiceStub.resolves(mockResults);
      
      // Call the function
      const result = await paymentRetryScheduler.processRetries();
      
      // Assertions
      expect(result.processed).to.equal(5);
      expect(result.succeeded).to.equal(3);
      expect(result.failed).to.equal(1);
    });
  });
});
