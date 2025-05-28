/**
 * Integration Manager
 * 
 * Manages integration instances and WebSocket connections
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const { logger } = require('../utils');
const Integration = require('../models/integration.model');
const integrationService = require('./integration.service');

class IntegrationManager {
  constructor() {
    this.wss = null; // WebSocket server
    this.integrations = new Map(); // Map of active integrations by ID
    this.platformServices = new Map(); // Map of platform services by platform name
  }

  /**
   * Initialize the integration manager
   * @param {Object} server - HTTP server instance
   * @returns {Promise<void>}
   */
  async initialize(server) {
    try {
      logger.info('Initializing integration manager');
      
      // Create WebSocket server
      this.wss = new WebSocket.Server({ 
        server,
        path: '/integrations/ws'
      });
      
      // Handle WebSocket connections
      this.wss.on('connection', this._handleWebSocketConnection.bind(this));
      
      // Load active integrations
      await this._loadActiveIntegrations();
      
      logger.info('Integration manager initialized successfully');
    } catch (error) {
      logger.error('Error initializing integration manager:', error.message);
      throw error;
    }
  }

  /**
   * Get Express router for integrations
   * @returns {Object} Express router
   */
  getRouter() {
    const router = express.Router();
    
    // Add routes for each platform
    for (const [platform, service] of this.platformServices.entries()) {
      if (typeof service.getRouter === 'function') {
        router.use(`/${platform}`, service.getRouter());
      }
    }
    
    return router;
  }

  /**
   * Handle a new WebSocket connection
   * @param {Object} ws - WebSocket connection
   * @param {Object} req - HTTP request
   * @private
   */
  async _handleWebSocketConnection(ws, req) {
    try {
      // Get integration ID from query parameters
      const integrationId = req.url.split('?')[1]?.split('=')[1];
      
      if (!integrationId) {
        logger.warn('WebSocket connection attempt without integration ID');
        ws.close(1008, 'Integration ID is required');
        return;
      }
      
      // Get integration
      const integration = await Integration.findById(integrationId);
      
      if (!integration) {
        logger.warn(`Integration not found: ${integrationId}`);
        ws.close(1008, 'Integration not found');
        return;
      }
      
      // Check if integration is active
      if (integration.status !== 'active') {
        logger.warn(`Integration is not active: ${integrationId}`);
        ws.close(1008, 'Integration is not active');
        return;
      }
      
      // Check if integration platform is web
      if (integration.platform !== 'web') {
        logger.warn(`Integration platform is not web: ${integrationId}`);
        ws.close(1008, 'Integration platform is not web');
        return;
      }
      
      // Get web integration service
      const webService = this.platformServices.get('web');
      
      if (!webService) {
        logger.warn('Web integration service not found');
        ws.close(1008, 'Web integration service not found');
        return;
      }
      
      // Handle connection with web integration service
      webService.handleConnection(ws, req, integration);
      
      logger.info(`WebSocket connection established for integration: ${integrationId}`);
    } catch (error) {
      logger.error('Error handling WebSocket connection:', error.message);
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Load active integrations
   * @returns {Promise<void>}
   * @private
   */
  async _loadActiveIntegrations() {
    try {
      logger.info('Loading active integrations');
      
      // Get all active integrations
      const integrations = await Integration.find({ status: 'active' });
      
      logger.info(`Found ${integrations.length} active integrations`);
      
      // Initialize each integration
      for (const integration of integrations) {
        await this._initializeIntegration(integration);
      }
    } catch (error) {
      logger.error('Error loading active integrations:', error.message);
      throw error;
    }
  }

  /**
   * Initialize an integration
   * @param {Object} integration - Integration object
   * @returns {Promise<void>}
   * @private
   */
  async _initializeIntegration(integration) {
    try {
      // Get platform service
      let platformService = this.platformServices.get(integration.platform);
      
      // If platform service doesn't exist, create it
      if (!platformService) {
        try {
          const PlatformService = require(`./${integration.platform}.service`);
          platformService = new PlatformService();
          this.platformServices.set(integration.platform, platformService);
        } catch (error) {
          logger.error(`Error loading platform service for ${integration.platform}:`, error.message);
          return;
        }
      }
      
      // Initialize integration
      await integrationService.initializeIntegration(integration);
      
      // Store integration
      this.integrations.set(integration._id.toString(), integration);
      
      logger.info(`Integration ${integration._id} (${integration.platform}) initialized`);
    } catch (error) {
      logger.error(`Error initializing integration ${integration._id}:`, error.message);
    }
  }
}

module.exports = new IntegrationManager();
