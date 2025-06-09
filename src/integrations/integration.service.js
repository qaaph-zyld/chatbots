/**
 * Integration Service
 * 
 * Manages integrations with external platforms and services
 */

const mongoose = require('mongoose');
require('@src/utils');
require('@src/models\integration.model');
require('@src/bot\core');

class IntegrationService {
  /**
   * Get all integrations
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of integrations
   */
  async getAllIntegrations(filter = {}, options = {}) {
    try {
      return await Integration.find(filter, null, options);
    } catch (error) {
      logger.error('Error getting integrations:', error.message);
      throw error;
    }
  }

  /**
   * Get integration by ID
   * @param {string} integrationId - Integration ID
   * @returns {Promise<Object>} Integration object
   */
  async getIntegrationById(integrationId) {
    try {
      const integration = await Integration.findById(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }
      return integration;
    } catch (error) {
      logger.error(`Error getting integration ${integrationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get integrations by chatbot ID
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array>} List of integrations for the chatbot
   */
  async getIntegrationsByChatbotId(chatbotId) {
    try {
      return await Integration.find({ chatbotId });
    } catch (error) {
      logger.error(`Error getting integrations for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a new integration
   * @param {Object} integrationData - Integration data
   * @returns {Promise<Object>} Created integration
   */
  async createIntegration(integrationData) {
    try {
      // Validate integration data
      this._validateIntegrationData(integrationData);
      
      // Create integration
      const integration = new Integration(integrationData);
      await integration.save();
      
      // Initialize integration
      await this.initializeIntegration(integration);
      
      return integration;
    } catch (error) {
      logger.error('Error creating integration:', error.message);
      throw error;
    }
  }

  /**
   * Update an integration
   * @param {string} integrationId - Integration ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated integration
   */
  async updateIntegration(integrationId, updateData) {
    try {
      const integration = await Integration.findById(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }
      
      // Update integration
      Object.assign(integration, updateData);
      await integration.save();
      
      // Reinitialize integration if necessary
      if (updateData.config || updateData.status === 'active') {
        await this.initializeIntegration(integration);
      }
      
      return integration;
    } catch (error) {
      logger.error(`Error updating integration ${integrationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Delete an integration
   * @param {string} integrationId - Integration ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteIntegration(integrationId) {
    try {
      const integration = await Integration.findById(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }
      
      // Deactivate integration
      await this.deactivateIntegration(integration);
      
      // Delete integration
      await Integration.findByIdAndDelete(integrationId);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting integration ${integrationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Activate an integration
   * @param {string} integrationId - Integration ID
   * @returns {Promise<Object>} Activated integration
   */
  async activateIntegration(integrationId) {
    try {
      const integration = await Integration.findById(integrationId);
      if (!integration) {
        throw new Error('Integration not found');
      }
      
      // Update status
      integration.status = 'active';
      await integration.save();
      
      // Initialize integration
      await this.initializeIntegration(integration);
      
      return integration;
    } catch (error) {
      logger.error(`Error activating integration ${integrationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Deactivate an integration
   * @param {Object|string} integration - Integration object or ID
   * @returns {Promise<Object>} Deactivated integration
   */
  async deactivateIntegration(integration) {
    try {
      // Get integration if ID is provided
      if (typeof integration === 'string') {
        integration = await Integration.findById(integration);
        if (!integration) {
          throw new Error('Integration not found');
        }
      }
      
      // Update status
      integration.status = 'inactive';
      await integration.save();
      
      // Get platform-specific integration service
      const integrationService = this._getPlatformService(integration.platform);
      if (integrationService && typeof integrationService.deactivate === 'function') {
        await integrationService.deactivate(integration);
      }
      
      return integration;
    } catch (error) {
      const id = typeof integration === 'string' ? integration : integration._id;
      logger.error(`Error deactivating integration ${id}:`, error.message);
      throw error;
    }
  }

  /**
   * Initialize an integration
   * @param {Object} integration - Integration object
   * @returns {Promise<void>}
   */
  async initializeIntegration(integration) {
    try {
      // Skip if integration is not active
      if (integration.status !== 'active') {
        return;
      }
      
      // Get platform-specific integration service
      const integrationService = this._getPlatformService(integration.platform);
      if (!integrationService) {
        throw new Error(`Unsupported platform: ${integration.platform}`);
      }
      
      // Initialize integration
      if (typeof integrationService.initialize === 'function') {
        await integrationService.initialize(integration);
      }
      
      logger.info(`Integration ${integration._id} (${integration.platform}) initialized`);
    } catch (error) {
      logger.error(`Error initializing integration ${integration._id}:`, error.message);
      
      // Update integration status to error
      integration.status = 'error';
      integration.lastError = error.message;
      await integration.save();
      
      throw error;
    }
  }

  /**
   * Process a message from an integration
   * @param {Object} integration - Integration object
   * @param {Object} message - Message object
   * @returns {Promise<Object>} Processed message
   */
  async processMessage(integration, message) {
    try {
      // Get platform-specific integration service
      const integrationService = this._getPlatformService(integration.platform);
      if (!integrationService) {
        throw new Error(`Unsupported platform: ${integration.platform}`);
      }
      
      // Normalize message
      const normalizedMessage = await integrationService.normalizeMessage(message);
      
      // Process message with chatbot
      const response = await chatbotService.processMessage(
        integration.chatbotId,
        normalizedMessage.userId,
        normalizedMessage.text,
        {
          platform: integration.platform,
          integrationId: integration._id,
          originalMessage: message
        }
      );
      
      // Format response for platform
      const formattedResponse = await integrationService.formatResponse(response, message);
      
      // Send response
      await integrationService.sendResponse(integration, formattedResponse, message);
      
      return formattedResponse;
    } catch (error) {
      logger.error(`Error processing message for integration ${integration._id}:`, error.message);
      throw error;
    }
  }

  /**
   * Get platform-specific integration service
   * @param {string} platform - Platform name
   * @returns {Object|null} Platform-specific integration service
   * @private
   */
  _getPlatformService(platform) {
    try {
      // Dynamically import platform-specific service
      const PlatformService = require(`./${platform}.service`);
      return new PlatformService();
    } catch (error) {
      logger.error(`Error loading integration service for platform ${platform}:`, error.message);
      return null;
    }
  }

  /**
   * Validate integration data
   * @param {Object} data - Integration data
   * @throws {Error} If validation fails
   * @private
   */
  _validateIntegrationData(data) {
    // Required fields
    const requiredFields = ['name', 'platform', 'chatbotId', 'config'];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate platform
    const supportedPlatforms = ['web', 'slack', 'telegram', 'whatsapp', 'facebook', 'discord', 'twilio'];
    if (!supportedPlatforms.includes(data.platform)) {
      throw new Error(`Unsupported platform: ${data.platform}`);
    }
    
    // Validate config based on platform
    this._validatePlatformConfig(data.platform, data.config);
  }

  /**
   * Validate platform-specific configuration
   * @param {string} platform - Platform name
   * @param {Object} config - Platform configuration
   * @throws {Error} If validation fails
   * @private
   */
  _validatePlatformConfig(platform, config) {
    switch (platform) {
      case 'web':
        if (!config.allowedOrigins) {
          throw new Error('Web integration requires allowedOrigins in config');
        }
        break;
      case 'slack':
        if (!config.botToken || !config.signingSecret) {
          throw new Error('Slack integration requires botToken and signingSecret in config');
        }
        break;
      case 'telegram':
        if (!config.botToken) {
          throw new Error('Telegram integration requires botToken in config');
        }
        break;
      case 'whatsapp':
        if (!config.accountSid || !config.authToken || !config.phoneNumber) {
          throw new Error('WhatsApp integration requires accountSid, authToken, and phoneNumber in config');
        }
        break;
      case 'facebook':
        if (!config.pageToken || !config.appSecret || !config.verifyToken) {
          throw new Error('Facebook integration requires pageToken, appSecret, and verifyToken in config');
        }
        break;
      case 'discord':
        if (!config.botToken || !config.clientId) {
          throw new Error('Discord integration requires botToken and clientId in config');
        }
        break;
      case 'twilio':
        if (!config.accountSid || !config.authToken || !config.phoneNumber) {
          throw new Error('Twilio integration requires accountSid, authToken, and phoneNumber in config');
        }
        break;
      default:
        // No validation for unknown platforms
        break;
    }
  }
}

module.exports = new IntegrationService();
