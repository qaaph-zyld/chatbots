/**
 * Deployment Verification Script
 * 
 * This script performs comprehensive verification of deployments to ensure
 * that all components are functioning correctly after deployment.
 */

const axios = require('axios');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../src/utils/logger');
const performanceOptimizer = require('../src/utils/performance-optimizer');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Initialize AWS services
const cloudwatch = new AWS.CloudWatch();
const elbv2 = new AWS.ELBv2();
const ssm = new AWS.SSM();

// Configuration
const config = {
  environment: process.env.ENVIRONMENT || 'staging',
  apiBaseUrl: process.env.API_BASE_URL || (process.env.ENVIRONMENT === 'production' 
    ? 'https://api.chatbot-platform.com' 
    : 'https://api-staging.chatbot-platform.com'),
  targetGroup: process.env.TARGET_GROUP_ARN,
  reportPath: path.join(__dirname, '../reports/verification'),
  verificationTimeout: parseInt(process.env.VERIFICATION_TIMEOUT || '300000'),
  apiKey: process.env.API_KEY
};

/**
 * Main verification function
 */
async function verifyDeployment() {
  try {
    logger.info(`Starting deployment verification for ${config.environment} environment`);
    
    const startTime = Date.now();
    
    // Create verification report directory if it doesn't exist
    if (!fs.existsSync(config.reportPath)) {
      fs.mkdirSync(config.reportPath, { recursive: true });
    }
    
    // Initialize verification report
    const report = {
      environment: config.environment,
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      summary: {},
      details: {}
    };
    
    // Run infrastructure checks
    report.details.infrastructure = await verifyInfrastructure();
    
    // Run API health checks
    report.details.apiHealth = await verifyApiHealth();
    
    // Run functional tests
    report.details.functionalTests = await runFunctionalTests();
    
    // Run performance tests
    report.details.performanceTests = await runPerformanceTests();
    
    // Run security checks
    report.details.securityChecks = await runSecurityChecks();
    
    // Generate summary
    report.summary = generateSummary(report.details);
    
    // Set overall status
    report.status = report.summary.overallStatus;
    
    // Calculate verification duration
    report.duration = Date.now() - startTime;
    
    // Save verification report
    const reportFilePath = path.join(
      config.reportPath, 
      `verification-${config.environment}-${new Date().toISOString().replace(/:/g, '-')}.json`
    );
    
    fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2));
    
    logger.info(`Deployment verification ${report.status === 'success' ? 'succeeded' : 'failed'}`);
    logger.info(`Verification report saved to: ${reportFilePath}`);
    
    if (report.status !== 'success') {
      throw new Error(`Deployment verification failed: ${JSON.stringify(report.summary)}`);
    }
    
    return report;
  } catch (error) {
    logger.error('Deployment verification failed', error);
    throw error;
  }
}

/**
 * Verify infrastructure
 */
async function verifyInfrastructure() {
  logger.info('Verifying infrastructure');
  
  const results = {
    targetGroupHealth: await verifyTargetGroupHealth(),
    instanceHealth: await verifyInstanceHealth(),
    cloudwatchAlarms: await verifyCloudWatchAlarms(),
    status: 'pending'
  };
  
  // Determine overall infrastructure status
  if (
    results.targetGroupHealth.status === 'success' &&
    results.instanceHealth.status === 'success' &&
    results.cloudwatchAlarms.status === 'success'
  ) {
    results.status = 'success';
  } else {
    results.status = 'failure';
  }
  
  logger.info(`Infrastructure verification ${results.status}`);
  
  return results;
}

/**
 * Verify target group health
 */
