/**
 * Slack Integration Service
 * 
 * Handles integration with Slack using the Slack Bolt API
 */

const { App, ExpressReceiver } = require('@slack/bolt');
require('@src/utils');
require('@src/models\integration.model');

class SlackIntegrationService {
  constructor() {
    this.apps = new Map(); // Map of Slack app instances by integration ID
    this.expressReceivers = new Map(); // Map of Express receivers by integration ID
  }

  /**
   * Initialize the Slack integration
   * @param {Object} integration - Integration object
   * @returns {Promise<void>}
   */
  async initialize(integration) {
    try {
      logger.info(`Initializing Slack integration: ${integration._id}`);
      
      // Check if already initialized
      if (this.apps.has(integration._id.toString())) {
        logger.info(`Slack integration ${integration._id} already initialized`);
        return;
      }
      
      // Create Express receiver for handling events
      const receiver = new ExpressReceiver({
        signingSecret: integration.config.signingSecret,
        endpoints: { 
          events: `/integrations/slack/${integration._id}/events`,
          commands: `/integrations/slack/${integration._id}/commands`,
          actions: `/integrations/slack/${integration._id}/actions`
        },
        processBeforeResponse: true
      });
      
      // Create Slack app
      const app = new App({
        token: integration.config.botToken,
        receiver
      });
      
      // Store app and receiver
      this.apps.set(integration._id.toString(), app);
      this.expressReceivers.set(integration._id.toString(), receiver);
      
      // Register event listeners
      this._registerEventListeners(app, integration);
      
      // Update integration status
      if (integration.status !== 'active') {
        integration.status = 'active';
        await integration.save();
      }
      
      // Store Slack team info in metadata
      try {
        const authInfo = await app.client.auth.test();
        integration.metadata.teamId = authInfo.team_id;
        integration.metadata.teamName = authInfo.team;
        integration.metadata.botId = authInfo.bot_id;
        integration.metadata.botUserId = authInfo.user_id;
        await integration.save();
      } catch (error) {
        logger.error(`Error getting Slack team info for integration ${integration._id}:`, error.message);
      }
      
      logger.info(`Slack integration ${integration._id} initialized successfully`);
    } catch (error) {
      logger.error(`Error initializing Slack integration ${integration._id}:`, error.message);
      throw error;
    }
  }

  /**
   * Deactivate the Slack integration
   * @param {Object} integration - Integration object
   * @returns {Promise<void>}
   */
  async deactivate(integration) {
    try {
      logger.info(`Deactivating Slack integration: ${integration._id}`);
      
      // Remove app and receiver
      this.apps.delete(integration._id.toString());
      this.expressReceivers.delete(integration._id.toString());
      
      logger.info(`Slack integration ${integration._id} deactivated successfully`);
    } catch (error) {
      logger.error(`Error deactivating Slack integration ${integration._id}:`, error.message);
      throw error;
    }
  }

  /**
   * Normalize a message from Slack
   * @param {Object} message - Message from Slack
   * @returns {Promise<Object>} Normalized message
   */
  async normalizeMessage(message) {
    return {
      userId: message.user || message.user_id || 'unknown',
      text: message.text || '',
      timestamp: new Date(parseInt(message.ts || message.event_ts || Date.now() / 1000) * 1000),
      metadata: {
        channel: message.channel || message.channel_id,
        team: message.team || message.team_id,
        threadTs: message.thread_ts,
        slackEvent: message.event || {},
        isDirectMessage: message.channel_type === 'im'
      }
    };
  }

