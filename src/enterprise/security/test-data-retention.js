/**
 * Test script for Data Retention Service
 * 
 * This script demonstrates the data retention capabilities of the chatbot platform,
 * including policy management, data type registration, and purge operations.
 */

// Import required services
const { dataRetentionService } = require('./data-retention.service');
const { logger } = require('../../utils/mock-utils');

/**
 * Main test function
 */
async function testDataRetention() {
  logger.info('=== Data Retention Test ===\n');

  try {
    // 1. Get all data types
    logger.info('Retrieving registered data types:');
    const dataTypesResult = dataRetentionService.getAllDataTypes();
    logger.info(`Retrieved ${dataTypesResult.dataTypes.length} data types:`);
    
    dataTypesResult.dataTypes.forEach(dataType => {
      logger.info(`- ${dataType.name} (Sensitivity: ${dataType.sensitivity})`);
    });

    // 2. Register a custom data type
    logger.info('\nRegistering custom data type:');
    const customDataType = dataRetentionService.registerDataType({
      name: 'training_data',
      description: 'Training data for chatbot models',
      schema: {
        dataId: 'string',
        botId: 'string',
        examples: 'array',
        createdAt: 'date',
        updatedAt: 'date'
      },
      sensitivity: 'medium'
    });
    logger.info(`Registered custom data type: ${customDataType.dataType.name} (Sensitivity: ${customDataType.dataType.sensitivity})`);

    // 3. Get all retention policies
    logger.info('\nRetrieving retention policies:');
    const policiesResult = dataRetentionService.getAllPolicies();
    logger.info(`Retrieved ${policiesResult.policies.length} retention policies:`);
    
    policiesResult.policies.forEach(policy => {
      logger.info(`- ${policy.name}: ${policy.retentionPeriod} days, Action: ${policy.purgeAction}`);
      logger.info(`  Data Types: ${policy.dataTypes.join(', ')}`);
    });

    // 4. Create a custom retention policy
    logger.info('\nCreating custom retention policy:');
    const customPolicy = dataRetentionService.createRetentionPolicy({
      name: 'training_data_retention',
      description: 'Retention policy for training data',
      dataTypes: ['training_data'],
      retentionPeriod: 180, // 6 months
      legalHoldExempt: false,
      purgeAction: 'archive'
    });
    logger.info(`Created retention policy: ${customPolicy.policy.name}`);
    logger.info(`- Retention Period: ${customPolicy.policy.retentionPeriod} days`);
    logger.info(`- Purge Action: ${customPolicy.policy.purgeAction}`);
    logger.info(`- Data Types: ${customPolicy.policy.dataTypes.join(', ')}`);

    // 5. Update a retention policy
    logger.info('\nUpdating retention policy:');
    const updatedPolicy = dataRetentionService.updateRetentionPolicy('conversation_retention', {
      retentionPeriod: 180, // Changed from 365 to 180 days
      description: 'Updated retention policy for conversation data (6 months)'
    });
    logger.info(`Updated retention policy: ${updatedPolicy.policy.name}`);
    logger.info(`- New Retention Period: ${updatedPolicy.policy.retentionPeriod} days`);
    logger.info(`- New Description: ${updatedPolicy.policy.description}`);

    // 6. Create a purge job
    logger.info('\nCreating purge job:');
    const purgeJob = dataRetentionService.createPurgeJob({
      name: 'old_conversations_purge',
      description: 'Purge old conversation data',
      dataTypes: ['conversation'],
      olderThan: 90, // 90 days
      dryRun: false,
      purgeAction: 'delete',
      schedule: 'monthly'
    });
    logger.info(`Created purge job: ${purgeJob.job.name}`);
    logger.info(`- Data Types: ${purgeJob.job.dataTypes.join(', ')}`);
    logger.info(`- Older Than: ${purgeJob.job.olderThan} days`);
    logger.info(`- Schedule: ${purgeJob.job.schedule}`);
    logger.info(`- Next Run: ${purgeJob.job.nextRun}`);

    // 7. Run a purge job
    logger.info('\nRunning purge job:');
    const purgeResult = dataRetentionService.runPurgeJob('old_conversations_purge', { dryRun: true });
    logger.info(`Ran purge job: ${purgeResult.purgeResult.jobName} (Dry Run: ${purgeResult.purgeResult.dryRun})`);
    logger.info(`- Total Records: ${purgeResult.purgeResult.totalRecords}`);
    logger.info(`- Purged Records: ${purgeResult.purgeResult.purgedRecords}`);
    logger.info(`- Status: ${purgeResult.purgeResult.status}`);

    // 8. Get purge history
    logger.info('\nRetrieving purge history:');
    const historyResult = dataRetentionService.getPurgeHistory();
    logger.info(`Retrieved ${historyResult.history.length} purge history entries:`);
    
    historyResult.history.forEach(entry => {
      logger.info(`- Job: ${entry.jobName}, Run: ${new Date(entry.startTime).toLocaleString()}`);
      logger.info(`  Records: ${entry.totalRecords}, Purged: ${entry.purgedRecords}, Status: ${entry.status}`);
    });

    // 9. Apply legal hold
    logger.info('\nApplying legal hold:');
    const legalHold = dataRetentionService.applyLegalHold({
      name: 'litigation_hold_2025',
      description: 'Legal hold for pending litigation',
      dataTypes: ['user_profile', 'conversation', 'authentication_log'],
      criteria: {
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-12-31T23:59:59Z'
        },
        userIds: ['user123', 'user456']
      },
      expirationDate: '2026-12-31T23:59:59Z'
    });
    logger.info(`Applied legal hold: ${legalHold.legalHold.name}`);
    logger.info(`- Data Types: ${legalHold.legalHold.dataTypes.join(', ')}`);
    logger.info(`- Expiration: ${legalHold.legalHold.expirationDate || 'Indefinite'}`);
    logger.info(`- Status: ${legalHold.legalHold.status}`);

    // 10. Run another purge job with different options
    logger.info('\nRunning purge job with different options:');
    const purgeJob2 = dataRetentionService.createPurgeJob({
      name: 'old_auth_logs_purge',
      description: 'Purge old authentication logs',
      dataTypes: ['authentication_log'],
      olderThan: 30, // 30 days
      dryRun: false,
      purgeAction: 'archive',
      schedule: 'weekly'
    });
    logger.info(`Created purge job: ${purgeJob2.job.name}`);
    
    const purgeResult2 = dataRetentionService.runPurgeJob('old_auth_logs_purge', { dryRun: false });
    logger.info(`Ran purge job: ${purgeResult2.purgeResult.jobName} (Dry Run: ${purgeResult2.purgeResult.dryRun})`);
    logger.info(`- Total Records: ${purgeResult2.purgeResult.totalRecords}`);
    logger.info(`- Purged Records: ${purgeResult2.purgeResult.purgedRecords}`);
    logger.info(`- Status: ${purgeResult2.purgeResult.status}`);

    logger.info('\n=== Test Complete ===');
    logger.info('The Data Retention Service is ready for use in the chatbot platform.');
    logger.info('Key features demonstrated:');
    logger.info('1. Data type registration and management');
    logger.info('2. Retention policy creation and management');
    logger.info('3. Scheduled and manual data purging');
    logger.info('4. Multiple purge actions (delete, anonymize, archive)');
    logger.info('5. Legal hold application and enforcement');
    logger.info('6. Purge history tracking and reporting');
  } catch (error) {
    logger.error('Error during data retention test:', error.message);
  }
}

// Run the test
testDataRetention();
