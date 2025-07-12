#!/usr/bin/env node

/**
 * Deployment Rollback Script
 * 
 * This script automates the process of rolling back to a previous deployment
 * if issues are detected in the current deployment.
 */

const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  environment: process.env.ENVIRONMENT || 'production',
  namespace: process.env.NAMESPACE || 'chatbot-platform-prod',
  serviceName: process.env.SERVICE_NAME || 'chatbot-platform',
  deploymentPrefix: process.env.DEPLOYMENT_PREFIX || 'chatbot-platform',
  currentColor: process.env.CURRENT_COLOR,
  kubeConfigPath: process.env.KUBE_CONFIG_PATH,
  applicationUrl: process.env.APPLICATION_URL || 'https://chatbot-platform.example.com',
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  rollbackReason: process.env.ROLLBACK_REASON || 'Automated rollback due to failed verification tests',
  healthCheckEndpoint: process.env.HEALTH_CHECK_ENDPOINT || '/health',
  healthCheckTimeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '30000'),
  healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '5000'),
  rollbackHistoryPath: path.join(__dirname, '../logs/rollback-history.json')
};

/**
 * Main rollback function
 */
async function rollbackDeployment() {
  console.log(`Starting rollback process for ${config.environment} environment`);
  
  try {
    // Determine current and previous colors
    const currentColor = config.currentColor || getCurrentDeploymentColor();
    const previousColor = currentColor === 'blue' ? 'green' : 'blue';
    
    console.log(`Current deployment color: ${currentColor}`);
    console.log(`Rolling back to: ${previousColor}`);
    
    // Check if previous deployment exists
    if (!deploymentExists(previousColor)) {
      throw new Error(`Previous deployment (${previousColor}) does not exist`);
    }
    
    // Check if previous deployment is healthy
    if (!await isDeploymentHealthy(previousColor)) {
      throw new Error(`Previous deployment (${previousColor}) is not healthy`);
    }
    
    // Switch traffic to previous deployment
    switchTraffic(previousColor);
    
    // Verify rollback
    if (!await verifyRollback(previousColor)) {
      throw new Error('Rollback verification failed');
    }
    
    // Record rollback
    recordRollback({
      timestamp: new Date().toISOString(),
      environment: config.environment,
      fromColor: currentColor,
      toColor: previousColor,
      reason: config.rollbackReason,
      success: true
    });
    
    // Send notification
    await sendNotification({
      status: 'success',
      title: `Rollback Successful - ${config.environment}`,
      message: `Successfully rolled back from ${currentColor} to ${previousColor}`,
      color: '#2ecc71',
      fields: {
        Environment: config.environment,
        'From Color': currentColor,
        'To Color': previousColor,
        Reason: config.rollbackReason
      }
    });
    
    console.log('Rollback completed successfully');
    return true;
  } catch (error) {
    console.error(`Rollback failed: ${error.message}`);
    
    // Record failed rollback
    recordRollback({
      timestamp: new Date().toISOString(),
      environment: config.environment,
      fromColor: config.currentColor,
      reason: config.rollbackReason,
      success: false,
      error: error.message
    });
    
    // Send notification
    await sendNotification({
      status: 'failure',
      title: `Rollback Failed - ${config.environment}`,
      message: `Failed to rollback: ${error.message}`,
      color: '#e74c3c',
      fields: {
        Environment: config.environment,
        'Current Color': config.currentColor,
        Reason: config.rollbackReason,
        Error: error.message
      }
    });
    
    throw error;
  }
}

/**
 * Get current deployment color
 */
function getCurrentDeploymentColor() {
  console.log('Determining current deployment color');
  
  try {
    const output = execSync(`kubectl get service ${config.serviceName} -n ${config.namespace} -o jsonpath='{.spec.selector.color}'`, {
      encoding: 'utf8'
    });
    
    return output.trim();
  } catch (error) {
    console.error(`Error determining current deployment color: ${error.message}`);
    throw new Error('Failed to determine current deployment color');
  }
}

/**
 * Check if deployment exists
 */
function deploymentExists(color) {
  console.log(`Checking if ${color} deployment exists`);
  
  try {
    const output = execSync(`kubectl get deployment ${config.deploymentPrefix}-${color} -n ${config.namespace} -o name`, {
      encoding: 'utf8'
    });
    
    return output.trim().length > 0;
  } catch (error) {
    console.error(`Error checking if deployment exists: ${error.message}`);
    return false;
  }
}

/**
 * Check if deployment is healthy
 */
