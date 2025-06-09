/**
 * Deployment Report Generator
 * 
 * This script generates comprehensive reports about deployments, including
 * success rates, performance metrics, and issues encountered.
 */

const fs = require('fs');
const path = require('path');
require('@src/utils\logger');

// Configuration
const config = {
  reportPath: path.join(__dirname, '../reports/deployment'),
  verificationPath: path.join(__dirname, '../reports/verification'),
  outputPath: path.join(__dirname, '../reports/deployment-summary')
};

/**
 * Main report generation function
 */
async function generateDeploymentReport() {
  try {
    logger.info('Starting deployment report generation');
    
    // Ensure output directory exists
    if (!fs.existsSync(config.outputPath)) {
      fs.mkdirSync(config.outputPath, { recursive: true });
    }
    
    // Get deployment records
    const deploymentRecords = getDeploymentRecords();
    
    // Get verification records
    const verificationRecords = getVerificationRecords();
    
    // Merge records
    const mergedRecords = mergeRecords(deploymentRecords, verificationRecords);
    
    // Generate summary
    const summary = generateSummary(mergedRecords);
    
    // Generate detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary,
      details: {
        deployments: mergedRecords
      }
    };
    
    // Save report
    const reportFilePath = path.join(
      config.outputPath,
      `deployment-report-${new Date().toISOString().replace(/:/g, '-')}.json`
    );
    
    fs.writeFileSync(reportFilePath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReportPath = generateHtmlReport(report, reportFilePath);
    
    logger.info(`Deployment report generated successfully`);
    logger.info(`JSON report saved to: ${reportFilePath}`);
    logger.info(`HTML report saved to: ${htmlReportPath}`);
    
    return {
      success: true,
      reportPath: reportFilePath,
      htmlReportPath
    };
  } catch (error) {
    logger.error('Error generating deployment report', error);
    throw error;
  }
}

/**
 * Get deployment records
 */
function getDeploymentRecords() {
  logger.info(`Reading deployment records from ${config.reportPath}`);
  
  try {
    if (!fs.existsSync(config.reportPath)) {
      logger.warn(`Deployment records directory not found: ${config.reportPath}`);
      return [];
    }
    
    const files = fs.readdirSync(config.reportPath);
    const deploymentRecords = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(config.reportPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const record = JSON.parse(content);
          
          deploymentRecords.push({
            ...record,
            source: filePath
          });
        } catch (error) {
          logger.warn(`Error reading deployment record: ${file}`, error);
        }
      }
    }
    
    logger.info(`Found ${deploymentRecords.length} deployment records`);
    
    return deploymentRecords;
  } catch (error) {
    logger.error('Error reading deployment records', error);
    return [];
  }
}

/**
 * Get verification records
 */
function getVerificationRecords() {
  logger.info(`Reading verification records from ${config.verificationPath}`);
  
  try {
    if (!fs.existsSync(config.verificationPath)) {
      logger.warn(`Verification records directory not found: ${config.verificationPath}`);
      return [];
    }
    
    const files = fs.readdirSync(config.verificationPath);
    const verificationRecords = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(config.verificationPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          const record = JSON.parse(content);
          
          verificationRecords.push({
            ...record,
            source: filePath
          });
        } catch (error) {
          logger.warn(`Error reading verification record: ${file}`, error);
        }
      }
    }
    
    logger.info(`Found ${verificationRecords.length} verification records`);
    
    return verificationRecords;
  } catch (error) {
    logger.error('Error reading verification records', error);
    return [];
  }
}

/**
 * Merge deployment and verification records
 */
function mergeRecords(deploymentRecords, verificationRecords) {
  logger.info('Merging deployment and verification records');
  
  const mergedRecords = [];
  
  // First, add all deployment records
  for (const deployment of deploymentRecords) {
    const record = {
      id: deployment.id,
      environment: deployment.environment,
      timestamp: deployment.timestamp,
      status: deployment.status || 'unknown',
      deploymentDetails: deployment,
      verificationDetails: null
    };
    
    // Find matching verification record
    const verification = verificationRecords.find(v => 
      v.environment === deployment.environment &&
      new Date(v.timestamp) > new Date(deployment.timestamp) &&
      new Date(v.timestamp) - new Date(deployment.timestamp) < 3600000 // Within 1 hour
    );
    
    if (verification) {
      record.verificationDetails = verification;
      record.verificationStatus = verification.status;
    }
    
    mergedRecords.push(record);
  }
  
  // Add verification records that don't have a matching deployment
  for (const verification of verificationRecords) {
    const hasMatchingDeployment = mergedRecords.some(record => 
      record.verificationDetails && 
      record.verificationDetails.source === verification.source
    );
    
    if (!hasMatchingDeployment) {
      mergedRecords.push({
        id: `verification-${verification.timestamp}`,
        environment: verification.environment,
        timestamp: verification.timestamp,
        status: 'unknown',
        deploymentDetails: null,
        verificationDetails: verification,
        verificationStatus: verification.status
      });
    }
  }
  
  // Sort by timestamp, newest first
  mergedRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  logger.info(`Created ${mergedRecords.length} merged records`);
  
  return mergedRecords;
}

