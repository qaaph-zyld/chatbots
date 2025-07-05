/**
 * Blue-Green Deployment Script
 * 
 * This script handles blue-green deployments for the Chatbot Platform.
 * It creates a new deployment (green) alongside the existing one (blue),
 * runs verification tests, and switches traffic if tests pass.
 */

const k8s = require('@kubernetes/client-node');
const axios = require('axios');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const NAMESPACE = process.env.NAMESPACE || 'chatbot-platform';
const BLUE_DEPLOYMENT = process.env.BLUE_DEPLOYMENT || 'chatbot-platform-blue';
const GREEN_DEPLOYMENT = process.env.GREEN_DEPLOYMENT || 'chatbot-platform-green';
const SERVICE_NAME = process.env.SERVICE_NAME || 'chatbot-platform';
const IMAGE = process.env.IMAGE;
const VERSION = process.env.VERSION || 'latest';
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID || Date.now().toString();
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Initialize Kubernetes client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sAppsV1Api = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreV1Api = kc.makeApiClient(k8s.CoreV1Api);

// Logger
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data
  };
  console.log(JSON.stringify(logEntry));
}

/**
 * Get the active deployment (blue or green)
 */
async function getActiveDeployment() {
  try {
    const service = await k8sCoreV1Api.readNamespacedService(SERVICE_NAME, NAMESPACE);
    const selector = service.body.spec.selector;
    const selectorString = Object.entries(selector)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');
    
    const deployments = await k8sAppsV1Api.listNamespacedDeployment(
      NAMESPACE,
      undefined,
      undefined,
      undefined,
      undefined,
      selectorString
    );
    
    if (deployments.body.items.length === 0) {
      return null;
    }
    
    return deployments.body.items[0].metadata.name;
  } catch (error) {
    log('error', 'Failed to get active deployment', { error: error.message });
    return null;
  }
}

/**
 * Deploy the green environment
 */
async function deployGreen() {
  try {
    log('info', 'Deploying green environment', { deployment: GREEN_DEPLOYMENT, image: `${IMAGE}:${VERSION}` });
    
    // Check if green deployment already exists
    try {
      await k8sAppsV1Api.readNamespacedDeployment(GREEN_DEPLOYMENT, NAMESPACE);
      log('info', 'Green deployment already exists, deleting it first');
      await k8sAppsV1Api.deleteNamespacedDeployment(GREEN_DEPLOYMENT, NAMESPACE);
      
      // Wait for deletion to complete
      let deleted = false;
      while (!deleted) {
        try {
          await k8sAppsV1Api.readNamespacedDeployment(GREEN_DEPLOYMENT, NAMESPACE);
          log('info', 'Waiting for green deployment to be deleted');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          deleted = true;
        }
      }
    } catch (error) {
      // Deployment doesn't exist, which is fine
    }
    
    // Get the blue deployment to copy configuration
    const blueDeployment = await k8sAppsV1Api.readNamespacedDeployment(BLUE_DEPLOYMENT, NAMESPACE);
    
    // Create green deployment based on blue
    const greenDeployment = JSON.parse(JSON.stringify(blueDeployment.body));
    greenDeployment.metadata.name = GREEN_DEPLOYMENT;
    greenDeployment.metadata.labels = {
      ...greenDeployment.metadata.labels,
      'deployment-type': 'green',
      'version': VERSION
    };
    
    // Update the container image
    greenDeployment.spec.template.spec.containers[0].image = `${IMAGE}:${VERSION}`;
    
    // Add deployment-type label to pod template
    greenDeployment.spec.template.metadata.labels = {
      ...greenDeployment.spec.template.metadata.labels,
      'deployment-type': 'green',
      'version': VERSION
    };
    
    // Remove resource version to avoid conflicts
    delete greenDeployment.metadata.resourceVersion;
    delete greenDeployment.metadata.uid;
    delete greenDeployment.metadata.creationTimestamp;
    delete greenDeployment.status;
    
    // Create the green deployment
    await k8sAppsV1Api.createNamespacedDeployment(NAMESPACE, greenDeployment);
    log('info', 'Green deployment created');
    
    // Wait for deployment to be ready
    log('info', 'Waiting for green deployment to be ready');
    execSync(`kubectl rollout status deployment/${GREEN_DEPLOYMENT} -n ${NAMESPACE}`);
    log('info', 'Green deployment is ready');
    
    return true;
  } catch (error) {
    log('error', 'Failed to deploy green environment', { error: error.message });
    return false;
  }
}

/**
 * Run verification tests against the green environment
 */
