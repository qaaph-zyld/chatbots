#!/usr/bin/env node

/**
 * Deployment Metrics Collection Script
 * 
 * This script collects metrics during and after deployments to track
 * deployment health, performance, and success rates.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Configuration
const config = {
  metricsDir: path.join(__dirname, '../metrics/deployments'),
  prometheusUrl: process.env.PROMETHEUS_URL || 'http://prometheus:9090',
  applicationUrl: process.env.APPLICATION_URL || 'https://chatbot-platform.example.com',
  deploymentColor: process.env.DEPLOYMENT_COLOR || 'unknown',
  deploymentId: process.env.DEPLOYMENT_ID || Date.now().toString(),
  metricsInterval: 60000, // 1 minute
  totalDuration: 3600000 // 1 hour
};

// Ensure metrics directory exists
if (!fs.existsSync(config.metricsDir)) {
  fs.mkdirSync(config.metricsDir, { recursive: true });
}

// Metrics to collect
const metrics = {
  // System metrics
  'cpu_usage': 'sum(rate(container_cpu_usage_seconds_total{pod=~"chatbot-platform-.*"}[5m]))',
  'memory_usage': 'sum(container_memory_usage_bytes{pod=~"chatbot-platform-.*"})',
  'network_receive': 'sum(rate(container_network_receive_bytes_total{pod=~"chatbot-platform-.*"}[5m]))',
  'network_transmit': 'sum(rate(container_network_transmit_bytes_total{pod=~"chatbot-platform-.*"}[5m]))',
  
  // Application metrics
  'http_requests': 'sum(rate(http_requests_total{job=~"chatbot-platform.*"}[5m]))',
  'http_errors': 'sum(rate(http_requests_total{job=~"chatbot-platform.*", status=~"5.."}[5m]))',
  'http_latency_p50': 'histogram_quantile(0.5, sum(rate(http_request_duration_seconds_bucket{job=~"chatbot-platform.*"}[5m])) by (le))',
  'http_latency_p90': 'histogram_quantile(0.9, sum(rate(http_request_duration_seconds_bucket{job=~"chatbot-platform.*"}[5m])) by (le))',
  'http_latency_p99': 'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job=~"chatbot-platform.*"}[5m])) by (le))',
  
  // Database metrics
  'db_connections': 'mongodb_connections{state="current"}',
  'db_operations': 'sum(rate(mongodb_op_counters_total[5m]))',
  
  // Business metrics
  'active_users': 'sum(chatbot_platform_active_users)',
  'conversations': 'sum(rate(chatbot_platform_conversations_total[5m]))',
  'messages': 'sum(rate(chatbot_platform_messages_total[5m]))'
};

// Application health checks
const healthChecks = [
  { name: 'api_health', url: `${config.applicationUrl}/health` },
  { name: 'api_ready', url: `${config.applicationUrl}/health/ready` },
  { name: 'api_database', url: `${config.applicationUrl}/health/database` }
];

/**
 * Query Prometheus for a specific metric
 */
async function queryPrometheus(query) {
  try {
    const response = await axios.get(`${config.prometheusUrl}/api/v1/query`, {
      params: { query }
    });
    
    if (response.data.status === 'success' && response.data.data.result.length > 0) {
      return response.data.data.result[0].value[1];
    }
    
    return null;
  } catch (error) {
    console.error(`Error querying Prometheus: ${error.message}`);
    return null;
  }
}

/**
 * Perform health checks
 */