/**
 * Generate summary from merged records
 */
function generateSummary(mergedRecords) {
  logger.info('Generating deployment summary');
  
  const summary = {
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    deploymentSuccessRate: 0,
    totalVerifications: 0,
    successfulVerifications: 0,
    failedVerifications: 0,
    verificationSuccessRate: 0,
    environmentStats: {},
    recentDeployments: [],
    commonIssues: []
  };
  
  // Count deployments and verifications
  for (const record of mergedRecords) {
    // Initialize environment stats if not exists
    if (!summary.environmentStats[record.environment]) {
      summary.environmentStats[record.environment] = {
        totalDeployments: 0,
        successfulDeployments: 0,
        failedDeployments: 0,
        deploymentSuccessRate: 0,
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        verificationSuccessRate: 0
      };
    }
    
    // Count deployments
    if (record.deploymentDetails) {
      summary.totalDeployments++;
      summary.environmentStats[record.environment].totalDeployments++;
      
      if (record.status === 'success') {
        summary.successfulDeployments++;
        summary.environmentStats[record.environment].successfulDeployments++;
      } else if (record.status === 'failure') {
        summary.failedDeployments++;
        summary.environmentStats[record.environment].failedDeployments++;
      }
    }
    
    // Count verifications
    if (record.verificationDetails) {
      summary.totalVerifications++;
      summary.environmentStats[record.environment].totalVerifications++;
      
      if (record.verificationStatus === 'success') {
        summary.successfulVerifications++;
        summary.environmentStats[record.environment].successfulVerifications++;
      } else if (record.verificationStatus === 'failure') {
        summary.failedVerifications++;
        summary.environmentStats[record.environment].failedVerifications++;
      }
    }
  }
  
  // Calculate success rates
  if (summary.totalDeployments > 0) {
    summary.deploymentSuccessRate = (summary.successfulDeployments / summary.totalDeployments) * 100;
  }
  
  if (summary.totalVerifications > 0) {
    summary.verificationSuccessRate = (summary.successfulVerifications / summary.totalVerifications) * 100;
  }
  
  // Calculate environment success rates
  for (const env in summary.environmentStats) {
    const stats = summary.environmentStats[env];
    
    if (stats.totalDeployments > 0) {
      stats.deploymentSuccessRate = (stats.successfulDeployments / stats.totalDeployments) * 100;
    }
    
    if (stats.totalVerifications > 0) {
      stats.verificationSuccessRate = (stats.successfulVerifications / stats.totalVerifications) * 100;
    }
  }
  
  // Get recent deployments (last 5)
  summary.recentDeployments = mergedRecords
    .filter(record => record.deploymentDetails)
    .slice(0, 5)
    .map(record => ({
      id: record.id,
      environment: record.environment,
      timestamp: record.timestamp,
      status: record.status,
      verificationStatus: record.verificationStatus
    }));
  
  // Analyze common issues
  const issues = [];
  
  for (const record of mergedRecords) {
    if (record.status === 'failure' && record.deploymentDetails && record.deploymentDetails.error) {
      issues.push({
        type: 'deployment',
        environment: record.environment,
        error: record.deploymentDetails.error
      });
    }
    
    if (record.verificationStatus === 'failure' && record.verificationDetails) {
      // Extract issues from verification details
      const verificationDetails = record.verificationDetails;
      
      if (verificationDetails.details) {
        if (verificationDetails.details.infrastructure && verificationDetails.details.infrastructure.status === 'failure') {
          issues.push({
            type: 'verification',
            category: 'infrastructure',
            environment: record.environment,
            message: verificationDetails.details.infrastructure.message
          });
        }
        
        if (verificationDetails.details.apiHealth && verificationDetails.details.apiHealth.status === 'failure') {
          issues.push({
            type: 'verification',
            category: 'api',
            environment: record.environment,
            message: verificationDetails.details.apiHealth.message
          });
        }
        
        if (verificationDetails.details.functionalTests && verificationDetails.details.functionalTests.status === 'failure') {
          issues.push({
            type: 'verification',
            category: 'functional',
            environment: record.environment,
            message: verificationDetails.details.functionalTests.message
          });
        }
        
        if (verificationDetails.details.performanceTests && verificationDetails.details.performanceTests.status === 'failure') {
          issues.push({
            type: 'verification',
            category: 'performance',
            environment: record.environment,
            message: verificationDetails.details.performanceTests.message
          });
        }
        
        if (verificationDetails.details.securityChecks && verificationDetails.details.securityChecks.status === 'failure') {
          issues.push({
            type: 'verification',
            category: 'security',
            environment: record.environment,
            message: verificationDetails.details.securityChecks.message
          });
        }
      }
    }
  }
  
  // Group issues by category and count occurrences
  const issueGroups = {};
  
  for (const issue of issues) {
    const key = `${issue.type}-${issue.category || 'unknown'}-${issue.environment}`;
    
    if (!issueGroups[key]) {
      issueGroups[key] = {
        type: issue.type,
        category: issue.category || 'unknown',
        environment: issue.environment,
        count: 0,
        examples: []
      };
    }
    
    issueGroups[key].count++;
    
    if (issueGroups[key].examples.length < 3) {
      issueGroups[key].examples.push(issue.message || issue.error);
    }
  }
  
  // Convert to array and sort by count
  summary.commonIssues = Object.values(issueGroups)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  logger.info('Deployment summary generated successfully');
  
  return summary;
}

