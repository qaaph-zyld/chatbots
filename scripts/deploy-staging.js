/**
 * Staging Deployment Script
 * 
 * This script handles the deployment of the application to the staging environment.
 * It uses the AWS SDK to deploy to EC2 instances and configure the necessary services.
 */

const { execSync } = require('child_process');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize AWS services
const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const elbv2 = new AWS.ELBv2();
const ssm = new AWS.SSM();

// Configuration
const config = {
  environment: 'staging',
  bucketName: process.env.S3_BUCKET_NAME || 'chatbot-platform-staging',
  instanceTagName: 'chatbot-platform-staging',
  targetGroup: process.env.TARGET_GROUP_ARN,
  deploymentId: `deploy-${Date.now()}`,
  artifactsPath: path.join(__dirname, '../dist')
};

/**
 * Main deployment function
 */
async function deploy() {
  try {
    logger.info('Starting deployment to staging environment');
    
    // Validate deployment artifacts
    validateArtifacts();
    
    // Upload artifacts to S3
    await uploadArtifactsToS3();
    
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
    
    logger.info('Staging deployment completed successfully');
    
    return {
      success: true,
      deploymentId: config.deploymentId,
      environment: config.environment,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Deployment to staging failed', error);
    throw error;
  }
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
    'cp /opt/chatbot-platform/config/staging.env .env',
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
    await verifyTargetGroupHealth();
  }
  
  // Additional verification steps can be added here
  
  logger.info('Deployment verification completed successfully');
}

/**
 * Verify target group health
 */
async function verifyTargetGroupHealth() {
  logger.info(`Verifying health of target group: ${config.targetGroup}`);
  
  let allHealthy = false;
  let attempts = 0;
  const maxAttempts = 12; // 2 minutes (12 * 10 seconds)
  
  while (!allHealthy && attempts < maxAttempts) {
    attempts++;
    
    const result = await elbv2.describeTargetHealth({
      TargetGroupArn: config.targetGroup
    }).promise();
    
    const unhealthyTargets = result.TargetHealthDescriptions.filter(
      target => target.TargetHealth.State !== 'healthy'
    );
    
    if (unhealthyTargets.length === 0) {
      allHealthy = true;
      logger.info('All targets are healthy');
    } else {
      logger.info(`${unhealthyTargets.length} targets are still unhealthy. Waiting...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  if (!allHealthy) {
    throw new Error('Target group health check failed after maximum attempts');
  }
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
