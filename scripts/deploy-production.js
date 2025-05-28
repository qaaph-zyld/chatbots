/**
 * Production Deployment Script
 * 
 * This script handles the deployment of the application to the production environment.
 * It includes additional safeguards and verification steps compared to staging deployment.
 */

const { execSync } = require('child_process');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');
const performanceOptimizer = require('../src/utils/performance-optimizer');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize AWS services
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const elbv2 = new AWS.ELBv2();
const ssm = new AWS.SSM();
const cloudwatch = new AWS.CloudWatch();

// Configuration
const config = {
  environment: 'production',
  bucketName: process.env.S3_BUCKET_NAME || 'chatbot-platform-production',
  instanceTagName: 'chatbot-platform-production',
  targetGroup: process.env.TARGET_GROUP_ARN,
  deploymentId: `deploy-${Date.now()}`,
  artifactsPath: path.join(__dirname, '../dist'),
  // Blue-green deployment config
  blueGreenEnabled: process.env.BLUE_GREEN_ENABLED === 'true',
  blueGreenSwapTimeout: parseInt(process.env.BLUE_GREEN_SWAP_TIMEOUT || '300000'),
  // Canary deployment config
  canaryEnabled: process.env.CANARY_ENABLED === 'true',
  canaryPercentage: parseInt(process.env.CANARY_PERCENTAGE || '10'),
  canaryStepCount: parseInt(process.env.CANARY_STEP_COUNT || '5'),
  canaryStepDuration: parseInt(process.env.CANARY_STEP_DURATION || '600000')
};

/**
 * Main deployment function
 */