async function runVerificationTests() {
  try {
    log('info', 'Running verification tests against green environment');
    
    // Get the green service URL
    const greenServiceName = `${GREEN_DEPLOYMENT}-test`;
    
    // Create a temporary service pointing to the green deployment
    try {
      await k8sCoreV1Api.readNamespacedService(greenServiceName, NAMESPACE);
      log('info', 'Green test service already exists, deleting it first');
      await k8sCoreV1Api.deleteNamespacedService(greenServiceName, NAMESPACE);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Service doesn't exist, which is fine
    }
    
    // Create the green test service
    const greenDeployment = await k8sAppsV1Api.readNamespacedDeployment(GREEN_DEPLOYMENT, NAMESPACE);
    const selector = greenDeployment.body.spec.selector.matchLabels;
    
    const greenService = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: greenServiceName,
        namespace: NAMESPACE
      },
      spec: {
        selector,
        ports: [
          {
            port: 80,
            targetPort: 3000
          }
        ]
      }
    };
    
    await k8sCoreV1Api.createNamespacedService(NAMESPACE, greenService);
    log('info', 'Green test service created');
    
    // Wait for service to be available
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the service URL
    const greenServiceUrl = `http://${greenServiceName}.${NAMESPACE}.svc.cluster.local`;
    log('info', 'Green service URL', { url: greenServiceUrl });
    
    // Run smoke tests
    log('info', 'Running smoke tests');
    const smokeTestsResult = await runTests('smoke', greenServiceUrl);
    
    if (!smokeTestsResult.success) {
      log('error', 'Smoke tests failed', { details: smokeTestsResult.details });
      return false;
    }
    
    log('info', 'Smoke tests passed');
    
    // Run UI verification tests
    log('info', 'Running UI verification tests');
    const uiTestsResult = await runTests('verification', greenServiceUrl);
    
    if (!uiTestsResult.success) {
      log('error', 'UI verification tests failed', { details: uiTestsResult.details });
      return false;
    }
    
    log('info', 'UI verification tests passed');
    
    // Run performance tests
    log('info', 'Running performance tests');
    const performanceTestsResult = await runTests('performance', greenServiceUrl);
    
    if (!performanceTestsResult.success) {
      log('error', 'Performance tests failed', { details: performanceTestsResult.details });
      return false;
    }
    
    log('info', 'Performance tests passed');
    
    // Run security tests
    log('info', 'Running security tests');
    const securityTestsResult = await runTests('security', greenServiceUrl);
    
    if (!securityTestsResult.success) {
      log('error', 'Security tests failed', { details: securityTestsResult.details });
      return false;
    }
    
    log('info', 'Security tests passed');
    
    // Clean up the test service
    await k8sCoreV1Api.deleteNamespacedService(greenServiceName, NAMESPACE);
    log('info', 'Green test service deleted');
    
    return true;
  } catch (error) {
    log('error', 'Failed to run verification tests', { error: error.message });
    return false;
  }
}

/**
 * Run a specific test suite
 */
async function runTests(testType, serviceUrl) {
  return new Promise((resolve) => {
    const testProcess = spawn('node', [
      `./tests/${testType}/${testType}-tests.js`
    ], {
      env: {
        ...process.env,
        TEST_URL: serviceUrl
      }
    });
    
    let output = '';
    
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    testProcess.stderr.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data);
    });
    
    testProcess.on('close', (code) => {
      resolve({
        success: code === 0,
        details: output
      });
    });
  });
}

/**
 * Switch traffic from blue to green
 */
async function switchTraffic() {
  try {
    log('info', 'Switching traffic from blue to green');
    
    // Get the service
    const service = await k8sCoreV1Api.readNamespacedService(SERVICE_NAME, NAMESPACE);
    
    // Get the green deployment
    const greenDeployment = await k8sAppsV1Api.readNamespacedDeployment(GREEN_DEPLOYMENT, NAMESPACE);
    const greenSelector = greenDeployment.body.spec.selector.matchLabels;
    
    // Update the service selector to point to green
    const updatedService = JSON.parse(JSON.stringify(service.body));
    updatedService.spec.selector = greenSelector;
    
    // Update the service
    await k8sCoreV1Api.replaceNamespacedService(SERVICE_NAME, NAMESPACE, updatedService);
    log('info', 'Traffic switched to green deployment');
    
    return true;
  } catch (error) {
    log('error', 'Failed to switch traffic', { error: error.message });
    return false;
  }
}

/**
 * Clean up the old blue deployment
 */