  /**
   * Format a response for Slack
   * @param {Object} response - Response from the chatbot
   * @param {Object} originalMessage - Original message from Slack
   * @returns {Promise<Object>} Formatted response
   */
  async formatResponse(response, originalMessage) {
    // Basic text response
    const slackResponse = {
      channel: originalMessage.channel || originalMessage.metadata?.channel,
      text: response.text || response.content,
      thread_ts: originalMessage.thread_ts || originalMessage.ts
    };
    
    // Add blocks if available
    if (response.blocks) {
      slackResponse.blocks = response.blocks;
    } 
    // Otherwise, create simple blocks from text
    else if (slackResponse.text) {
      slackResponse.blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: slackResponse.text
          }
        }
      ];
    }
    
    // Add attachments if available
    if (response.attachments) {
      slackResponse.attachments = response.attachments;
    }
    
    return slackResponse;
  }

  /**
   * Send a response to Slack
   * @param {Object} integration - Integration object
   * @param {Object} response - Formatted response
   * @param {Object} originalMessage - Original message from Slack
   * @returns {Promise<void>}
   */
  async sendResponse(integration, response, originalMessage) {
    try {
      const app = this.apps.get(integration._id.toString());
      if (!app) {
        throw new Error(`Slack app not found for integration ${integration._id}`);
      }
      
      // Send message to Slack
      await app.client.chat.postMessage(response);
      
      // Update stats
      await integration.recordMessageSent();
      
      logger.debug(`Response sent to Slack: ${response.channel}`);
    } catch (error) {
      logger.error(`Error sending response to Slack:`, error.message);
      throw error;
    }
  }

  /**
   * Get Express router for Slack integrations
   * @returns {Object} Express router
   */
  getRouter() {
    const express = require('express');
    const router = express.Router();
    
    // Add middleware to route requests to the appropriate receiver
    router.use('/slack/:integrationId', async (req, res, next) => {
      try {
        const integrationId = req.params.integrationId;
        const receiver = this.expressReceivers.get(integrationId);
        
        if (!receiver) {
          logger.warn(`Slack receiver not found for integration ${integrationId}`);
          return res.status(404).json({ error: 'Integration not found' });
        }
        
        // Pass request to the receiver
        receiver.app(req, res);
      } catch (error) {
        logger.error('Error routing Slack request:', error.message);
        next(error);
      }
    });
    
    return router;
  }

  /**
   * Register event listeners for Slack app
   * @param {Object} app - Slack app instance
   * @param {Object} integration - Integration object
   * @private
   */
  _registerEventListeners(app, integration) {
    // Listen for message events
    app.event('message', async ({ event, context }) => {
      try {
        // Ignore messages from the bot itself
        if (event.bot_id || (integration.metadata.botUserId && event.user === integration.metadata.botUserId)) {
          return;
        }
        
        // Update stats
        await integration.recordMessageReceived();
        
        // Process message with integration service
        require('@src/integrations\integration.service');
        await integrationService.processMessage(integration, event);
      } catch (error) {
        logger.error(`Error handling Slack message event:`, error.message);
      }
    });
    
    // Listen for app_mention events
    app.event('app_mention', async ({ event, context }) => {
      try {
        // Update stats
        await integration.recordMessageReceived();
        
        // Process message with integration service
        require('@src/integrations\integration.service');
        await integrationService.processMessage(integration, event);
      } catch (error) {
        logger.error(`Error handling Slack app_mention event:`, error.message);
      }
    });
    
    // Listen for direct_message events
    app.event('message.im', async ({ event, context }) => {
      try {
        // Ignore messages from the bot itself
        if (event.bot_id || (integration.metadata.botUserId && event.user === integration.metadata.botUserId)) {
          return;
        }
        
        // Update stats
        await integration.recordMessageReceived();
        
        // Process message with integration service
        require('@src/integrations\integration.service');
        await integrationService.processMessage(integration, event);
      } catch (error) {
        logger.error(`Error handling Slack direct_message event:`, error.message);
      }
    });
    
    // Listen for slash commands
    app.command(integration.config.slashCommand || '/chatbot', async ({ command, ack, respond }) => {
      try {
        // Acknowledge command
        await ack();
        
        // Update stats
        await integration.recordMessageReceived();
        
        // Process command with integration service
        require('@src/integrations\integration.service');
        await integrationService.processMessage(integration, {
          ...command,
          text: command.text,
          user: command.user_id,
          channel: command.channel_id,
          team: command.team_id,
          isCommand: true
        });
      } catch (error) {
        logger.error(`Error handling Slack command:`, error.message);
        await respond({
          text: `Error processing command: ${error.message}`
        });
      }
    });
  }
}

module.exports = SlackIntegrationService;
