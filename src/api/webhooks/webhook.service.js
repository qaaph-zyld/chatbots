/**
 * Webhook service for the Chatbots Platform
 * Handles webhook delivery and management
 */
const axios = require('axios');
const { Webhook, EVENT_TYPES } = require('./webhook.model');
const crypto = require('crypto');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('webhook-service');

class WebhookService {
  /**
   * Create a new webhook
   * @param {Object} webhookData - Webhook configuration data
   * @param {String} userId - ID of the user creating the webhook
   * @returns {Promise<Object>} Created webhook
   */
  async createWebhook(webhookData, userId) {
    try {
      const webhook = new Webhook({
        ...webhookData,
        createdBy: userId
      });
      
      await webhook.save();
      
      logger.info(`Webhook created: ${webhook._id}`, { 
        webhookId: webhook._id,
        userId,
        events: webhook.events
      });
      
      return webhook;
    } catch (error) {
      logger.error(`Error creating webhook: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get all webhooks for a user
   * @param {String} userId - ID of the user
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} List of webhooks
   */
  async getWebhooks(userId, filters = {}) {
    try {
      const query = { createdBy: userId };
      
      // Apply additional filters
      if (filters.active !== undefined) {
        query.active = filters.active;
      }
      
      if (filters.event) {
        query.events = filters.event;
      }
      
      const webhooks = await Webhook.find(query).sort({ createdAt: -1 });
      
      return webhooks;
    } catch (error) {
      logger.error(`Error getting webhooks: ${error.message}`, { error, userId });
      throw error;
    }
  }
  
  /**
   * Get a webhook by ID
   * @param {String} webhookId - ID of the webhook
   * @param {String} userId - ID of the user (for authorization)
   * @returns {Promise<Object>} Webhook
   */
  async getWebhookById(webhookId, userId) {
    try {
      const webhook = await Webhook.findOne({ _id: webhookId, createdBy: userId });
      
      if (!webhook) {
        const error = new Error('Webhook not found');
        error.statusCode = 404;
        throw error;
      }
      
      return webhook;
    } catch (error) {
      logger.error(`Error getting webhook: ${error.message}`, { error, webhookId, userId });
      throw error;
    }
  }
  
  /**
   * Update a webhook
   * @param {String} webhookId - ID of the webhook
   * @param {Object} updateData - Data to update
   * @param {String} userId - ID of the user (for authorization)
   * @returns {Promise<Object>} Updated webhook
   */
  async updateWebhook(webhookId, updateData, userId) {
    try {
      const webhook = await Webhook.findOne({ _id: webhookId, createdBy: userId });
      
      if (!webhook) {
        const error = new Error('Webhook not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Fields that cannot be updated
      delete updateData._id;
      delete updateData.createdBy;
      delete updateData.stats;
      
      // Update webhook
      Object.assign(webhook, updateData);
      await webhook.save();
      
      logger.info(`Webhook updated: ${webhookId}`, { webhookId, userId });
      
      return webhook;
    } catch (error) {
      logger.error(`Error updating webhook: ${error.message}`, { error, webhookId, userId });
      throw error;
    }
  }
  
  /**
   * Delete a webhook
   * @param {String} webhookId - ID of the webhook
   * @param {String} userId - ID of the user (for authorization)
   * @returns {Promise<Boolean>} Success status
   */
  async deleteWebhook(webhookId, userId) {
    try {
      const result = await Webhook.deleteOne({ _id: webhookId, createdBy: userId });
      
      if (result.deletedCount === 0) {
        const error = new Error('Webhook not found');
        error.statusCode = 404;
        throw error;
      }
      
      logger.info(`Webhook deleted: ${webhookId}`, { webhookId, userId });
      
      return true;
    } catch (error) {
      logger.error(`Error deleting webhook: ${error.message}`, { error, webhookId, userId });
      throw error;
    }
  }
  
  /**
   * Generate a new secret for a webhook
   * @param {String} webhookId - ID of the webhook
   * @param {String} userId - ID of the user (for authorization)
   * @returns {Promise<Object>} Updated webhook with new secret
   */
  async regenerateSecret(webhookId, userId) {
    try {
      const webhook = await Webhook.findOne({ _id: webhookId, createdBy: userId });
      
      if (!webhook) {
        const error = new Error('Webhook not found');
        error.statusCode = 404;
        throw error;
      }
      
      webhook.generateNewSecret();
      await webhook.save();
      
      logger.info(`Webhook secret regenerated: ${webhookId}`, { webhookId, userId });
      
      return webhook;
    } catch (error) {
      logger.error(`Error regenerating webhook secret: ${error.message}`, { error, webhookId, userId });
      throw error;
    }
  }
  
  /**
   * Trigger a webhook event
   * @param {String} eventType - Type of event
   * @param {Object} payload - Event payload
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} Delivery results
   */
  async triggerEvent(eventType, payload, options = {}) {
    try {
      // Validate event type
      if (!EVENT_TYPES.includes(eventType)) {
        throw new Error(`Invalid event type: ${eventType}`);
      }
      
      // Find all active webhooks for this event
      const webhooks = await Webhook.findActiveByEvent(eventType);
      
      if (webhooks.length === 0) {
        logger.debug(`No active webhooks found for event: ${eventType}`);
        return [];
      }
      
      // Prepare event data
      const eventData = {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: payload
      };
      
      // Deliver to all webhooks
      const deliveryPromises = webhooks.map(webhook => 
        this.deliverWebhook(webhook, eventData, options)
      );
      
      // Wait for all deliveries to complete
      const results = await Promise.allSettled(deliveryPromises);
      
      // Log summary
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      logger.info(`Webhook event ${eventType} delivered: ${successful} successful, ${failed} failed`, {
        eventType,
        successful,
        failed,
        total: webhooks.length
      });
      
      return results.map((result, index) => ({
        webhookId: webhooks[index]._id,
        success: result.status === 'fulfilled',
        result: result.status === 'fulfilled' ? result.value : result.reason.message
      }));
    } catch (error) {
      logger.error(`Error triggering webhook event: ${error.message}`, { error, eventType });
      throw error;
    }
  }
  
  /**
   * Deliver a webhook
   * @param {Object} webhook - Webhook to deliver
   * @param {Object} eventData - Event data
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Delivery result
   * @private
   */
  async deliverWebhook(webhook, eventData, options = {}) {
    const startTime = Date.now();
    const webhookId = webhook._id.toString();
    
    try {
      // Apply webhook filters if configured
      if (webhook.filterConfig && webhook.filterConfig.conditions) {
        const shouldDeliver = this.evaluateFilters(webhook.filterConfig.conditions, eventData);
        if (!shouldDeliver) {
          logger.debug(`Webhook ${webhookId} filtered out for event ${eventData.event}`, { 
            webhookId, 
            event: eventData.event 
          });
          return { filtered: true };
        }
      }
      
      // Generate signature
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(eventData))
        .digest('hex');
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Chatbots-Signature': `sha256=${signature}`,
        'X-Chatbots-Event': eventData.event,
        'X-Chatbots-Delivery': crypto.randomUUID()
      };
      
      // Add custom headers if configured
      if (webhook.headers && webhook.headers.size > 0) {
        webhook.headers.forEach((value, key) => {
          headers[key] = value;
        });
      }
      
      // Make the request with timeout
      const response = await axios({
        method: 'post',
        url: webhook.url,
        headers,
        data: eventData,
        timeout: options.timeout || 10000, // 10 seconds default timeout
        proxy: process.env.HTTP_PROXY ? {
          host: process.env.HTTP_PROXY.split(':')[0],
          port: parseInt(process.env.HTTP_PROXY.split(':')[1])
        } : null
      });
      
      // Update webhook stats
      await Webhook.updateOne(
        { _id: webhook._id },
        {
          $inc: {
            'stats.totalDeliveries': 1,
            'stats.successfulDeliveries': 1
          },
          $set: {
            'stats.lastDeliveryAttempt': new Date(),
            'stats.lastSuccessfulDelivery': new Date()
          }
        }
      );
      
      const duration = Date.now() - startTime;
      
      logger.info(`Webhook ${webhookId} delivered successfully in ${duration}ms`, {
        webhookId,
        event: eventData.event,
        duration,
        statusCode: response.status
      });
      
      return {
        success: true,
        statusCode: response.status,
        duration
      };
    } catch (error) {
      // Update webhook stats
      await Webhook.updateOne(
        { _id: webhook._id },
        {
          $inc: {
            'stats.totalDeliveries': 1,
            'stats.failedDeliveries': 1
          },
          $set: {
            'stats.lastDeliveryAttempt': new Date(),
            'stats.lastFailedDelivery': new Date()
          }
        }
      );
      
      const duration = Date.now() - startTime;
      
      logger.error(`Webhook ${webhookId} delivery failed in ${duration}ms: ${error.message}`, {
        webhookId,
        event: eventData.event,
        duration,
        error: error.message,
        statusCode: error.response?.status
      });
      
      // Handle retries if configured
      if (webhook.retryConfig && webhook.retryConfig.maxRetries > 0 && !options.isRetry) {
        this.scheduleRetry(webhook, eventData, {
          ...options,
          isRetry: true,
          retryCount: 1
        });
      }
      
      throw new Error(`Webhook delivery failed: ${error.message}`);
    }
  }
  
  /**
   * Schedule a retry for a failed webhook delivery
   * @param {Object} webhook - Webhook to retry
   * @param {Object} eventData - Event data
   * @param {Object} options - Retry options
   * @private
   */
  scheduleRetry(webhook, eventData, options) {
    const { retryCount, maxRetries = webhook.retryConfig.maxRetries } = options;
    
    if (retryCount > maxRetries) {
      logger.warn(`Maximum retries reached for webhook ${webhook._id}`, {
        webhookId: webhook._id,
        event: eventData.event,
        maxRetries
      });
      return;
    }
    
    const delay = webhook.retryConfig.retryInterval * Math.pow(2, retryCount - 1);
    
    logger.info(`Scheduling retry ${retryCount}/${maxRetries} for webhook ${webhook._id} in ${delay}ms`, {
      webhookId: webhook._id,
      event: eventData.event,
      retryCount,
      maxRetries,
      delay
    });
    
    setTimeout(() => {
      this.deliverWebhook(webhook, eventData, {
        ...options,
        retryCount: retryCount + 1
      }).catch(error => {
        logger.error(`Retry ${retryCount} failed for webhook ${webhook._id}: ${error.message}`, {
          webhookId: webhook._id,
          event: eventData.event,
          retryCount,
          error: error.message
        });
      });
    }, delay);
  }
  
  /**
   * Evaluate webhook filters
   * @param {Object} conditions - Filter conditions
   * @param {Object} eventData - Event data
   * @returns {Boolean} Whether the webhook should be delivered
   * @private
   */
  evaluateFilters(conditions, eventData) {
    // Simple implementation - can be extended for more complex filtering
    for (const [path, value] of Object.entries(conditions)) {
      const parts = path.split('.');
      let current = eventData;
      
      // Navigate to the nested property
      for (const part of parts) {
        if (current === undefined || current === null) {
          return false;
        }
        current = current[part];
      }
      
      // Check if the value matches
      if (current !== value) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Test a webhook by sending a test event
   * @param {String} webhookId - ID of the webhook
   * @param {String} userId - ID of the user (for authorization)
   * @returns {Promise<Object>} Test result
   */
  async testWebhook(webhookId, userId) {
    try {
      const webhook = await Webhook.findOne({ _id: webhookId, createdBy: userId });
      
      if (!webhook) {
        const error = new Error('Webhook not found');
        error.statusCode = 404;
        throw error;
      }
      
      // Create test event data
      const eventData = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test event',
          webhookId: webhook._id.toString()
        }
      };
      
      // Deliver test event
      const result = await this.deliverWebhook(webhook, eventData, { isTest: true });
      
      logger.info(`Webhook test completed for ${webhookId}`, { 
        webhookId, 
        userId, 
        success: result.success 
      });
      
      return {
        success: true,
        delivery: result
      };
    } catch (error) {
      logger.error(`Webhook test failed for ${webhookId}: ${error.message}`, { 
        error, 
        webhookId, 
        userId 
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new WebhookService();