async function cleanupOldDeployment() {
  try {
    log('info', 'Cleaning up old blue deployment');
    
    // Rename the current green deployment to blue
    const greenDeployment = await k8sAppsV1Api.readNamespacedDeployment(GREEN_DEPLOYMENT, NAMESPACE);
    const newBlueDeployment = JSON.parse(JSON.stringify(greenDeployment.body));
    
    // Update labels and name
    newBlueDeployment.metadata.name = BLUE_DEPLOYMENT;
    newBlueDeployment.metadata.labels = {
      ...newBlueDeployment.metadata.labels,
      'deployment-type': 'blue'
    };
    delete newBlueDeployment.metadata.resourceVersion;
    delete newBlueDeployment.metadata.uid;
    delete newBlueDeployment.metadata.creationTimestamp;
    delete newBlueDeployment.status;
    
    // Update pod template labels
    newBlueDeployment.spec.template.metadata.labels = {
      ...newBlueDeployment.spec.template.metadata.labels,
      'deployment-type': 'blue'
    };
    
    // Delete the old blue deployment
    await k8sAppsV1Api.deleteNamespacedDeployment(BLUE_DEPLOYMENT, NAMESPACE);
    log('info', 'Old blue deployment deleted');
    
    // Wait for deletion to complete
    let deleted = false;
    while (!deleted) {
      try {
        await k8sAppsV1Api.readNamespacedDeployment(BLUE_DEPLOYMENT, NAMESPACE);
        log('info', 'Waiting for old blue deployment to be deleted');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        deleted = true;
      }
    }
    
    // Create the new blue deployment
    await k8sAppsV1Api.createNamespacedDeployment(NAMESPACE, newBlueDeployment);
    log('info', 'New blue deployment created');
    
    // Delete the green deployment
    await k8sAppsV1Api.deleteNamespacedDeployment(GREEN_DEPLOYMENT, NAMESPACE);
    log('info', 'Green deployment deleted');
    
    return true;
  } catch (error) {
    log('error', 'Failed to clean up old deployment', { error: error.message });
    return false;
  }
}

/**
 * Send notification about deployment status
 */
async function sendNotification(success, details) {
  if (!SLACK_WEBHOOK_URL) {
    return;
  }
  
  try {
    const color = success ? 'good' : 'danger';
    const title = success ? 'Blue-Green Deployment Successful' : 'Blue-Green Deployment Failed';
    
    await axios.post(SLACK_WEBHOOK_URL, {
      text: title,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Deployment ID',
              value: DEPLOYMENT_ID,
              short: true
            },
            {
              title: 'Version',
              value: VERSION,
              short: true
            },
            {
              title: 'Status',
              value: success ? 'Success' : 'Failed',
              short: true
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: true
            },
            {
              title: 'Details',
              value: details || 'No details provided',
              short: false
            }
          ]
        }
      ]
    });
    
    log('info', 'Notification sent');
  } catch (error) {
    log('error', 'Failed to send notification', { error: error.message });
  }
}

/**
 * Main function
 */
async function main() {
  try {
    log('info', 'Starting blue-green deployment', { version: VERSION, image: IMAGE });
    
    // Check if image is provided
    if (!IMAGE) {
      log('error', 'No image provided');
      process.exit(1);
    }
    
    // Get the active deployment
    const activeDeployment = await getActiveDeployment();
    log('info', 'Active deployment', { deployment: activeDeployment });
    
    // Deploy green environment
    const greenDeployed = await deployGreen();
    if (!greenDeployed) {
      log('error', 'Failed to deploy green environment');
      await sendNotification(false, 'Failed to deploy green environment');
      process.exit(1);
    }
    
    // Run verification tests
    const testsPass = await runVerificationTests();
    if (!testsPass) {
      log('error', 'Verification tests failed');
      await sendNotification(false, 'Verification tests failed');
      process.exit(1);
    }
    
    // Switch traffic
    const trafficSwitched = await switchTraffic();
    if (!trafficSwitched) {
      log('error', 'Failed to switch traffic');
      await sendNotification(false, 'Failed to switch traffic');
      process.exit(1);
    }
    
    // Clean up old deployment
    const cleanedUp = await cleanupOldDeployment();
    if (!cleanedUp) {
      log('warning', 'Failed to clean up old deployment');
      // Don't exit here, as the deployment is already successful
    }
    
    log('info', 'Blue-green deployment completed successfully');
    await sendNotification(true, 'Deployment completed successfully');
    process.exit(0);
  } catch (error) {
    log('error', 'Blue-green deployment failed', { error: error.message });
    await sendNotification(false, error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

// Export functions for testing
module.exports = {
  getActiveDeployment,
  deployGreen,
  runVerificationTests,
  switchTraffic,
  cleanupOldDeployment
};