async function performHealthChecks() {
  const results = {};
  
  for (const check of healthChecks) {
    try {
      const startTime = Date.now();
      const response = await axios.get(check.url, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      results[check.name] = {
        status: response.status,
        responseTime,
        success: response.status >= 200 && response.status < 300
      };
    } catch (error) {
      results[check.name] = {
        status: error.response?.status || 0,
        responseTime: 0,
        success: false,
        error: error.message
      };
    }
  }
  
  return results;
}

/**
 * Get Kubernetes deployment status
 */
async function getDeploymentStatus() {
  try {
    const { stdout } = await exec(
      `kubectl get deployment chatbot-platform-${config.deploymentColor} -n chatbot-platform-prod -o json`
    );
    
    const deployment = JSON.parse(stdout);
    
    return {
      availableReplicas: deployment.status.availableReplicas || 0,
      readyReplicas: deployment.status.readyReplicas || 0,
      replicas: deployment.status.replicas || 0,
      updatedReplicas: deployment.status.updatedReplicas || 0,
      conditions: deployment.status.conditions || []
    };
  } catch (error) {
    console.error(`Error getting deployment status: ${error.message}`);
    return {
      error: error.message
    };
  }
}

/**
 * Collect and save metrics
 */
async function collectMetrics() {
  const timestamp = new Date().toISOString();
  const metricsData = {
    timestamp,
    deploymentId: config.deploymentId,
    deploymentColor: config.deploymentColor,
    metrics: {},
    healthChecks: {},
    deploymentStatus: {}
  };
  
  // Collect Prometheus metrics
  for (const [name, query] of Object.entries(metrics)) {
    metricsData.metrics[name] = await queryPrometheus(query);
  }
  
  // Perform health checks
  metricsData.healthChecks = await performHealthChecks();
  
  // Get deployment status
  metricsData.deploymentStatus = await getDeploymentStatus();
  
  // Save metrics to file
  const metricsFile = path.join(
    config.metricsDir,
    `${config.deploymentId}-${timestamp.replace(/:/g, '-')}.json`
  );
  
  fs.writeFileSync(metricsFile, JSON.stringify(metricsData, null, 2));
  
  console.log(`Metrics collected and saved to ${metricsFile}`);
  
  // Calculate error rate
  const requests = parseFloat(metricsData.metrics.http_requests) || 0;
  const errors = parseFloat(metricsData.metrics.http_errors) || 0;
  const errorRate = requests > 0 ? (errors / requests) * 100 : 0;
  
  // Log key metrics
  console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
  console.log(`P90 Latency: ${parseFloat(metricsData.metrics.http_latency_p90).toFixed(2)}s`);
  console.log(`CPU Usage: ${parseFloat(metricsData.metrics.cpu_usage).toFixed(2)} cores`);
  console.log(`Memory Usage: ${(parseFloat(metricsData.metrics.memory_usage) / (1024 * 1024)).toFixed(2)} MB`);
  
  // Return metrics for potential alerting
  return {
    errorRate,
    latencyP90: parseFloat(metricsData.metrics.http_latency_p90),
    healthCheckSuccess: Object.values(metricsData.healthChecks).every(check => check.success)
  };
}

/**
 * Main function
 */
async function main() {
  console.log(`Starting deployment metrics collection for ${config.deploymentColor} deployment (${config.deploymentId})`);
  
  let iterations = Math.floor(config.totalDuration / config.metricsInterval);
  let consecutiveFailures = 0;
  
  for (let i = 0; i < iterations; i++) {
    console.log(`Collecting metrics (${i + 1}/${iterations})...`);
    
    try {
      const metrics = await collectMetrics();
      
      // Check for critical issues
      if (metrics.errorRate > 5 || !metrics.healthCheckSuccess) {
        consecutiveFailures++;
        console.warn(`Warning: Detected issues with deployment (${consecutiveFailures} consecutive failures)`);
        
        // Alert after 3 consecutive failures
        if (consecutiveFailures >= 3) {
          console.error('Critical: Deployment appears to be unhealthy. Consider rolling back.');
          // In a real environment, this could trigger an alert or automatic rollback
        }
      } else {
        consecutiveFailures = 0;
      }
    } catch (error) {
      console.error(`Error collecting metrics: ${error.message}`);
    }
    
    // Wait for next interval
    if (i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, config.metricsInterval));
    }
  }
  
  console.log('Deployment metrics collection completed');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  collectMetrics,
  performHealthChecks,
  getDeploymentStatus
};
