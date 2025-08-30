/**
 * Conversation Analytics Integration Service
 * 
 * This service provides integration with external analytics tools
 * such as Matomo, Plausible, or custom analytics endpoints.
 */

const axios = require('axios');
require('@src/utils');

/**
 * Conversation Analytics Integration Service class
 */
class ConversationAnalyticsIntegrationService {
  /**
   * Initialize the conversation analytics integration service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      enabled: process.env.ENABLE_EXTERNAL_ANALYTICS === 'true' || false,
      provider: process.env.EXTERNAL_ANALYTICS_PROVIDER || 'matomo',
      endpoint: process.env.EXTERNAL_ANALYTICS_ENDPOINT || '',
      siteId: process.env.EXTERNAL_ANALYTICS_SITE_ID || '1',
      apiKey: process.env.EXTERNAL_ANALYTICS_API_KEY || '',
      batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '10'),
      sendInterval: parseInt(process.env.ANALYTICS_SEND_INTERVAL || '60000'), // ms
      ...options
    };

    // Queue for analytics events
    this.eventQueue = [];
    
    // Timer for batch sending
    this.sendTimer = null;
    
    // Initialize if enabled
    if (this.options.enabled) {
      this._initialize();
    }

    logger.info('Conversation Analytics Integration Service initialized with provider:', this.options.provider);
  }

  /**
   * Initialize the integration service
   * @private
   */
  _initialize() {
    // Validate configuration
    if (!this.options.endpoint) {
      logger.warn('External analytics endpoint not configured. Integration disabled.');
      this.options.enabled = false;
      return;
    }

    // Start timer for batch sending
    this.sendTimer = setInterval(() => {
      this._processBatch();
    }, this.options.sendInterval);

    logger.info('Analytics integration initialized with endpoint:', this.options.endpoint);
  }

  /**
   * Track a conversation event
   * @param {Object} event - Event data
   * @returns {Promise<boolean>} - Success status
   */
  async trackEvent(event) {
    try {
      if (!this.options.enabled) {
        return false;
      }

      // Validate event data
      if (!event || !event.type) {
        logger.warn('Invalid event data for tracking:', event);
        return false;
      }

      // Add to queue
      this.eventQueue.push({
        ...event,
        timestamp: event.timestamp || new Date().toISOString()
      });

      // Process batch if queue is full
      if (this.eventQueue.length >= this.options.batchSize) {
        await this._processBatch();
      }

      return true;
    } catch (error) {
      logger.error('Error tracking event:', error.message);
      return false;
    }
  }

  /**
   * Process a batch of events
   * @returns {Promise<boolean>} - Success status
   * @private
   */
  async _processBatch() {
    try {
      if (this.eventQueue.length === 0) {
        return true;
      }

      // Get events to process
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // Send to appropriate provider
      let success = false;
      
      switch (this.options.provider.toLowerCase()) {
        case 'matomo':
          success = await this._sendToMatomo(events);
          break;
        case 'plausible':
          success = await this._sendToPlausible(events);
          break;
        case 'custom':
          success = await this._sendToCustomEndpoint(events);
          break;
        default:
          logger.warn(`Unknown analytics provider: ${this.options.provider}`);
          return false;
      }

      if (!success) {
        // Put events back in queue if send failed
        this.eventQueue = [...events, ...this.eventQueue];
        
        // Limit queue size to prevent memory issues
        if (this.eventQueue.length > this.options.batchSize * 5) {
          this.eventQueue = this.eventQueue.slice(-this.options.batchSize * 5);
          logger.warn('Analytics event queue truncated to prevent memory issues');
        }
      }

      return success;
    } catch (error) {
      logger.error('Error processing analytics batch:', error.message);
      return false;
    }
  }

  /**
   * Send events to Matomo
   * @param {Array} events - Events to send
   * @returns {Promise<boolean>} - Success status
   * @private
   */
  async _sendToMatomo(events) {
    try {
      const endpoint = this.options.endpoint;
      const siteId = this.options.siteId;
      const apiKey = this.options.apiKey;

      // Format events for Matomo
      const formattedEvents = events.map(event => {
        // Map event types to Matomo event categories
        const category = this._mapEventTypeToCategory(event.type);
        
        return {
          idsite: siteId,
          rec: 1,
          action: event.action || event.type,
          category,
          name: event.name || '',
          value: event.value || '',
          cdt: event.timestamp,
          _id: event.userId || event.sessionId || '',
          uid: event.userId || '',
          e_c: category,
          e_a: event.action || event.type,
          e_n: event.name || '',
          e_v: event.value || ''
        };
      });

      // Send to Matomo
      const requests = formattedEvents.map(params => {
        const url = new URL(endpoint);
        
        // Add parameters to URL
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, value);
          }
        });
        
        // Add API key if provided
        if (apiKey) {
          url.searchParams.append('token_auth', apiKey);
        }
        
