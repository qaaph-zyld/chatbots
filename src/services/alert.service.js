/**
 * Alert Service
 * 
 * Provides functionality to send alerts when system issues are detected
 */

const nodemailer = require('nodemailer');
const config = require('@core/config');
const mongoose = require('mongoose');

// Define a schema for alerts
const AlertSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  level: { type: String, required: true, enum: ['info', 'warning', 'critical'], index: true },
  source: { type: String, required: true },
  message: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  acknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: String },
  acknowledgedAt: { type: Date },
  notificationsSent: { type: Number, default: 0 },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date },
});

// Create model if it doesn't exist
let Alert;
try {
  Alert = mongoose.model('Alert');
} catch (error) {
  Alert = mongoose.model('Alert', AlertSchema);
}

class AlertService {
  constructor() {
    this.notifiers = [];
    this.alertThrottleMap = new Map(); // To prevent alert flooding
    this.throttleDuration = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Initialize the alert service
   * @param {Object} options - Configuration options
   */
  initialize(options = {}) {
    if (options.throttleDuration) {
      this.throttleDuration = options.throttleDuration;
    }

    // Register default notifiers
    this.registerEmailNotifier();
    this.registerSlackNotifier();
    this.registerWebhookNotifier();

    console.log('Alert service initialized');
  }

  /**
   * Register the email notifier
   */
  registerEmailNotifier() {
    if (config.alerts && config.alerts.email && config.alerts.email.enabled) {
      const emailConfig = config.alerts.email;
      
      // Create a transport for sending emails
      const transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.password
        }
      });

