/**
 * Deployment Monitoring and Alerting Script
 * 
 * This script monitors deployments and sends alerts when issues are detected.
 * It integrates with Prometheus, Grafana, and alerting systems like Slack and PagerDuty.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const NAMESPACE = process.env.NAMESPACE || 'chatbot-platform';
const DEPLOYMENT_NAME = process.env.DEPLOYMENT_NAME || 'chatbot-platform';
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';
const GRAFANA_URL = process.env.GRAFANA_URL || 'http://grafana:3000';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const PAGERDUTY_ROUTING_KEY = process.env.PAGERDUTY_ROUTING_KEY;
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID || Date.now().toString();
const LOGS_DIR = process.env.LOGS_DIR || path.join(__dirname, '../../logs/monitoring');
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || '60000', 10); // 1 minute
const ALERT_THRESHOLD = parseInt(process.env.ALERT_THRESHOLD || '3', 10); // 3 consecutive failures

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Logger
const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] ${message}`);
    fs.appendFileSync(
      path.join(LOGS_DIR, `monitoring-${DEPLOYMENT_ID}.log`),
      `[${timestamp}] [INFO] ${message}\n`
    );
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${message}`, error);
    fs.appendFileSync(
      path.join(LOGS_DIR, `monitoring-${DEPLOYMENT_ID}.log`),
      `[${timestamp}] [ERROR] ${message}\n${error ? error.stack || error.toString() : ''}\n`
    );
  }
};

/**
 * Get deployment status
 */
async function getDeploymentStatus() {
  try {
    const output = execSync(`kubectl get deployment ${DEPLOYMENT_NAME} -n ${NAMESPACE} -o json`);
    const deployment = JSON.parse(output);
    
    return {
      name: deployment.metadata.name,
      replicas: deployment.spec.replicas,
      availableReplicas: deployment.status.availableReplicas || 0,
      readyReplicas: deployment.status.readyReplicas || 0,
      updatedReplicas: deployment.status.updatedReplicas || 0,
      unavailableReplicas: deployment.status.unavailableReplicas || 0,
      conditions: deployment.status.conditions || [],
      healthy: (
        deployment.status.availableReplicas === deployment.spec.replicas &&
        deployment.status.readyReplicas === deployment.spec.replicas
      )
    };
  } catch (error) {
    logger.error('Failed to get deployment status', error);
    throw error;
  }
}

/**
 * Get pod metrics
 */
async function getPodMetrics() {
  try {
    const output = execSync(`kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME} -o json`);
    const pods = JSON.parse(output).items;
    
    const podNames = pods.map(pod => pod.metadata.name);
    const metrics = [];
    
    for (const podName of podNames) {
      try {
        const metricsOutput = execSync(`kubectl top pod ${podName} -n ${NAMESPACE} --containers`);
        const lines = metricsOutput.toString().split('\n').filter(Boolean);
        
        // Skip header line
        const podMetrics = lines.slice(1).map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            pod: parts[0],
            container: parts[1],
            cpu: parts[2],
            memory: parts[3]
          };
        });
        
        metrics.push(...podMetrics);
      } catch (error) {
        logger.error(`Failed to get metrics for pod ${podName}`, error);
      }
    }
    
    return metrics;
  } catch (error) {
    logger.error('Failed to get pod metrics', error);
    return [];
  }
}

/**
 * Get logs from pods
 */
async function getPodLogs() {
  try {
    const output = execSync(`kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME} -o json`);
    const pods = JSON.parse(output).items;
    
    const podNames = pods.map(pod => pod.metadata.name);
    const logs = {};
    
    for (const podName of podNames) {
      try {
        // Get the last 50 lines of logs
        const logOutput = execSync(`kubectl logs ${podName} -n ${NAMESPACE} --tail=50`);
        logs[podName] = logOutput.toString();
      } catch (error) {
        logger.error(`Failed to get logs for pod ${podName}`, error);
        logs[podName] = `Error: ${error.message}`;
      }
    }
    
    return logs;
  } catch (error) {
    logger.error('Failed to get pod logs', error);
    return {};
  }
}

/**
 * Check for error patterns in logs
 */
function checkLogsForErrors(logs) {
  const errorPatterns = [
    'Error:',
    'Exception:',
    'Fatal:',
    'Uncaught exception',
    'FATAL ERROR',
    'CRITICAL',
    'OutOfMemoryError',
    'StackOverflowError'
  ];
  
  const errors = {};
  
  Object.entries(logs).forEach(([podName, log]) => {
    const podErrors = [];
    
    errorPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'i');
      const lines = log.split('\n');
      
      lines.forEach(line => {
        if (regex.test(line)) {
          podErrors.push(line.trim());
        }
      });
    });
    
    if (podErrors.length > 0) {
      errors[podName] = podErrors;
    }
  });
  
  return errors;
}

