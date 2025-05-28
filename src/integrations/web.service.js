/**
 * Web Integration Service
 * 
 * Handles integration with web applications via WebSocket and REST API
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils');
const Integration = require('../models/integration.model');

class WebIntegrationService {
  constructor() {
    this.connections = new Map(); // Map of active WebSocket connections
    this.wss = null; // WebSocket server
  }

  /**
   * Initialize the web integration
   * @param {Object} integration - Integration object
   * @returns {Promise<void>}
   */
  async initialize(integration) {
    try {
      logger.info(`Initializing web integration: ${integration._id}`);
      
      // Store integration metadata
      if (!integration.metadata.clientId) {
        integration.metadata.clientId = uuidv4();
        await integration.save();
      }
      
      // Update integration status
      if (integration.status !== 'active') {
        integration.status = 'active';
        await integration.save();
      }
      
      logger.info(`Web integration ${integration._id} initialized successfully`);
    } catch (error) {
      logger.error(`Error initializing web integration ${integration._id}:`, error.message);
      throw error;
    }
  }

  /**
   * Deactivate the web integration
   * @param {Object} integration - Integration object
   * @returns {Promise<void>}
   */
  async deactivate(integration) {
    try {
      logger.info(`Deactivating web integration: ${integration._id}`);
      
      // Close all connections for this integration
      const clientId = integration.metadata.clientId;
      if (clientId) {
        this.closeConnectionsByIntegration(clientId);
      }
      
      logger.info(`Web integration ${integration._id} deactivated successfully`);
    } catch (error) {
      logger.error(`Error deactivating web integration ${integration._id}:`, error.message);
      throw error;
    }
  }

  /**
   * Normalize a message from the web integration
   * @param {Object} message - Message from the web client
   * @returns {Promise<Object>} Normalized message
   */
  async normalizeMessage(message) {
    return {
      userId: message.userId || message.sessionId || 'anonymous',
      text: message.text || message.content || '',
      timestamp: message.timestamp || new Date(),
      metadata: message.metadata || {}
    };
  }

  /**
   * Format a response for the web integration
   * @param {Object} response - Response from the chatbot
   * @param {Object} originalMessage - Original message from the web client
   * @returns {Promise<Object>} Formatted response
   */
  async formatResponse(response, originalMessage) {
    return {
      type: 'text',
      content: response.text || response.content,
      timestamp: new Date(),
      sessionId: originalMessage.sessionId || originalMessage.userId,
      messageId: uuidv4(),
      metadata: response.metadata || {}
    };
  }

  /**
   * Send a response to the web client
   * @param {Object} integration - Integration object
   * @param {Object} response - Formatted response
   * @param {Object} originalMessage - Original message from the web client
   * @returns {Promise<void>}
   */
  async sendResponse(integration, response, originalMessage) {
    try {
      const sessionId = originalMessage.sessionId || originalMessage.userId;
      
      // If this is a WebSocket message
      if (originalMessage.connectionId && this.connections.has(originalMessage.connectionId)) {
        const ws = this.connections.get(originalMessage.connectionId);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(response));
          
          // Update stats
          await integration.recordMessageSent();
          
          logger.debug(`Response sent to web client via WebSocket: ${sessionId}`);
        } else {
          logger.warn(`WebSocket not open for connection: ${originalMessage.connectionId}`);
        }
      } 
      // If this is a REST API message
      else if (originalMessage.callbackUrl) {
        // Send response to callback URL
        await this._sendHttpResponse(originalMessage.callbackUrl, response);
        
        // Update stats
        await integration.recordMessageSent();
        
        logger.debug(`Response sent to web client via HTTP: ${sessionId}`);
      } else {
        logger.warn(`No way to send response to web client: ${sessionId}`);
      }
    } catch (error) {
      logger.error(`Error sending response to web client:`, error.message);
      throw error;
    }
  }

  /**
   * Handle a new WebSocket connection
   * @param {Object} ws - WebSocket connection
   * @param {Object} req - HTTP request
   * @param {Object} integration - Integration object
   */
  handleConnection(ws, req, integration) {
    try {
      // Generate connection ID
      const connectionId = uuidv4();
      
      // Store connection
      this.connections.set(connectionId, ws);
      
      // Set connection properties
      ws.connectionId = connectionId;
      ws.integrationId = integration._id;
      ws.clientId = integration.metadata.clientId;
      ws.sessionId = req.query.sessionId || uuidv4();
      ws.userId = req.query.userId || ws.sessionId;
      
      logger.info(`New WebSocket connection: ${connectionId} (Integration: ${integration._id})`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        connectionId,
        sessionId: ws.sessionId,
        timestamp: new Date()
      }));
      
      // Handle messages
      ws.on('message', async (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          
          // Add connection info to message
          parsedMessage.connectionId = connectionId;
          parsedMessage.sessionId = ws.sessionId;
          parsedMessage.userId = ws.userId;
          
          // Process message
          await this.handleWebSocketMessage(parsedMessage, ws, integration);
        } catch (error) {
          logger.error(`Error handling WebSocket message:`, error.message);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Error processing message',
            timestamp: new Date()
          }));
        }
      });
      
      // Handle close
      ws.on('close', () => {
        this.connections.delete(connectionId);
        logger.info(`WebSocket connection closed: ${connectionId}`);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        logger.error(`WebSocket error for connection ${connectionId}:`, error.message);
        this.connections.delete(connectionId);
      });
    } catch (error) {
      logger.error(`Error handling WebSocket connection:`, error.message);
      ws.close();
    }
  }

  /**
   * Handle a WebSocket message
   * @param {Object} message - Message from the web client
   * @param {Object} ws - WebSocket connection
   * @param {Object} integration - Integration object
   * @returns {Promise<void>}
   */
  async handleWebSocketMessage(message, ws, integration) {
    try {
      // Validate message
      if (!message.text && !message.content) {
        throw new Error('Message must contain text or content');
      }
      
      // Update stats
      await integration.recordMessageReceived();
      
      // Process message with integration service
      const integrationService = require('./integration.service');
      await integrationService.processMessage(integration, message);
    } catch (error) {
      logger.error(`Error handling WebSocket message:`, error.message);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing message',
        timestamp: new Date()
      }));
    }
  }

  /**
   * Handle a REST API message
   * @param {Object} message - Message from the web client
   * @param {Object} integration - Integration object
   * @returns {Promise<Object>} Response
   */
  async handleHttpMessage(message, integration) {
    try {
      // Validate message
      if (!message.text && !message.content) {
        throw new Error('Message must contain text or content');
      }
      
      // Validate origin if allowed origins are specified
      if (integration.config.allowedOrigins && integration.config.allowedOrigins.length > 0) {
        const origin = message.origin || '';
        if (!integration.config.allowedOrigins.includes('*') && 
            !integration.config.allowedOrigins.includes(origin)) {
          throw new Error(`Origin not allowed: ${origin}`);
        }
      }
      
      // Update stats
      await integration.recordMessageReceived();
      
      // Process message with integration service
      const integrationService = require('./integration.service');
      return await integrationService.processMessage(integration, message);
    } catch (error) {
      logger.error(`Error handling HTTP message:`, error.message);
      throw error;
    }
  }

  /**
   * Close WebSocket connections by integration
   * @param {string} clientId - Client ID
   */
  closeConnectionsByIntegration(clientId) {
    let count = 0;
    
    // Close all connections for this integration
    for (const [connectionId, ws] of this.connections.entries()) {
      if (ws.clientId === clientId) {
        ws.close();
        this.connections.delete(connectionId);
        count++;
      }
    }
    
    logger.info(`Closed ${count} WebSocket connections for client ${clientId}`);
  }

  /**
   * Send HTTP response to callback URL
   * @param {string} url - Callback URL
   * @param {Object} response - Response data
   * @returns {Promise<void>}
   * @private
   */
  async _sendHttpResponse(url, response) {
    try {
      const fetch = require('node-fetch');
      
      const result = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(response)
      });
      
      if (!result.ok) {
        throw new Error(`HTTP error: ${result.status} ${result.statusText}`);
      }
    } catch (error) {
      logger.error(`Error sending HTTP response to ${url}:`, error.message);
      throw error;
    }
  }
}

module.exports = WebIntegrationService;