      // Register the email notifier
      this.registerNotifier(async (alert) => {
        // Only send emails for warning and critical alerts
        if (alert.level === 'info') return;

        const mailOptions = {
          from: emailConfig.from,
          to: emailConfig.recipients.join(', '),
          subject: `[${alert.level.toUpperCase()}] System Alert: ${alert.source}`,
          text: `
            Alert Level: ${alert.level}
            Source: ${alert.source}
            Time: ${alert.timestamp}
            Message: ${alert.message}
            Details: ${JSON.stringify(alert.details, null, 2)}
          `,
          html: `
            <h2>System Alert</h2>
            <p><strong>Alert Level:</strong> ${alert.level}</p>
            <p><strong>Source:</strong> ${alert.source}</p>
            <p><strong>Time:</strong> ${alert.timestamp}</p>
            <p><strong>Message:</strong> ${alert.message}</p>
            <h3>Details:</h3>
            <pre>${JSON.stringify(alert.details, null, 2)}</pre>
          `
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log(`Email alert sent for ${alert.source}`);
          return true;
        } catch (error) {
          console.error('Failed to send email alert:', error);
          return false;
        }
      });
    }
  }

  /**
   * Register the Slack notifier
   */
  registerSlackNotifier() {
    if (config.alerts && config.alerts.slack && config.alerts.slack.enabled) {
      const slackConfig = config.alerts.slack;
      
      this.registerNotifier(async (alert) => {
        // Only send slack messages for warning and critical alerts
        if (alert.level === 'info') return;

        const payload = {
          text: `*[${alert.level.toUpperCase()}] System Alert*`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `System Alert: ${alert.level.toUpperCase()}`,
                emoji: true
              }
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Source:*\n${alert.source}`
                },
                {
                  type: 'mrkdwn',
                  text: `*Time:*\n${alert.timestamp}`
                }
              ]
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Message:*\n${alert.message}`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Details:*\n\`\`\`${JSON.stringify(alert.details, null, 2)}\`\`\``
              }
            }
          ]
        };

        try {
          const response = await fetch(slackConfig.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`Slack API responded with status: ${response.status}`);
          }

          console.log(`Slack alert sent for ${alert.source}`);
          return true;
        } catch (error) {
          console.error('Failed to send Slack alert:', error);
          return false;
        }
      });
    }
  }

  /**
   * Register the webhook notifier
   */
  registerWebhookNotifier() {
    if (config.alerts && config.alerts.webhook && config.alerts.webhook.enabled) {
      const webhookConfig = config.alerts.webhook;
      
      this.registerNotifier(async (alert) => {
        // Filter alerts based on configuration
        if (webhookConfig.levels && !webhookConfig.levels.includes(alert.level)) {
          return;
        }

        const payload = {
          level: alert.level,
          source: alert.source,
          timestamp: alert.timestamp,
          message: alert.message,
          details: alert.details
        };

        try {
          const response = await fetch(webhookConfig.url, {
            method: webhookConfig.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...webhookConfig.headers
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`Webhook responded with status: ${response.status}`);
          }

          console.log(`Webhook alert sent for ${alert.source}`);
          return true;
        } catch (error) {
          console.error('Failed to send webhook alert:', error);
          return false;
        }
      });
    }
  }

  /**
   * Register a notifier function
   * @param {Function} notifier - Function that sends notifications
   */
  registerNotifier(notifier) {
    if (typeof notifier === 'function') {
      this.notifiers.push(notifier);
    }
  }

  /**
   * Create and process a new alert
   * @param {Object} alertData - Alert data
   * @returns {Promise<Object>} Created alert
   */
  async createAlert(alertData) {
    try {
      // Check if we should throttle this alert
      const throttleKey = `${alertData.source}:${alertData.message}`;
      const lastAlertTime = this.alertThrottleMap.get(throttleKey);
      
      if (lastAlertTime && (Date.now() - lastAlertTime < this.throttleDuration)) {
        // Update existing alert instead of creating a new one
        const existingAlert = await Alert.findOne({
          source: alertData.source,
          message: alertData.message,
          resolved: false
        }).sort({ timestamp: -1 });

        if (existingAlert) {
          existingAlert.details = alertData.details;
          existingAlert.notificationsSent += 1;
          await existingAlert.save();
          return existingAlert;
        }
      }

      // Set the throttle timestamp
      this.alertThrottleMap.set(throttleKey, Date.now());

      // Create a new alert
      const alert = new Alert({
        level: alertData.level || 'info',
        source: alertData.source,
        message: alertData.message,
        details: alertData.details || {}
      });

      await alert.save();

      // Send notifications
      this.sendNotifications(alert);

      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Send notifications for an alert
   * @param {Object} alert - The alert to send notifications for
   */
  async sendNotifications(alert) {
    try {
      // Call all registered notifiers
      const notificationResults = await Promise.allSettled(
        this.notifiers.map(notifier => notifier(alert))
      );

      // Count successful notifications
      const successfulNotifications = notificationResults.filter(
        result => result.status === 'fulfilled' && result.value === true
      ).length;

      // Update the alert with notification count
      await Alert.updateOne(
        { _id: alert._id },
        { $set: { notificationsSent: successfulNotifications } }
      );
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - ID of the alert to acknowledge
   * @param {string} acknowledgedBy - User who acknowledged the alert
   * @returns {Promise<Object>} Updated alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy) {
    try {
      const alert = await Alert.findById(alertId);
      
      if (!alert) {
        throw new Error(`Alert with ID ${alertId} not found`);
      }

      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      
      await alert.save();
      
      return alert;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  /**
   * Resolve an alert
   * @param {string} alertId - ID of the alert to resolve
   * @returns {Promise<Object>} Updated alert
   */
  async resolveAlert(alertId) {
    try {
      const alert = await Alert.findById(alertId);
      
      if (!alert) {
        throw new Error(`Alert with ID ${alertId} not found`);
      }

      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      await alert.save();
      
      return alert;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Get recent alerts
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of alerts
   */
  async getAlerts(options = {}) {
    try {
      const query = {};
      
      if (options.level) {
        query.level = options.level;
      }
      
      if (options.source) {
        query.source = options.source;
      }
      
      if (options.resolved !== undefined) {
        query.resolved = options.resolved;
      }
      
      if (options.acknowledged !== undefined) {
        query.acknowledged = options.acknowledged;
      }
      
      if (options.startTime) {
        query.timestamp = { $gte: new Date(options.startTime) };
      }
      
      if (options.endTime) {
        query.timestamp = { ...query.timestamp, $lte: new Date(options.endTime) };
      }

      const limit = options.limit || 100;
      const skip = options.skip || 0;
      
      return Alert.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }
}

module.exports = new AlertService();
