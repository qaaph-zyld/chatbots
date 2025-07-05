#!/usr/bin/env node

/**
 * Deployment Notification Script
 * 
 * This script sends notifications about deployment status to various channels
 * including Slack, email, and Microsoft Teams.
 */

const axios = require('axios');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
    channel: process.env.SLACK_CHANNEL || '#deployments',
    username: 'Deployment Bot',
    iconEmoji: ':rocket:'
  },
  email: {
    enabled: process.env.EMAIL_NOTIFICATIONS === 'true',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    from: process.env.EMAIL_FROM || 'deployments@chatbot-platform.example.com',
    to: process.env.EMAIL_RECIPIENTS || 'team@chatbot-platform.example.com'
  },
  teams: {
    webhookUrl: process.env.TEAMS_WEBHOOK_URL
  },
  deployment: {
    id: process.env.DEPLOYMENT_ID || Date.now().toString(),
    environment: process.env.ENVIRONMENT || 'production',
    color: process.env.DEPLOYMENT_COLOR || 'unknown',
    version: process.env.VERSION || 'latest',
    commitSha: process.env.COMMIT_SHA || 'unknown',
    commitMessage: process.env.COMMIT_MESSAGE || 'No commit message',
    buildUrl: process.env.BUILD_URL || '',
    deployedBy: process.env.DEPLOYED_BY || 'CI/CD System'
  }
};

/**
 * Send notification to Slack
 */
async function sendSlackNotification(status, details = {}) {
  if (!config.slack.webhookUrl) {
    console.log('Slack webhook URL not configured, skipping Slack notification');
    return;
  }

  try {
    const color = getStatusColor(status);
    const emoji = getStatusEmoji(status);
    
    const payload = {
      channel: config.slack.channel,
      username: config.slack.username,
      icon_emoji: config.slack.iconEmoji,
      attachments: [
        {
          color,
          pretext: `${emoji} *Deployment ${status.toUpperCase()}*`,
          title: `${config.deployment.environment.toUpperCase()} Deployment (${config.deployment.color})`,
          title_link: config.deployment.buildUrl,
          fields: [
            {
              title: 'Environment',
              value: config.deployment.environment,
              short: true
            },
            {
              title: 'Version',
              value: config.deployment.version,
              short: true
            },
            {
              title: 'Deployment Color',
              value: config.deployment.color,
              short: true
            },
            {
              title: 'Deployed By',
              value: config.deployment.deployedBy,
              short: true
            },
            {
              title: 'Commit',
              value: `\`${config.deployment.commitSha.substring(0, 7)}\``,
              short: true
            },
            {
              title: 'Deployment ID',
              value: config.deployment.id,
              short: true
            }
          ],
          footer: `Chatbot Platform CI/CD`,
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };
    
    // Add details if provided
    if (details.message) {
      payload.attachments[0].text = details.message;
    }
    
    if (details.errors) {
      payload.attachments[0].fields.push({
        title: 'Errors',
        value: '```' + details.errors.slice(0, 500) + (details.errors.length > 500 ? '...' : '') + '```',
        short: false
      });
    }
    
    if (details.testResults) {
      payload.attachments[0].fields.push({
        title: 'Test Results',
        value: `Passed: ${details.testResults.passed}, Failed: ${details.testResults.failed}, Total: ${details.testResults.total}`,
        short: false
      });
    }
    
    await axios.post(config.slack.webhookUrl, payload);
    console.log('Slack notification sent successfully');
  } catch (error) {
    console.error('Error sending Slack notification:', error.message);
  }
}

/**
 * Send notification via email
 */
async function sendEmailNotification(status, details = {}) {
  if (!config.email.enabled || !config.email.host || !config.email.auth.user) {
    console.log('Email notifications not configured, skipping email notification');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth
    });
    
    const emoji = getStatusEmoji(status);
    const subject = `${emoji} [${config.deployment.environment.toUpperCase()}] Deployment ${status.toUpperCase()} - ${config.deployment.version}`;
    
    let html = `
      <h2>Deployment ${status.toUpperCase()}</h2>
      <p><strong>Environment:</strong> ${config.deployment.environment}</p>
      <p><strong>Version:</strong> ${config.deployment.version}</p>
      <p><strong>Deployment Color:</strong> ${config.deployment.color}</p>
      <p><strong>Deployed By:</strong> ${config.deployment.deployedBy}</p>
      <p><strong>Commit:</strong> ${config.deployment.commitSha.substring(0, 7)}</p>
      <p><strong>Deployment ID:</strong> ${config.deployment.id}</p>
    `;
    
    if (details.message) {
      html += `<p><strong>Message:</strong> ${details.message}</p>`;
    }
    
    if (details.errors) {
      html += `
        <h3>Errors</h3>
        <pre>${details.errors.slice(0, 1000) + (details.errors.length > 1000 ? '...' : '')}</pre>
      `;
    }
    
    if (details.testResults) {
      html += `
        <h3>Test Results</h3>
        <p>Passed: ${details.testResults.passed}, Failed: ${details.testResults.failed}, Total: ${details.testResults.total}</p>
      `;
    }
    
    if (config.deployment.buildUrl) {
      html += `<p><a href="${config.deployment.buildUrl}">View Build Details</a></p>`;
    }
    
    const info = await transporter.sendMail({
      from: config.email.from,
      to: config.email.to,
      subject,
      html
    });
    
    console.log('Email notification sent successfully:', info.messageId);
  } catch (error) {
    console.error('Error sending email notification:', error.message);
  }
}