/**
 * Query Prometheus for metrics
 */
async function queryPrometheus(query) {
  try {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
      params: { query }
    });
    
    if (response.data.status === 'success') {
      return response.data.data.result;
    }
    
    logger.error('Prometheus query failed', response.data);
    return [];
  } catch (error) {
    logger.error(`Failed to query Prometheus: ${query}`, error);
    return [];
  }
}

/**
 * Get application metrics from Prometheus
 */
async function getApplicationMetrics() {
  const metrics = {};
  
  // CPU usage
  metrics.cpu = await queryPrometheus(
    `sum(rate(container_cpu_usage_seconds_total{namespace="${NAMESPACE}",pod=~"${DEPLOYMENT_NAME}-.*"}[5m])) by (pod)`
  );
  
  // Memory usage
  metrics.memory = await queryPrometheus(
    `sum(container_memory_usage_bytes{namespace="${NAMESPACE}",pod=~"${DEPLOYMENT_NAME}-.*"}) by (pod)`
  );
  
  // Request rate
  metrics.requestRate = await queryPrometheus(
    `sum(rate(http_requests_total{namespace="${NAMESPACE}",service="${DEPLOYMENT_NAME}"}[5m])) by (method, path)`
  );
  
  // Error rate
  metrics.errorRate = await queryPrometheus(
    `sum(rate(http_requests_total{namespace="${NAMESPACE}",service="${DEPLOYMENT_NAME}",status=~"5.."}[5m])) / sum(rate(http_requests_total{namespace="${NAMESPACE}",service="${DEPLOYMENT_NAME}"}[5m]))`
  );
  
  // Response time
  metrics.responseTime = await queryPrometheus(
    `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{namespace="${NAMESPACE}",service="${DEPLOYMENT_NAME}"}[5m])) by (le))`
  );
  
  return metrics;
}

/**
 * Check if metrics exceed thresholds
 */
function checkMetricsThresholds(metrics) {
  const alerts = [];
  
  // Check CPU usage
  metrics.cpu.forEach(item => {
    const value = parseFloat(item.value[1]);
    if (value > 0.8) { // 80% CPU usage
      alerts.push({
        type: 'cpu',
        message: `High CPU usage (${(value * 100).toFixed(2)}%) for pod ${item.metric.pod}`,
        severity: value > 0.9 ? 'critical' : 'warning'
      });
    }
  });
  
  // Check memory usage
  metrics.memory.forEach(item => {
    const valueBytes = parseFloat(item.value[1]);
    const valueMB = valueBytes / (1024 * 1024);
    if (valueMB > 1024) { // 1GB memory usage
      alerts.push({
        type: 'memory',
        message: `High memory usage (${valueMB.toFixed(2)} MB) for pod ${item.metric.pod}`,
        severity: valueMB > 1536 ? 'critical' : 'warning' // 1.5GB threshold for critical
      });
    }
  });
  
  // Check error rate
  metrics.errorRate.forEach(item => {
    const value = parseFloat(item.value[1]);
    if (value > 0.05) { // 5% error rate
      alerts.push({
        type: 'error_rate',
        message: `High error rate (${(value * 100).toFixed(2)}%)`,
        severity: value > 0.1 ? 'critical' : 'warning' // 10% threshold for critical
      });
    }
  });
  
  // Check response time
  metrics.responseTime.forEach(item => {
    const value = parseFloat(item.value[1]);
    if (value > 0.5) { // 500ms response time
      alerts.push({
        type: 'response_time',
        message: `Slow response time (${(value * 1000).toFixed(2)} ms)`,
        severity: value > 1.0 ? 'critical' : 'warning' // 1s threshold for critical
      });
    }
  });
  
  return alerts;
}

/**
 * Send alerts
 */