/**
 * Generate HTML report
 */
function generateHtmlReport(report, jsonReportPath) {
  logger.info('Generating HTML report');
  
  const htmlReportPath = jsonReportPath.replace('.json', '.html');
  
  // Generate HTML content
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deployment Report - ${new Date(report.timestamp).toLocaleString()}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    .header {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
      border-left: 5px solid #007bff;
    }
    .card {
      background-color: #fff;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    .stat {
      display: inline-block;
      width: 200px;
      text-align: center;
      margin: 10px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .stat-label {
      font-size: 14px;
      color: #6c757d;
    }
    .success {
      color: #28a745;
    }
    .failure {
      color: #dc3545;
    }
    .warning {
      color: #ffc107;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th, .table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
    }
    .table th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    .table tr:hover {
      background-color: #f8f9fa;
    }
    .badge {
      display: inline-block;
      padding: 3px 7px;
      font-size: 12px;
      font-weight: bold;
      line-height: 1;
      text-align: center;
      white-space: nowrap;
      vertical-align: baseline;
      border-radius: 10px;
    }
    .badge-success {
      background-color: #d4edda;
      color: #155724;
    }
    .badge-danger {
      background-color: #f8d7da;
      color: #721c24;
    }
    .badge-warning {
      background-color: #fff3cd;
      color: #856404;
    }
    .badge-info {
      background-color: #d1ecf1;
      color: #0c5460;
    }
    .chart-container {
      height: 300px;
      margin-bottom: 20px;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <div class="header">
    <h1>Deployment Report</h1>
    <p>Generated on: ${new Date(report.timestamp).toLocaleString()}</p>
  </div>
  
  <div class="card">
    <h2>Deployment Summary</h2>
    <div>
      <div class="stat">
        <div class="stat-label">Total Deployments</div>
        <div class="stat-value">${report.summary.totalDeployments}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Success Rate</div>
        <div class="stat-value ${getSuccessRateClass(report.summary.deploymentSuccessRate)}">${report.summary.deploymentSuccessRate.toFixed(1)}%</div>
      </div>
      <div class="stat">
        <div class="stat-label">Successful</div>
        <div class="stat-value success">${report.summary.successfulDeployments}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Failed</div>
        <div class="stat-value failure">${report.summary.failedDeployments}</div>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h2>Verification Summary</h2>
    <div>
      <div class="stat">
        <div class="stat-label">Total Verifications</div>
        <div class="stat-value">${report.summary.totalVerifications}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Success Rate</div>
        <div class="stat-value ${getSuccessRateClass(report.summary.verificationSuccessRate)}">${report.summary.verificationSuccessRate.toFixed(1)}%</div>
      </div>
      <div class="stat">
        <div class="stat-label">Successful</div>
        <div class="stat-value success">${report.summary.successfulVerifications}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Failed</div>
        <div class="stat-value failure">${report.summary.failedVerifications}</div>
      </div>
    </div>
  </div>
  
  <div class="card">
    <h2>Environment Statistics</h2>
    <div class="chart-container">
      <canvas id="environmentChart"></canvas>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Environment</th>
          <th>Deployments</th>
          <th>Success Rate</th>
          <th>Verifications</th>
          <th>Success Rate</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(report.summary.environmentStats).map(([env, stats]) => `
          <tr>
            <td>${env}</td>
            <td>${stats.totalDeployments}</td>
            <td><span class="${getSuccessRateClass(stats.deploymentSuccessRate)}">${stats.deploymentSuccessRate.toFixed(1)}%</span></td>
            <td>${stats.totalVerifications}</td>
            <td><span class="${getSuccessRateClass(stats.verificationSuccessRate)}">${stats.verificationSuccessRate.toFixed(1)}%</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="card">
    <h2>Recent Deployments</h2>
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Environment</th>
          <th>Timestamp</th>
          <th>Deployment Status</th>
          <th>Verification Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.summary.recentDeployments.map(deployment => `
          <tr>
            <td>${deployment.id}</td>
            <td>${deployment.environment}</td>
            <td>${new Date(deployment.timestamp).toLocaleString()}</td>
            <td><span class="badge ${getStatusBadgeClass(deployment.status)}">${deployment.status || 'unknown'}</span></td>
            <td><span class="badge ${getStatusBadgeClass(deployment.verificationStatus)}">${deployment.verificationStatus || 'not verified'}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <div class="card">
    <h2>Common Issues</h2>
    ${report.summary.commonIssues.length === 0 ? '<p>No common issues found.</p>' : `
      <table class="table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Category</th>
            <th>Environment</th>
            <th>Count</th>
            <th>Examples</th>
          </tr>
        </thead>
        <tbody>
          ${report.summary.commonIssues.map(issue => `
            <tr>
              <td>${issue.type}</td>
              <td>${issue.category}</td>
              <td>${issue.environment}</td>
              <td>${issue.count}</td>
              <td>
                <ul>
                  ${issue.examples.map(example => `<li>${example}</li>`).join('')}
                </ul>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `}
  </div>
  
  <script>
    // Environment Chart
    const envCtx = document.getElementById('environmentChart').getContext('2d');
    const environments = ${JSON.stringify(Object.keys(report.summary.environmentStats))};
    const deploymentSuccessRates = environments.map(env => ${JSON.stringify(report.summary.environmentStats)}[env].deploymentSuccessRate);
    const verificationSuccessRates = environments.map(env => ${JSON.stringify(report.summary.environmentStats)}[env].verificationSuccessRate);
    
    new Chart(envCtx, {
      type: 'bar',
      data: {
        labels: environments,
        datasets: [
          {
            label: 'Deployment Success Rate (%)',
            data: deploymentSuccessRates,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Verification Success Rate (%)',
            data: verificationSuccessRates,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  </script>
</body>
</html>

<script>
function getSuccessRateClass(rate) {
  if (rate >= 90) return 'success';
  if (rate >= 75) return 'warning';
  return 'failure';
}

function getStatusBadgeClass(status) {
  if (status === 'success') return 'badge-success';
  if (status === 'failure') return 'badge-danger';
  if (status === 'in_progress') return 'badge-info';
  return 'badge-warning';
}
</script>
  `;
  
  fs.writeFileSync(htmlReportPath, htmlContent);
  
  logger.info(`HTML report saved to: ${htmlReportPath}`);
  
  return htmlReportPath;
}

// Helper functions for HTML generation
function getSuccessRateClass(rate) {
  if (rate >= 90) return 'success';
  if (rate >= 75) return 'warning';
  return 'failure';
}

function getStatusBadgeClass(status) {
  if (status === 'success') return 'badge-success';
  if (status === 'failure') return 'badge-danger';
  if (status === 'in_progress') return 'badge-info';
  return 'badge-warning';
}

// Run the report generation if this script is executed directly
if (require.main === module) {
  generateDeploymentReport()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Report generation failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = generateDeploymentReport;
}