/**
 * Send notification to Microsoft Teams
 */
async function sendTeamsNotification(status, details = {}) {
  if (!config.teams.webhookUrl) {
    console.log('Teams webhook URL not configured, skipping Teams notification');
    return;
  }

  try {
    const color = getStatusColor(status);
    const emoji = getStatusEmoji(status);
    
    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: color.replace('#', ''),
      summary: `Deployment ${status.toUpperCase()} - ${config.deployment.environment}`,
      sections: [
        {
          activityTitle: `${emoji} Deployment ${status.toUpperCase()}`,
          activitySubtitle: `${config.deployment.environment.toUpperCase()} Deployment (${config.deployment.color})`,
          facts: [
            {
              name: 'Environment',
              value: config.deployment.environment
            },
            {
              name: 'Version',
              value: config.deployment.version
            },
            {
              name: 'Deployment Color',
              value: config.deployment.color
            },
            {
              name: 'Deployed By',
              value: config.deployment.deployedBy
            },
            {
              name: 'Commit',
              value: config.deployment.commitSha.substring(0, 7)
            },
            {
              name: 'Deployment ID',
              value: config.deployment.id
            }
          ]
        }
      ]
    };
    
    // Add details if provided
    if (details.message) {
      payload.sections[0].text = details.message;
    }
    
    if (details.errors) {
      payload.sections.push({
        title: 'Errors',
        text: '```' + details.errors.slice(0, 500) + (details.errors.length > 500 ? '...' : '') + '```'
      });
    }
    
    if (details.testResults) {
      payload.sections.push({
        title: 'Test Results',
        text: `Passed: ${details.testResults.passed}, Failed: ${details.testResults.failed}, Total: ${details.testResults.total}`
      });
    }
    
    // Add actions if build URL is available
    if (config.deployment.buildUrl) {
      payload.potentialAction = [
        {
          '@type': 'OpenUri',
          name: 'View Build Details',
          targets: [
            {
              os: 'default',
              uri: config.deployment.buildUrl
            }
          ]
        }
      ];
    }
    
    await axios.post(config.teams.webhookUrl, payload);
    console.log('Teams notification sent successfully');
  } catch (error) {
    console.error('Error sending Teams notification:', error.message);
  }
}

/**
 * Get color based on status
 */
function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'started':
      return '#3498db'; // Blue
    case 'success':
    case 'completed':
      return '#2ecc71'; // Green
    case 'failed':
      return '#e74c3c'; // Red
    case 'warning':
      return '#f39c12'; // Orange
    default:
      return '#95a5a6'; // Gray
  }
}

/**
 * Get emoji based on status
 */
function getStatusEmoji(status) {
  switch (status.toLowerCase()) {
    case 'started':
      return '🚀';
    case 'success':
    case 'completed':
      return '✅';
    case 'failed':
      return '❌';
    case 'warning':
      return '⚠️';
    default:
      return '🔄';
  }
}

/**
 * Send notifications to all configured channels
 */
async function sendNotifications(status, details = {}) {
  console.log(`Sending ${status} notifications for deployment ${config.deployment.id}`);
  
  await Promise.all([
    sendSlackNotification(status, details),
    sendEmailNotification(status, details),
    sendTeamsNotification(status, details)
  ]);
  
  console.log('All notifications sent');
}

/**
 * Main function
 */
async function main() {
  const status = process.argv[2] || 'completed';
  const detailsFile = process.argv[3];
  
  let details = {};
  
  if (detailsFile && fs.existsSync(detailsFile)) {
    try {
      details = JSON.parse(fs.readFileSync(detailsFile, 'utf8'));
    } catch (error) {
      console.error('Error parsing details file:', error.message);
    }
  }
  
  await sendNotifications(status, details);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  sendNotifications,
  sendSlackNotification,
  sendEmailNotification,
  sendTeamsNotification
};