async function sendAlerts(alerts, context) {
  if (alerts.length === 0) {
    return;
  }
  
  logger.info(`Sending ${alerts.length} alerts`);
  
  // Group alerts by severity
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');
  
  // Send Slack notification
  if (SLACK_WEBHOOK_URL) {
    try {
      await axios.post(SLACK_WEBHOOK_URL, {
        text: `${criticalAlerts.length > 0 ? '🚨' : '⚠️'} Deployment Monitoring Alert`,
        attachments: [
          {
            color: criticalAlerts.length > 0 ? 'danger' : 'warning',
            fields: [
              {
                title: 'Deployment',
                value: DEPLOYMENT_NAME,
                short: true
              },
              {
                title: 'Namespace',
                value: NAMESPACE,
                short: true
              },
              {
                title: 'Timestamp',
                value: new Date().toISOString(),
                short: true
              },
              {
                title: 'Alerts',
                value: alerts.map(alert => `${alert.severity === 'critical' ? '🚨' : '⚠️'} ${alert.message}`).join('\n'),
                short: false
              }
            ],
            actions: [
              {
                type: 'button',
                text: 'View in Grafana',
                url: `${GRAFANA_URL}/d/deployment-dashboard/deployment-dashboard?var-namespace=${NAMESPACE}&var-deployment=${DEPLOYMENT_NAME}`
              }
            ]
          }
        ]
      });
      
      logger.info('Slack notification sent');
    } catch (error) {
      logger.error('Failed to send Slack notification', error);
    }
  }
  
  // Send PagerDuty alert for critical alerts
  if (PAGERDUTY_ROUTING_KEY && criticalAlerts.length > 0) {
    try {
      await axios.post('https://events.pagerduty.com/v2/enqueue', {
        routing_key: PAGERDUTY_ROUTING_KEY,
        event_action: 'trigger',
        payload: {
          summary: `${criticalAlerts.length} critical alerts for ${DEPLOYMENT_NAME} in ${NAMESPACE}`,
          source: 'Deployment Monitoring',
          severity: 'critical',
          timestamp: new Date().toISOString(),
          custom_details: {
            alerts: criticalAlerts.map(alert => alert.message).join('\n'),
            deployment: DEPLOYMENT_NAME,
            namespace: NAMESPACE,
            context
          }
        }
      });
      
      logger.info('PagerDuty alert sent');
    } catch (error) {
      logger.error('Failed to send PagerDuty alert', error);
    }
  }
}

/**
 * Main monitoring function
 */
async function monitor() {
  try {
    logger.info('Starting monitoring check...');
    
    // Get deployment status
    const status = await getDeploymentStatus();
    logger.info(`Deployment status: ${JSON.stringify(status)}`);
    
    // Get pod metrics
    const podMetrics = await getPodMetrics();
    logger.info(`Pod metrics: ${JSON.stringify(podMetrics)}`);
    
    // Get pod logs
    const logs = await getPodLogs();
    
    // Check logs for errors
    const logErrors = checkLogsForErrors(logs);
    if (Object.keys(logErrors).length > 0) {
      logger.info(`Found errors in logs: ${JSON.stringify(logErrors)}`);
    }
    
    // Get application metrics from Prometheus
    const appMetrics = await getApplicationMetrics();
    
    // Check if metrics exceed thresholds
    const metricAlerts = checkMetricsThresholds(appMetrics);
    if (metricAlerts.length > 0) {
      logger.info(`Metric alerts: ${JSON.stringify(metricAlerts)}`);
    }
    
    // Prepare alerts
    const alerts = [];
    
    // Add deployment status alerts
    if (!status.healthy) {
      alerts.push({
        type: 'deployment_status',
        message: `Deployment is not healthy: ${status.availableReplicas}/${status.replicas} replicas available`,
        severity: 'critical'
      });
    }
    
    // Add log error alerts
    Object.entries(logErrors).forEach(([podName, errors]) => {
      alerts.push({
        type: 'log_errors',
        message: `Found ${errors.length} errors in logs for pod ${podName}`,
        severity: 'warning',
        details: errors
      });
    });
    
    // Add metric alerts
    alerts.push(...metricAlerts);
    
    // Send alerts if any
    if (alerts.length > 0) {
      await sendAlerts(alerts, {
        status,
        podMetrics,
        logErrors
      });
    } else {
      logger.info('No alerts to send');
    }
    
    logger.info('Monitoring check completed');
    return alerts.length === 0;
  } catch (error) {
    logger.error('Monitoring check failed', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  logger.info(`Starting deployment monitoring for ${DEPLOYMENT_NAME} in ${NAMESPACE}`);
  
  let consecutiveFailures = 0;
  
  // Run initial check
  const initialSuccess = await monitor();
  if (!initialSuccess) {
    consecutiveFailures++;
  }
  
  // Set up interval for continuous monitoring
  const interval = setInterval(async () => {
    const success = await monitor();
    
    if (success) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      
      if (consecutiveFailures >= ALERT_THRESHOLD) {
        logger.error(`${consecutiveFailures} consecutive monitoring failures detected`);
        
        // Send critical alert
        await sendAlerts([{
          type: 'consecutive_failures',
          message: `${consecutiveFailures} consecutive monitoring failures detected`,
          severity: 'critical'
        }], { consecutiveFailures });
      }
    }
  }, CHECK_INTERVAL);
  
  // Handle process termination
  process.on('SIGINT', () => {
    clearInterval(interval);
    logger.info('Monitoring stopped');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    clearInterval(interval);
    logger.info('Monitoring stopped');
    process.exit(0);
  });
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    logger.error('Monitoring script failed', error);
    process.exit(1);
  });
}

// Export functions for testing
module.exports = {
  getDeploymentStatus,
  getPodMetrics,
  getPodLogs,
  checkLogsForErrors,
  queryPrometheus,
  getApplicationMetrics,
  checkMetricsThresholds,
  sendAlerts,
  monitor
};