        return axios.get(url.toString(), {
          headers: {
            'User-Agent': 'Chatbot-Analytics-Integration/1.0'
          }
        });
      });

      await Promise.all(requests);
      logger.debug(`Sent ${events.length} events to Matomo`);
      
      return true;
    } catch (error) {
      logger.error('Error sending events to Matomo:', error.message);
      return false;
    }
  }

  /**
   * Send events to Plausible
   * @param {Array} events - Events to send
   * @returns {Promise<boolean>} - Success status
   * @private
   */
  async _sendToPlausible(events) {
    try {
      const endpoint = this.options.endpoint;
      const domain = this.options.siteId;
      const apiKey = this.options.apiKey;

      // Format events for Plausible
      const formattedEvents = events.map(event => {
        return {
          domain,
          name: event.action || event.type,
          url: event.url || `https://${domain}/bot`,
          props: {
            type: event.type,
            category: this._mapEventTypeToCategory(event.type),
            value: event.value || '',
            userId: event.userId || '',
            sessionId: event.sessionId || ''
          }
        };
      });

      // Send to Plausible
      const requests = formattedEvents.map(eventData => {
        return axios.post(endpoint, eventData, {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Chatbot-Analytics-Integration/1.0',
            'X-API-Key': apiKey
          }
        });
      });

      await Promise.all(requests);
      logger.debug(`Sent ${events.length} events to Plausible`);
      
      return true;
    } catch (error) {
      logger.error('Error sending events to Plausible:', error.message);
      return false;
    }
  }

  /**
   * Send events to custom endpoint
   * @param {Array} events - Events to send
   * @returns {Promise<boolean>} - Success status
   * @private
   */
  async _sendToCustomEndpoint(events) {
    try {
      const endpoint = this.options.endpoint;
      const apiKey = this.options.apiKey;

      // Send to custom endpoint
      await axios.post(endpoint, { events }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey ? `Bearer ${apiKey}` : undefined
        }
      });

      logger.debug(`Sent ${events.length} events to custom endpoint`);
      
      return true;
    } catch (error) {
      logger.error('Error sending events to custom endpoint:', error.message);
      return false;
    }
  }

  /**
   * Map event type to category
   * @param {string} eventType - Event type
   * @returns {string} - Event category
   * @private
   */
  _mapEventTypeToCategory(eventType) {
    const typeToCategory = {
      'conversation_start': 'Conversation',
      'conversation_end': 'Conversation',
      'message_sent': 'Message',
      'message_received': 'Message',
      'intent_detected': 'NLP',
      'entity_detected': 'NLP',
      'sentiment_analyzed': 'NLP',
      'error': 'Error',
      'fallback': 'Error'
    };

    return typeToCategory[eventType] || 'Other';
  }

  /**
   * Track a conversation start
   * @param {Object} conversation - Conversation data
   * @returns {Promise<boolean>} - Success status
   */
  async trackConversationStart(conversation) {
    return this.trackEvent({
      type: 'conversation_start',
      action: 'start',
      userId: conversation.userId,
      sessionId: conversation.id,
      value: 1
    });
  }

  /**
   * Track a conversation end
   * @param {Object} conversation - Conversation data
   * @returns {Promise<boolean>} - Success status
   */
  async trackConversationEnd(conversation) {
    return this.trackEvent({
      type: 'conversation_end',
      action: 'end',
      userId: conversation.userId,
      sessionId: conversation.id,
      value: conversation.messages.length
    });
  }

  /**
   * Track a message
   * @param {Object} message - Message data
   * @param {Object} conversation - Conversation data
   * @returns {Promise<boolean>} - Success status
   */
  async trackMessage(message, conversation) {
    return this.trackEvent({
      type: message.role === 'user' ? 'message_sent' : 'message_received',
      action: message.role === 'user' ? 'user_message' : 'bot_message',
      userId: conversation.userId,
      sessionId: conversation.id,
      value: message.content.length,
      timestamp: message.timestamp
    });
  }

  /**
   * Track an intent detection
   * @param {Object} intent - Intent data
   * @param {Object} conversation - Conversation data
   * @returns {Promise<boolean>} - Success status
   */
  async trackIntent(intent, conversation) {
    return this.trackEvent({
      type: 'intent_detected',
      action: 'detect_intent',
      name: intent.name,
      userId: conversation.userId,
      sessionId: conversation.id,
      value: intent.confidence || 1
    });
  }

  /**
   * Get dashboard URL for external analytics
   * @param {Object} options - Options
   * @returns {string|null} - Dashboard URL or null if not available
   */
  getDashboardUrl(options = {}) {
    if (!this.options.enabled) {
      return null;
    }

    try {
      const provider = this.options.provider.toLowerCase();
      
      if (provider === 'matomo') {
        const baseUrl = this.options.endpoint.replace(/\/piwik\.php$|\/matomo\.php$/, '');
        const siteId = options.siteId || this.options.siteId;
        
        return `${baseUrl}/index.php?module=CoreHome&action=index&idSite=${siteId}&period=day&date=yesterday`;
      } else if (provider === 'plausible') {
        const baseUrl = 'https://plausible.io';
        const site = options.domain || this.options.siteId;
        
        return `${baseUrl}/${site}`;
      }
      
      return null;
    } catch (error) {
      logger.error('Error generating dashboard URL:', error.message);
      return null;
    }
  }
}

// Create and export service instance
const analyticsIntegrationService = new ConversationAnalyticsIntegrationService();

module.exports = {
  ConversationAnalyticsIntegrationService,
  analyticsIntegrationService
};