async function verifyTargetGroupHealth() {
  logger.info(`Verifying target group health: ${config.targetGroup}`);
  
  try {
    if (!config.targetGroup) {
      return {
        status: 'skipped',
        message: 'No target group specified'
      };
    }
    
    const result = await elbv2.describeTargetHealth({
      TargetGroupArn: config.targetGroup
    }).promise();
    
    const unhealthyTargets = result.TargetHealthDescriptions.filter(
      target => target.TargetHealth.State !== 'healthy'
    );
    
    if (unhealthyTargets.length === 0) {
      return {
        status: 'success',
        message: `All ${result.TargetHealthDescriptions.length} targets are healthy`,
        details: {
          totalTargets: result.TargetHealthDescriptions.length,
          healthyTargets: result.TargetHealthDescriptions.length,
          unhealthyTargets: 0
        }
      };
    } else {
      return {
        status: 'failure',
        message: `${unhealthyTargets.length} of ${result.TargetHealthDescriptions.length} targets are unhealthy`,
        details: {
          totalTargets: result.TargetHealthDescriptions.length,
          healthyTargets: result.TargetHealthDescriptions.length - unhealthyTargets.length,
          unhealthyTargets: unhealthyTargets.length,
          unhealthyDetails: unhealthyTargets
        }
      };
    }
  } catch (error) {
    logger.error('Error verifying target group health', error);
    
    return {
      status: 'failure',
      message: `Error verifying target group health: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Verify instance health
 */
async function verifyInstanceHealth() {
  logger.info('Verifying instance health');
  
  try {
    // Get instances with the application tag
    const ec2 = new AWS.EC2();
    
    const params = {
      Filters: [
        {
          Name: 'tag:Environment',
          Values: [config.environment]
        },
        {
          Name: 'tag:Application',
          Values: ['chatbot-platform']
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
    
    if (instances.length === 0) {
      return {
        status: 'failure',
        message: 'No instances found with the application tag'
      };
    }
    
    // Check status of each instance
    const instanceStatuses = [];
    
    for (const instance of instances) {
      const statusResult = await ec2.describeInstanceStatus({
        InstanceIds: [instance.id]
      }).promise();
      
      if (statusResult.InstanceStatuses.length === 0) {
        instanceStatuses.push({
          id: instance.id,
          status: 'unknown',
          message: 'Instance status not available'
        });
        continue;
      }
      
      const status = statusResult.InstanceStatuses[0];
      
      if (status.InstanceStatus.Status === 'ok' && status.SystemStatus.Status === 'ok') {
        instanceStatuses.push({
          id: instance.id,
          status: 'healthy',
          details: status
        });
      } else {
        instanceStatuses.push({
          id: instance.id,
          status: 'unhealthy',
          details: status
        });
      }
    }
    
    const unhealthyInstances = instanceStatuses.filter(
      instance => instance.status !== 'healthy'
    );
    
    if (unhealthyInstances.length === 0) {
      return {
        status: 'success',
        message: `All ${instanceStatuses.length} instances are healthy`,
        details: {
          totalInstances: instanceStatuses.length,
          healthyInstances: instanceStatuses.length,
          unhealthyInstances: 0,
          instances: instanceStatuses
        }
      };
    } else {
      return {
        status: 'failure',
        message: `${unhealthyInstances.length} of ${instanceStatuses.length} instances are unhealthy`,
        details: {
          totalInstances: instanceStatuses.length,
          healthyInstances: instanceStatuses.length - unhealthyInstances.length,
          unhealthyInstances: unhealthyInstances.length,
          instances: instanceStatuses
        }
      };
    }
  } catch (error) {
    logger.error('Error verifying instance health', error);
    
    return {
      status: 'failure',
      message: `Error verifying instance health: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Verify CloudWatch alarms
 */
async function verifyCloudWatchAlarms() {
  logger.info('Verifying CloudWatch alarms');
  
  try {
    const params = {
      AlarmNamePrefix: `chatbot-platform-${config.environment}`,
      StateValue: 'ALARM'
    };
    
    const result = await cloudwatch.describeAlarms(params).promise();
    
    if (result.MetricAlarms.length === 0) {
      return {
        status: 'success',
        message: 'No active alarms found',
        details: {
          totalAlarms: 0,
          activeAlarms: 0
        }
      };
    } else {
      return {
        status: 'failure',
        message: `${result.MetricAlarms.length} active alarms found`,
        details: {
          totalAlarms: result.MetricAlarms.length,
          activeAlarms: result.MetricAlarms.length,
          alarms: result.MetricAlarms.map(alarm => ({
            name: alarm.AlarmName,
            description: alarm.AlarmDescription,
            metric: alarm.MetricName,
            namespace: alarm.Namespace,
            statistic: alarm.Statistic,
            threshold: alarm.Threshold
          }))
        }
      };
    }
  } catch (error) {
    logger.error('Error verifying CloudWatch alarms', error);
    
    return {
      status: 'failure',
      message: `Error verifying CloudWatch alarms: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Verify API health
 */
async function verifyApiHealth() {
  logger.info(`Verifying API health at ${config.apiBaseUrl}`);
  
  const results = {
    healthEndpoint: await verifyHealthEndpoint(),
    authEndpoint: await verifyAuthEndpoint(),
    coreEndpoints: await verifyCoreEndpoints(),
    status: 'pending'
  };
  
  // Determine overall API health status
  if (
    results.healthEndpoint.status === 'success' &&
    results.authEndpoint.status === 'success' &&
    results.coreEndpoints.status === 'success'
  ) {
    results.status = 'success';
  } else {
    results.status = 'failure';
  }
  
  logger.info(`API health verification ${results.status}`);
  
  return results;
}

/**
 * Verify health endpoint
 */
async function verifyHealthEndpoint() {
  logger.info(`Verifying health endpoint at ${config.apiBaseUrl}/health`);
  
  try {
    const response = await axios.get(`${config.apiBaseUrl}/health`);
    
    if (response.status === 200 && response.data.status === 'ok') {
      return {
        status: 'success',
        message: 'Health endpoint returned OK status',
        details: response.data
      };
    } else {
      return {
        status: 'failure',
        message: `Health endpoint returned non-OK status: ${response.data.status}`,
        details: response.data
      };
    }
  } catch (error) {
    logger.error('Error verifying health endpoint', error);
    
    return {
      status: 'failure',
      message: `Error verifying health endpoint: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Verify auth endpoint
 */
async function verifyAuthEndpoint() {
  logger.info(`Verifying auth endpoint at ${config.apiBaseUrl}/auth/status`);
  
  try {
    // This would typically use a test account
    // For now, we'll just check if the endpoint is accessible
    const response = await axios.get(`${config.apiBaseUrl}/auth/status`);
    
    if (response.status === 200) {
      return {
        status: 'success',
        message: 'Auth endpoint is accessible',
        details: {
          statusCode: response.status
        }
      };
    } else {
      return {
        status: 'failure',
        message: `Auth endpoint returned unexpected status: ${response.status}`,
        details: {
          statusCode: response.status
        }
      };
    }
  } catch (error) {
    // If we get a 401 Unauthorized, that's actually expected for this endpoint
    if (error.response && error.response.status === 401) {
      return {
        status: 'success',
        message: 'Auth endpoint returned expected 401 status for unauthenticated request',
        details: {
          statusCode: 401
        }
      };
    }
    
    logger.error('Error verifying auth endpoint', error);
    
    return {
      status: 'failure',
      message: `Error verifying auth endpoint: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Verify core endpoints
 */
async function verifyCoreEndpoints() {
  logger.info('Verifying core API endpoints');
  
  try {
    // First, get an auth token
    let authToken;
    
    try {
      // This would typically use a test account
      // For now, we'll use an API key if available
      if (config.apiKey) {
        authToken = config.apiKey;
      } else {
        // For testing purposes, we'll skip this check if no API key is available
        return {
          status: 'skipped',
          message: 'No API key available for core endpoint verification'
        };
      }
    } catch (error) {
      return {
        status: 'failure',
        message: `Failed to authenticate: ${error.message}`,
        error: error.message
      };
    }
    
    // Define endpoints to check
    const endpoints = [
      { method: 'GET', url: '/api/chatbots', name: 'List Chatbots' },
      { method: 'GET', url: '/api/knowledge-bases', name: 'List Knowledge Bases' },
      { method: 'GET', url: '/api/integrations', name: 'List Integrations' },
      { method: 'GET', url: '/api/plugins', name: 'List Plugins' }
    ];
    
    // Check each endpoint
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: `${config.apiBaseUrl}${endpoint.url}`,
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        });
        
        if (response.status >= 200 && response.status < 300) {
          results.push({
            endpoint: endpoint.name,
            status: 'success',
            statusCode: response.status
          });
        } else {
          results.push({
            endpoint: endpoint.name,
            status: 'failure',
            statusCode: response.status,
            message: `Unexpected status code: ${response.status}`
          });
        }
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          status: 'failure',
          message: error.message,
          statusCode: error.response ? error.response.status : null
        });
      }
    }
    
    const failedEndpoints = results.filter(result => result.status === 'failure');
    
    if (failedEndpoints.length === 0) {
      return {
        status: 'success',
        message: `All ${endpoints.length} core endpoints are accessible`,
        details: {
          totalEndpoints: endpoints.length,
          successfulEndpoints: endpoints.length,
          failedEndpoints: 0,
          results
        }
      };
    } else {
      return {
        status: 'failure',
        message: `${failedEndpoints.length} of ${endpoints.length} core endpoints failed`,
        details: {
          totalEndpoints: endpoints.length,
          successfulEndpoints: endpoints.length - failedEndpoints.length,
          failedEndpoints: failedEndpoints.length,
          results
        }
      };
    }
  } catch (error) {
    logger.error('Error verifying core endpoints', error);
    
    return {
      status: 'failure',
      message: `Error verifying core endpoints: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Run functional tests
 */
async function runFunctionalTests() {
  logger.info('Running functional tests');
  
  try {
    // Run Playwright tests for key functionality
    const testCommand = `npx playwright test --config=playwright.${config.environment}.config.js --grep="@smoke"`;
    
    try {
      execSync(testCommand, { stdio: 'pipe' });
      
      return {
        status: 'success',
        message: 'All functional tests passed',
        details: {
          command: testCommand
        }
      };
    } catch (error) {
      return {
        status: 'failure',
        message: 'Some functional tests failed',
        details: {
          command: testCommand,
          error: error.message,
          stdout: error.stdout ? error.stdout.toString() : null,
          stderr: error.stderr ? error.stderr.toString() : null
        }
      };
    }
  } catch (error) {
    logger.error('Error running functional tests', error);
    
    return {
      status: 'failure',
      message: `Error running functional tests: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Run performance tests
 */
async function runPerformanceTests() {
  logger.info('Running performance tests');
  
  try {
    // Generate performance report
    const performanceReport = await performanceOptimizer.generatePerformanceReport();
    
    // Check if performance is acceptable
    const isPerformanceAcceptable = 
      performanceReport.summary.overallStatus === 'good' || 
      performanceReport.summary.overallStatus === 'acceptable';
    
    if (isPerformanceAcceptable) {
      return {
        status: 'success',
        message: `Performance is ${performanceReport.summary.overallStatus}`,
        details: performanceReport
      };
    } else {
      return {
        status: 'failure',
        message: `Performance is ${performanceReport.summary.overallStatus}`,
        details: performanceReport
      };
    }
  } catch (error) {
    logger.error('Error running performance tests', error);
    
    return {
      status: 'failure',
      message: `Error running performance tests: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Run security checks
 */
async function runSecurityChecks() {
  logger.info('Running security checks');
  
  try {
    // Run npm audit
    const auditCommand = 'npm audit --json';
    
    try {
      const auditOutput = execSync(auditCommand, { stdio: 'pipe' }).toString();
      const auditResult = JSON.parse(auditOutput);
      
      const vulnerabilities = auditResult.metadata.vulnerabilities;
      const totalVulnerabilities = 
        vulnerabilities.critical + 
        vulnerabilities.high + 
        vulnerabilities.moderate + 
        vulnerabilities.low;
      
      // Only fail on critical or high vulnerabilities
      const hasCriticalVulnerabilities = 
        vulnerabilities.critical > 0 || 
        vulnerabilities.high > 0;
      
      if (!hasCriticalVulnerabilities) {
        return {
          status: 'success',
          message: `No critical or high vulnerabilities found (${totalVulnerabilities} total vulnerabilities)`,
          details: {
            command: auditCommand,
            vulnerabilities
          }
        };
      } else {
        return {
          status: 'failure',
          message: `Found ${vulnerabilities.critical} critical and ${vulnerabilities.high} high vulnerabilities`,
          details: {
            command: auditCommand,
            vulnerabilities
          }
        };
      }
    } catch (error) {
      // If npm audit fails with vulnerabilities, it will exit with a non-zero code
      try {
        const auditResult = JSON.parse(error.stdout.toString());
        
        const vulnerabilities = auditResult.metadata.vulnerabilities;
        const totalVulnerabilities = 
          vulnerabilities.critical + 
          vulnerabilities.high + 
          vulnerabilities.moderate + 
          vulnerabilities.low;
        
        // Only fail on critical or high vulnerabilities
        const hasCriticalVulnerabilities = 
          vulnerabilities.critical > 0 || 
          vulnerabilities.high > 0;
        
        if (!hasCriticalVulnerabilities) {
          return {
            status: 'success',
            message: `No critical or high vulnerabilities found (${totalVulnerabilities} total vulnerabilities)`,
            details: {
              command: auditCommand,
              vulnerabilities
            }
          };
        } else {
          return {
            status: 'failure',
            message: `Found ${vulnerabilities.critical} critical and ${vulnerabilities.high} high vulnerabilities`,
            details: {
              command: auditCommand,
              vulnerabilities
            }
          };
        }
      } catch (parseError) {
        return {
          status: 'failure',
          message: 'Error parsing npm audit output',
          details: {
            command: auditCommand,
            error: error.message,
            stdout: error.stdout ? error.stdout.toString() : null,
            stderr: error.stderr ? error.stderr.toString() : null
          }
        };
      }
    }
  } catch (error) {
    logger.error('Error running security checks', error);
    
    return {
      status: 'failure',
      message: `Error running security checks: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Generate summary from verification details
 */
function generateSummary(details) {
  const summary = {
    infrastructure: details.infrastructure.status,
    apiHealth: details.apiHealth.status,
    functionalTests: details.functionalTests.status,
    performanceTests: details.performanceTests.status,
    securityChecks: details.securityChecks.status,
    overallStatus: 'pending'
  };
  
  // Calculate overall status
  const statuses = Object.values(summary).filter(status => status !== 'pending');
  const failureCount = statuses.filter(status => status === 'failure').length;
  
  if (failureCount === 0) {
    summary.overallStatus = 'success';
  } else {
    summary.overallStatus = 'failure';
  }
  
  return summary;
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyDeployment()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = verifyDeployment;
}