async function isDeploymentHealthy(color) {
  console.log(`Checking if ${color} deployment is healthy`);
  
  try {
    // Check deployment status
    const deploymentStatus = execSync(`kubectl get deployment ${config.deploymentPrefix}-${color} -n ${config.namespace} -o jsonpath='{.status.readyReplicas}/{.status.replicas}'`, {
      encoding: 'utf8'
    });
    
    const [readyReplicas, totalReplicas] = deploymentStatus.trim().split('/').map(Number);
    
    if (readyReplicas < totalReplicas) {
      console.warn(`Deployment not fully ready: ${readyReplicas}/${totalReplicas} replicas ready`);
      return false;
    }
    
    // Check service health
    const serviceUrl = `http://${config.deploymentPrefix}-${color}.${config.namespace}.svc.cluster.local${config.healthCheckEndpoint}`;
    
    console.log(`Checking health endpoint: ${serviceUrl}`);
    
    const response = await axios.get(serviceUrl, { timeout: 5000 });
    
    return response.status === 200 && response.data.status === 'ok';
  } catch (error) {
    console.error(`Error checking deployment health: ${error.message}`);
    return false;
  }
}

/**
 * Switch traffic to specified color
 */
function switchTraffic(color) {
  console.log(`Switching traffic to ${color} deployment`);
  
  try {
    execSync(`kubectl patch service ${config.serviceName} -n ${config.namespace} -p '{"spec":{"selector":{"color":"${color}"}}}'`, {
      encoding: 'utf8'
    });
    
    console.log(`Traffic switched to ${color} deployment`);
    return true;
  } catch (error) {
    console.error(`Error switching traffic: ${error.message}`);
    throw new Error(`Failed to switch traffic to ${color} deployment`);
  }
}

/**
 * Verify rollback was successful
 */
async function verifyRollback(color) {
  console.log('Verifying rollback');
  
  try {
    // Wait for DNS propagation
    console.log(`Waiting for DNS propagation (${config.healthCheckTimeout / 1000}s timeout)`);
    
    const startTime = Date.now();
    let isHealthy = false;
    
    while (Date.now() - startTime < config.healthCheckTimeout) {
      try {
        const response = await axios.get(`${config.applicationUrl}${config.healthCheckEndpoint}`, {
          timeout: 5000
        });
        
        if (response.status === 200 && response.data.status === 'ok') {
          isHealthy = true;
          break;
        }
      } catch (error) {
        console.warn(`Health check failed, retrying in ${config.healthCheckInterval / 1000}s: ${error.message}`);
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, config.healthCheckInterval));
    }
    
    if (!isHealthy) {
      console.error('Rollback verification failed: Health check timed out');
      return false;
    }
    
    // Verify current service selector
    const currentSelector = execSync(`kubectl get service ${config.serviceName} -n ${config.namespace} -o jsonpath='{.spec.selector.color}'`, {
      encoding: 'utf8'
    }).trim();
    
    if (currentSelector !== color) {
      console.error(`Rollback verification failed: Service selector is ${currentSelector}, expected ${color}`);
      return false;
    }
    
    console.log('Rollback verification successful');
    return true;
  } catch (error) {
    console.error(`Rollback verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Record rollback in history
 */
function recordRollback(rollbackData) {
  console.log('Recording rollback in history');
  
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(config.rollbackHistoryPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Read existing history
    let history = [];
    
    if (fs.existsSync(config.rollbackHistoryPath)) {
      try {
        history = JSON.parse(fs.readFileSync(config.rollbackHistoryPath, 'utf8'));
      } catch (error) {
        console.warn(`Error reading rollback history: ${error.message}`);
      }
    }
    
    // Add new entry
    history.push(rollbackData);
    
    // Write updated history
    fs.writeFileSync(config.rollbackHistoryPath, JSON.stringify(history, null, 2));
    
    console.log('Rollback recorded in history');
  } catch (error) {
    console.error(`Error recording rollback: ${error.message}`);
  }
}

/**
 * Send notification about rollback
 */
async function sendNotification(data) {
  if (!config.slackWebhookUrl) {
    console.log('Slack webhook URL not configured, skipping notification');
    return;
  }
  
  console.log('Sending rollback notification');
  
  try {
    const fields = Object.entries(data.fields || {}).map(([title, value]) => ({
      title,
      value,
      short: true
    }));
    
    const payload = {
      attachments: [
        {
          color: data.color || '#3498db',
          pretext: data.title,
          text: data.message,
          fields,
          footer: 'Chatbot Platform CI/CD',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
    
    await axios.post(config.slackWebhookUrl, payload);
    console.log('Notification sent');
  } catch (error) {
    console.error(`Error sending notification: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Set Kubernetes config if provided
    if (config.kubeConfigPath) {
      process.env.KUBECONFIG = config.kubeConfigPath;
    }
    
    await rollbackDeployment();
    process.exit(0);
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  rollbackDeployment,
  getCurrentDeploymentColor,
  deploymentExists,
  isDeploymentHealthy,
  switchTraffic,
  verifyRollback
};
