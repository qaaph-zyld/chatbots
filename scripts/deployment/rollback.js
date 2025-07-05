/**
 * Automated Rollback Script
 * 
 * This script handles automated rollbacks when deployment verification fails.
 * It restores the previous stable deployment and updates traffic routing.
 */

const k8s = require('@kubernetes/client-node');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const NAMESPACE = process.env.NAMESPACE || 'chatbot-platform';
const DEPLOYMENT_NAME = process.env.DEPLOYMENT_NAME || 'chatbot-platform';
const SERVICE_NAME = process.env.SERVICE_NAME || 'chatbot-platform';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const PAGERDUTY_ROUTING_KEY = process.env.PAGERDUTY_ROUTING_KEY;
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID || Date.now().toString();
const LOGS_DIR = process.env.LOGS_DIR || path.join(__dirname, '../../logs/rollbacks');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Initialize Kubernetes client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sAppsV1Api = kc.makeApiClient(k8s.AppsV1Api);
const k8sCoreV1Api = kc.makeApiClient(k8s.CoreV1Api);

// Logger
const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`);
    fs.appendFileSync(
      path.join(LOGS_DIR, `rollback-${DEPLOYMENT_ID}.log`),
      `[${timestamp}] [INFO] ${message}\n`
    );
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error);
    fs.appendFileSync(
      path.join(LOGS_DIR, `rollback-${DEPLOYMENT_ID}.log`),
      `[${timestamp}] [ERROR] ${message}\n${error ? error.stack || error.toString() : ''}\n`
    );
  }
};

/**
 * Get the current and previous deployment revisions
 */
async function getDeploymentRevisions() {
  try {
    // Get the deployment
    const deployment = await k8sAppsV1Api.readNamespacedDeployment(
      DEPLOYMENT_NAME,
      NAMESPACE
    );

    // Get the replica sets for the deployment
    const labelSelector = Object.entries(deployment.body.spec.selector.matchLabels)
      .map(([key, value]) => `${key}=${value}`)
      .join(',');

    const replicaSets = await k8sAppsV1Api.listNamespacedReplicaSet(
      NAMESPACE,
      undefined,
      undefined,
      undefined,
      undefined,
      labelSelector
    );

    // Sort replica sets by creation timestamp (newest first)
    const sortedReplicaSets = replicaSets.body.items.sort((a, b) => {
      const aTime = new Date(a.metadata.creationTimestamp).getTime();
      const bTime = new Date(b.metadata.creationTimestamp).getTime();
      return bTime - aTime;
    });

    // Get the current and previous replica sets
    const currentRS = sortedReplicaSets[0];
    const previousRS = sortedReplicaSets[1];

    if (!previousRS) {
      throw new Error('No previous deployment found to roll back to');
    }

    return {
      current: {
        name: currentRS.metadata.name,
        revision: currentRS.metadata.annotations['deployment.kubernetes.io/revision'],
        image: currentRS.spec.template.spec.containers[0].image
      },
      previous: {
        name: previousRS.metadata.name,
        revision: previousRS.metadata.annotations['deployment.kubernetes.io/revision'],
        image: previousRS.spec.template.spec.containers[0].image
      }
    };
  } catch (error) {
    logger.error('Failed to get deployment revisions', error);
    throw error;
  }
}

/**
 * Roll back to the previous deployment
 */
async function rollback() {
  try {
    logger.info('Starting rollback process...');

    // Get the current and previous deployment revisions
    const revisions = await getDeploymentRevisions();
    logger.info(`Current deployment: ${JSON.stringify(revisions.current)}`);
    logger.info(`Previous deployment: ${JSON.stringify(revisions.previous)}`);

    // Roll back to the previous revision
    logger.info(`Rolling back to revision ${revisions.previous.revision}...`);
    
    // Use kubectl rollout undo command for reliability
    execSync(`kubectl rollout undo deployment/${DEPLOYMENT_NAME} --to-revision=${revisions.previous.revision} -n ${NAMESPACE}`);
    
    // Wait for rollback to complete
    logger.info('Waiting for rollback to complete...');
    execSync(`kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}`);
    
    logger.info('Rollback completed successfully');
    
    // Verify the rollback
    const deployment = await k8sAppsV1Api.readNamespacedDeployment(
      DEPLOYMENT_NAME,
      NAMESPACE
    );
    
    const currentImage = deployment.body.spec.template.spec.containers[0].image;
    logger.info(`Current image after rollback: ${currentImage}`);
    
    if (currentImage !== revisions.previous.image) {
      logger.error(`Rollback verification failed. Expected image ${revisions.previous.image} but got ${currentImage}`);
      throw new Error('Rollback verification failed');
    }
    
    logger.info('Rollback verified successfully');
    
    // Send notifications
    await sendNotifications({
      title: 'Deployment Rollback Completed',
      message: `Rolled back from revision ${revisions.current.revision} to ${revisions.previous.revision}`,
      status: 'success',
      details: {
        namespace: NAMESPACE,
        deployment: DEPLOYMENT_NAME,
        previousRevision: revisions.current.revision,
        currentRevision: revisions.previous.revision,
        currentImage: currentImage
      }
    });
    
    return {
      success: true,
      message: 'Rollback completed successfully',
      previousRevision: revisions.current.revision,
      currentRevision: revisions.previous.revision
    };
  } catch (error) {
    logger.error('Rollback failed', error);
    
    // Send failure notification
    await sendNotifications({
      title: 'Deployment Rollback Failed',
      message: `Failed to roll back deployment: ${error.message}`,
      status: 'failure',
      details: {
        namespace: NAMESPACE,
        deployment: DEPLOYMENT_NAME,
        error: error.message
      }
    });
    
    throw error;
  }
}

/**
 * Send notifications about the rollback
 */
async function sendNotifications(data) {
  try {
    // Send Slack notification
    if (SLACK_WEBHOOK_URL) {
      await axios.post(SLACK_WEBHOOK_URL, {
        text: `${data.title}: ${data.message}`,
        attachments: [
          {
            color: data.status === 'success' ? 'good' : 'danger',
            fields: [
              {
                title: 'Namespace',
                value: data.details.namespace,
                short: true
              },
              {
                title: 'Deployment',
                value: data.details.deployment,
                short: true
              },
              {
                title: 'Status',
                value: data.status === 'success' ? 'Success' : 'Failed',
                short: true
              },
              {
                title: 'Timestamp',
                value: new Date().toISOString(),
                short: true
              },
              ...(data.status === 'success' ? [
                {
                  title: 'Previous Revision',
                  value: data.details.previousRevision,
                  short: true
                },
                {
                  title: 'Current Revision',
                  value: data.details.currentRevision,
                  short: true
                },
                {
                  title: 'Current Image',
                  value: data.details.currentImage,
                  short: false
                }
              ] : [
                {
                  title: 'Error',
                  value: data.details.error,
                  short: false
                }
              ])
            ]
          }
        ]
      });
      logger.info('Slack notification sent');
    }
    
    // Send PagerDuty alert for failures
    if (PAGERDUTY_ROUTING_KEY && data.status === 'failure') {
      await axios.post('https://events.pagerduty.com/v2/enqueue', {
        routing_key: PAGERDUTY_ROUTING_KEY,
        event_action: 'trigger',
        payload: {
          summary: `${data.title}: ${data.message}`,
          source: 'Rollback Script',
          severity: 'error',
          timestamp: new Date().toISOString(),
          custom_details: data.details
        }
      });
      logger.info('PagerDuty alert sent');
    }
  } catch (error) {
    logger.error('Failed to send notifications', error);
    // Don't throw error here, as this is not critical to the rollback process
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Get the reason for rollback from command line arguments
    const reason = process.argv[2] || 'Deployment verification failed';
    logger.info(`Initiating rollback. Reason: ${reason}`);
    
    // Perform the rollback
    const result = await rollback();
    
    logger.info(`Rollback result: ${JSON.stringify(result)}`);
    process.exit(0);
  } catch (error) {
    logger.error('Rollback process failed', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

// Export functions for testing
module.exports = {
  getDeploymentRevisions,
  rollback,
  sendNotifications
};