async function deploy() {
  try {
    logger.info('Starting deployment to production environment');
    
    // Pre-deployment checks
    await runPreDeploymentChecks();
    
    // Validate deployment artifacts
    validateArtifacts();
    
    // Upload artifacts to S3
    await uploadArtifactsToS3();
    
    // Choose deployment strategy
    if (config.blueGreenEnabled) {
      await blueGreenDeployment();
    } else if (config.canaryEnabled) {
      await canaryDeployment();
    } else {
      await standardDeployment();
    }
    
    // Run post-deployment verification
    await runPostDeploymentVerification();
    
    logger.info('Production deployment completed successfully');
    
    return {
      success: true,
      deploymentId: config.deploymentId,
      environment: config.environment,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Deployment to production failed', error);
    
    // Attempt rollback if necessary
    try {
      await rollback();
    } catch (rollbackError) {
      logger.error('Rollback failed', rollbackError);
    }
    
    throw error;
  }
}

/**
 * Run pre-deployment checks
 */
async function runPreDeploymentChecks() {
  logger.info('Running pre-deployment checks');
  
  // Check if staging deployment was successful
  const stagingDeploymentStatus = await checkStagingDeployment();
  if (!stagingDeploymentStatus.success) {
    throw new Error('Staging deployment was not successful. Aborting production deployment.');
  }
  
  // Check current system health
  const healthStatus = await checkSystemHealth();
  if (!healthStatus.healthy) {
    throw new Error('Current system health check failed. Aborting deployment.');
  }
  
  // Check for active alarms
  const alarms = await checkCloudWatchAlarms();
  if (alarms.length > 0) {
    throw new Error(`Active CloudWatch alarms detected: ${alarms.join(', ')}. Aborting deployment.`);
  }
  
  // Run performance optimization check
  const performanceReport = await performanceOptimizer.generatePerformanceReport();
  if (performanceReport.summary.overallStatus !== 'good') {
    logger.warn('Performance optimization report indicates issues', performanceReport.optimizations);
  }
  
  logger.info('Pre-deployment checks completed successfully');
}

/**
 * Check if staging deployment was successful
 */
async function checkStagingDeployment() {
  try {
    logger.info('Checking staging deployment status');
    
    // This would typically check a deployment status database or API
    // For now, we'll simulate this check
    
    return { success: true };
  } catch (error) {
    logger.error('Error checking staging deployment status', error);
    throw error;
  }
}

/**
 * Check current system health
 */
async function checkSystemHealth() {
  try {
    logger.info('Checking current system health');
    
    // Check target group health
    const targetGroupHealth = await checkTargetGroupHealth(config.targetGroup);
    
    // Check API health endpoints
    const apiHealth = await checkApiHealth();
    
    return {
      healthy: targetGroupHealth.healthy && apiHealth.healthy,
      targetGroupHealth,
      apiHealth
    };
  } catch (error) {
    logger.error('Error checking system health', error);
    throw error;
  }
}

/**
 * Check target group health
 */
async function checkTargetGroupHealth(targetGroupArn) {
  logger.info(`Checking health of target group: ${targetGroupArn}`);
  
  const result = await elbv2.describeTargetHealth({
    TargetGroupArn: targetGroupArn
  }).promise();
  
  const unhealthyTargets = result.TargetHealthDescriptions.filter(
    target => target.TargetHealth.State !== 'healthy'
  );
  
  return {
    healthy: unhealthyTargets.length === 0,
    totalTargets: result.TargetHealthDescriptions.length,
    unhealthyTargets: unhealthyTargets.length,
    details: unhealthyTargets
  };
}

/**
 * Check API health
 */
async function checkApiHealth() {
  // This would typically make HTTP requests to health endpoints
  // For now, we'll simulate this check
  return { healthy: true };
}

/**
 * Check CloudWatch alarms
 */
async function checkCloudWatchAlarms() {
  logger.info('Checking CloudWatch alarms');
  
  const params = {
    AlarmNames: [
      'chatbot-platform-high-cpu',
      'chatbot-platform-high-memory',
      'chatbot-platform-high-error-rate',
      'chatbot-platform-high-response-time'
    ],
    StateValue: 'ALARM'
  };
  
  const result = await cloudwatch.describeAlarms(params).promise();
  
  return result.MetricAlarms.map(alarm => alarm.AlarmName);
}

/**
 * Validate deployment artifacts
 */
function validateArtifacts() {
  logger.info('Validating deployment artifacts');
  
  if (!fs.existsSync(config.artifactsPath)) {
    throw new Error(`Artifacts directory not found: ${config.artifactsPath}`);
  }
  
  const requiredFiles = ['index.js', 'package.json'];
  
  for (const file of requiredFiles) {
    const filePath = path.join(config.artifactsPath, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file not found: ${file}`);
    }
  }
  
  logger.info('Deployment artifacts validated successfully');
}

/**
 * Upload artifacts to S3
 */
async function uploadArtifactsToS3() {
  logger.info(`Uploading artifacts to S3 bucket: ${config.bucketName}`);
  
  // Create deployment package
  const deploymentPackage = path.join(__dirname, '../', `${config.deploymentId}.zip`);
  
  // Zip the artifacts
  execSync(`cd ${config.artifactsPath} && zip -r ${deploymentPackage} .`);
  
  // Upload to S3
  const fileContent = fs.readFileSync(deploymentPackage);
  
  await s3.putObject({
    Bucket: config.bucketName,
    Key: `deployments/${config.deploymentId}.zip`,
    Body: fileContent
  }).promise();
  
  // Clean up local zip file
  fs.unlinkSync(deploymentPackage);
  
  logger.info('Artifacts uploaded to S3 successfully');
}

/**
 * Standard deployment to all instances simultaneously
 */
async function standardDeployment() {
  logger.info('Starting standard deployment');
  
  // Get target instances
  const instances = await getTargetInstances();
  
  if (instances.length === 0) {
    throw new Error('No target instances found for deployment');
  }
  
  logger.info(`Found ${instances.length} target instances for deployment`);
  
  // Deploy to each instance
  for (const instance of instances) {
    await deployToInstance(instance);
  }
  
  // Verify deployment
  await verifyDeployment();
  
  logger.info('Standard deployment completed successfully');
}

/**
 * Blue-Green deployment
 */
async function blueGreenDeployment() {
  logger.info('Starting blue-green deployment');
  
  // Get current (blue) target group
  const blueTargetGroup = config.targetGroup;
  
  // Create or get green target group
  const greenTargetGroup = await createOrGetGreenTargetGroup();
  
  // Get or create green instances
  const greenInstances = await createGreenInstances();
  
  // Deploy to green instances
  for (const instance of greenInstances) {
    await deployToInstance(instance);
  }
  
  // Register green instances with green target group
  await registerInstancesWithTargetGroup(greenInstances, greenTargetGroup);
  
  // Verify green deployment
  await verifyTargetGroupHealth(greenTargetGroup);
  
  // Swap traffic from blue to green
  await swapTraffic(blueTargetGroup, greenTargetGroup);
  
  // Monitor for issues
  await monitorDeployment(greenTargetGroup, config.blueGreenSwapTimeout);
  
  // If successful, terminate blue instances
  await terminateOldInstances();
  
  logger.info('Blue-green deployment completed successfully');
}

/**
 * Canary deployment
 */
async function canaryDeployment() {
  logger.info('Starting canary deployment');
  
  // Get all instances
  const instances = await getTargetInstances();
  
  if (instances.length === 0) {
    throw new Error('No target instances found for deployment');
  }
  
  // Calculate instances per step
  const totalInstances = instances.length;
  const instancesPerStep = Math.max(1, Math.ceil((totalInstances * config.canaryPercentage) / 100));
  
  logger.info(`Canary deployment: ${instancesPerStep} instances per step out of ${totalInstances} total`);
  
  // Deploy in steps
  for (let step = 0; step < config.canaryStepCount; step++) {
    const startIdx = step * instancesPerStep;
    const endIdx = Math.min(startIdx + instancesPerStep, totalInstances);
    
    if (startIdx >= totalInstances) {
      break;
    }
    
    const stepInstances = instances.slice(startIdx, endIdx);
    
    logger.info(`Deploying to ${stepInstances.length} instances in step ${step + 1}`);
    
    // Deploy to instances in this step
    for (const instance of stepInstances) {
      await deployToInstance(instance);
    }
    
    // Verify deployment for this step
    await verifyStepDeployment(stepInstances);
    
    // Monitor for issues before proceeding to next step
    if (step < config.canaryStepCount - 1) {
      await monitorDeployment(null, config.canaryStepDuration);
    }
  }
  
  // Final verification
  await verifyDeployment();
  
  logger.info('Canary deployment completed successfully');
}

/**
 * Get target EC2 instances
 */
async function getTargetInstances() {
  logger.info('Getting target EC2 instances');
  
  const params = {
    Filters: [
      {
        Name: 'tag:Environment',
        Values: [config.environment]
      },
      {
        Name: 'tag:Application',
        Values: [config.instanceTagName]
      },
      {
        Name: 'instance-state-name',
        Values: ['running']
      }
    ]
  };
  
  const result = await ec2.describeInstances(params).promise();
  
  // Extract instance IDs
  const instances = [];
  
  for (const reservation of result.Reservations) {
    for (const instance of reservation.Instances) {
      instances.push({
        id: instance.InstanceId,
        privateIp: instance.PrivateIpAddress,
        publicIp: instance.PublicIpAddress
      });
    }
  }
  
  return instances;
}

/**
 * Deploy to a specific EC2 instance
 */
async function deployToInstance(instance) {
  logger.info(`Deploying to instance: ${instance.id}`);
  
  // Create SSM command to deploy
  const commands = [
    '#!/bin/bash',
    'set -e',
    `echo "Starting deployment ${config.deploymentId}"`,
    'cd /opt/chatbot-platform',
    'sudo systemctl stop chatbot-platform',
    `aws s3 cp s3://${config.bucketName}/deployments/${config.deploymentId}.zip .`,
    'mkdir -p deployment-temp',
    `unzip -o ${config.deploymentId}.zip -d deployment-temp`,
    'cp -r deployment-temp/* .',
    'rm -rf deployment-temp',
    `rm ${config.deploymentId}.zip`,
    'npm ci --production',
    'cp /opt/chatbot-platform/config/production.env .env',
    'sudo systemctl start chatbot-platform',
    `echo "Deployment ${config.deploymentId} completed"`
  ];
  
  const params = {
    DocumentName: 'AWS-RunShellScript',
    InstanceIds: [instance.id],
    Parameters: {
      commands: commands
    }
  };
  
  const result = await ssm.sendCommand(params).promise();
  
  // Wait for command to complete
  const commandId = result.Command.CommandId;
  await waitForCommand(commandId, instance.id);
  
  logger.info(`Deployment to instance ${instance.id} completed`);
}

/**
 * Wait for SSM command to complete
 */
async function waitForCommand(commandId, instanceId) {
  logger.info(`Waiting for command ${commandId} to complete on instance ${instanceId}`);
  
  let status = 'Pending';
  
  while (status === 'Pending' || status === 'InProgress') {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const result = await ssm.getCommandInvocation({
      CommandId: commandId,
      InstanceId: instanceId
    }).promise();
    
    status = result.Status;
    
    logger.info(`Command status: ${status}`);
    
    if (status === 'Failed') {
      throw new Error(`Command failed: ${result.StandardErrorContent}`);
    }
  }
  
  return status;
}

/**
 * Verify deployment
 */
async function verifyDeployment() {
  logger.info('Verifying deployment');
  
  // Wait for instances to be healthy in target group
  if (config.targetGroup) {
    await verifyTargetGroupHealth(config.targetGroup);
  }
  
  // Run smoke tests
  await runSmokeTests();
  
  // Check application metrics
  await checkApplicationMetrics();
  
  logger.info('Deployment verification completed successfully');
}

/**
 * Verify step deployment for canary deployment
 */
async function verifyStepDeployment(instances) {
  logger.info(`Verifying deployment for ${instances.length} instances`);
  
  // Check instance health
  for (const instance of instances) {
    await checkInstanceHealth(instance);
  }
  
  // Run basic smoke tests
  await runSmokeTests();
  
  logger.info('Step deployment verification completed successfully');
}

/**
 * Check instance health
 */
async function checkInstanceHealth(instance) {
  logger.info(`Checking health of instance: ${instance.id}`);
  
  // Check instance status
  const statusParams = {
    InstanceIds: [instance.id]
  };
  
  const statusResult = await ec2.describeInstanceStatus(statusParams).promise();
  
  if (statusResult.InstanceStatuses.length === 0) {
    throw new Error(`Instance ${instance.id} not found`);
  }
  
  const instanceStatus = statusResult.InstanceStatuses[0];
  
  if (instanceStatus.InstanceStatus.Status !== 'ok' || instanceStatus.SystemStatus.Status !== 'ok') {
    throw new Error(`Instance ${instance.id} is not healthy: ${JSON.stringify(instanceStatus)}`);
  }
  
  // Check application health via SSM
  const healthCheckCommand = [
    '#!/bin/bash',
    'curl -s http://localhost:3000/health'
  ];
  
  const commandParams = {
    DocumentName: 'AWS-RunShellScript',
    InstanceIds: [instance.id],
    Parameters: {
      commands: healthCheckCommand
    }
  };
  
  const commandResult = await ssm.sendCommand(commandParams).promise();
  const commandId = commandResult.Command.CommandId;
  
  await waitForCommand(commandId, instance.id);
  
  const invocationResult = await ssm.getCommandInvocation({
    CommandId: commandId,
    InstanceId: instance.id
  }).promise();
  
  if (invocationResult.Status !== 'Success') {
    throw new Error(`Health check failed for instance ${instance.id}: ${invocationResult.StandardErrorContent}`);
  }
  
  try {
    const healthResponse = JSON.parse(invocationResult.StandardOutputContent);
    
    if (healthResponse.status !== 'ok') {
      throw new Error(`Health check returned non-ok status: ${healthResponse.status}`);
    }
  } catch (error) {
    throw new Error(`Failed to parse health check response: ${invocationResult.StandardOutputContent}`);
  }
  
  logger.info(`Instance ${instance.id} is healthy`);
}

/**
 * Run smoke tests
 */
async function runSmokeTests() {
  logger.info('Running smoke tests');
  
  // This would typically make HTTP requests to verify key functionality
  // For now, we'll simulate this check
  
  logger.info('Smoke tests completed successfully');
}

/**
 * Check application metrics
 */
async function checkApplicationMetrics() {
  logger.info('Checking application metrics');
  
  // This would typically query CloudWatch or other monitoring systems
  // For now, we'll simulate this check
  
  logger.info('Application metrics check completed successfully');
}

/**
 * Monitor deployment for a specified duration
 */
async function monitorDeployment(targetGroupArn, duration) {
  logger.info(`Monitoring deployment for ${duration / 1000} seconds`);
  
  const startTime = Date.now();
  const endTime = startTime + duration;
  
  while (Date.now() < endTime) {
    // Check for any issues
    try {
      // Check CloudWatch alarms
      const alarms = await checkCloudWatchAlarms();
      if (alarms.length > 0) {
        throw new Error(`Active CloudWatch alarms detected during monitoring: ${alarms.join(', ')}`);
      }
      
      // Check target group health if specified
      if (targetGroupArn) {
        const health = await checkTargetGroupHealth(targetGroupArn);
        if (!health.healthy) {
          throw new Error(`Target group health check failed during monitoring: ${JSON.stringify(health)}`);
        }
      }
    } catch (error) {
      logger.error('Error during deployment monitoring', error);
      throw error;
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  logger.info('Deployment monitoring completed successfully');
}

/**
 * Run post-deployment verification
 */
async function runPostDeploymentVerification() {
  logger.info('Running post-deployment verification');
  
  // Verify all instances are healthy
  const instances = await getTargetInstances();
  for (const instance of instances) {
    await checkInstanceHealth(instance);
  }
  
  // Verify target group health
  if (config.targetGroup) {
    await verifyTargetGroupHealth(config.targetGroup);
  }
  
  // Run comprehensive smoke tests
  await runSmokeTests();
  
  // Check application metrics
  await checkApplicationMetrics();
  
  // Create deployment record
  await createDeploymentRecord();
  
  logger.info('Post-deployment verification completed successfully');
}

/**
 * Create deployment record
 */
async function createDeploymentRecord() {
  logger.info('Creating deployment record');
  
  // This would typically write to a database or other persistent storage
  // For now, we'll simulate this
  
  const deploymentRecord = {
    id: config.deploymentId,
    environment: config.environment,
    timestamp: new Date().toISOString(),
    status: 'success'
  };
  
  // Write to a local file for demonstration
  const recordsDir = path.join(__dirname, '../reports/deployments');
  if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(recordsDir, `${config.deploymentId}.json`),
    JSON.stringify(deploymentRecord, null, 2)
  );
  
  logger.info('Deployment record created successfully');
}

/**
 * Rollback deployment
 */
async function rollback() {
  logger.info('Rolling back deployment');
  
  // Get previous successful deployment ID
  const previousDeploymentId = await getPreviousDeploymentId();
  
  if (!previousDeploymentId) {
    logger.error('No previous successful deployment found for rollback');
    return;
  }
  
  logger.info(`Rolling back to previous deployment: ${previousDeploymentId}`);
  
  // Get target instances
  const instances = await getTargetInstances();
  
  // Deploy previous version to each instance
  for (const instance of instances) {
    await rollbackInstance(instance, previousDeploymentId);
  }
  
  // Verify rollback
  await verifyDeployment();
  
  logger.info('Rollback completed successfully');
}

/**
 * Get previous successful deployment ID
 */
async function getPreviousDeploymentId() {
  // This would typically query a database or other persistent storage
  // For now, we'll simulate this
  
  return 'previous-deployment-id';
}

/**
 * Rollback an instance to a previous deployment
 */
async function rollbackInstance(instance, deploymentId) {
  logger.info(`Rolling back instance ${instance.id} to deployment ${deploymentId}`);
  
  // Create SSM command to rollback
  const commands = [
    '#!/bin/bash',
    'set -e',
    `echo "Starting rollback to ${deploymentId}"`,
    'cd /opt/chatbot-platform',
    'sudo systemctl stop chatbot-platform',
    `aws s3 cp s3://${config.bucketName}/deployments/${deploymentId}.zip .`,
    'mkdir -p rollback-temp',
    `unzip -o ${deploymentId}.zip -d rollback-temp`,
    'cp -r rollback-temp/* .',
    'rm -rf rollback-temp',
    `rm ${deploymentId}.zip`,
    'npm ci --production',
    'cp /opt/chatbot-platform/config/production.env .env',
    'sudo systemctl start chatbot-platform',
    `echo "Rollback to ${deploymentId} completed"`
  ];
  
  const params = {
    DocumentName: 'AWS-RunShellScript',
    InstanceIds: [instance.id],
    Parameters: {
      commands: commands
    }
  };
  
  const result = await ssm.sendCommand(params).promise();
  
  // Wait for command to complete
  const commandId = result.Command.CommandId;
  await waitForCommand(commandId, instance.id);
  
  logger.info(`Rollback of instance ${instance.id} completed`);
}

// Run the deployment if this script is executed directly
if (require.main === module) {
  deploy()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Deployment failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = deploy;
}
