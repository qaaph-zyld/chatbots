/**
 * Integration Manager
 * 
 * Manages integration channels and provides a unified interface
 */

const WebChannel = require('./channels/web.channel');

// Map of channel types to their implementations
const channelTypes = {
  web: WebChannel
};

/**
 * Create a new channel instance
 * @param {string} type - Channel type
 * @param {Object} config - Channel configuration
 * @returns {BaseChannel} - Channel instance
 */
function createChannel(type, config = {}) {
  const ChannelClass = channelTypes[type.toLowerCase()];
  
  if (!ChannelClass) {
    throw new Error(`Unknown channel type: ${type}`);
  }
  
  return new ChannelClass(config);
}

/**
 * Get available channel types
 * @returns {Array<string>} - Array of available channel types
 */
function getAvailableChannels() {
  return Object.keys(channelTypes);
}

class IntegrationManager {
  constructor() {
    this.channels = new Map();
    this.messageHandlers = new Map();
  }
  
  /**
   * Register a channel
   * @param {string} name - Channel name
   * @param {BaseChannel} channel - Channel instance
   * @returns {IntegrationManager} - This instance for chaining
   */
  registerChannel(name, channel) {
    this.channels.set(name, channel);
    
    // Set up message handler for the channel
    channel.onMessage(message => this.handleMessage(name, message));
    
    return this;
  }
  
  /**
   * Initialize all channels
   * @returns {Promise<boolean>} - True if all channels were initialized successfully
   */
  async initialize() {
    try {
      const initPromises = Array.from(this.channels.entries()).map(
        async ([name, channel]) => {
          const success = await channel.initialize();
          console.log(`Initialized channel '${name}': ${success ? 'success' : 'failed'}`);
          return { name, success };
        }
      );
      
      const results = await Promise.all(initPromises);
      const allSucceeded = results.every(result => result.success);
      
      return allSucceeded;
    } catch (error) {
      console.error('Error initializing channels:', error);
      return false;
    }
  }
  
  /**
   * Send a message through a specific channel
   * @param {string} channelName - Channel name
   * @param {Object} message - Message to send
   * @param {Object} recipient - Recipient information
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Send result
   */
  async sendMessage(channelName, message, recipient, options = {}) {
    const channel = this.channels.get(channelName);
    
    if (!channel) {
      throw new Error(`Channel '${channelName}' not found`);
    }
    
    return channel.sendMessage(message, recipient, options);
  }
  
  /**
   * Handle incoming message from a channel
   * @param {string} channelName - Channel name
   * @param {Object} message - Incoming message
   * @returns {Promise<Object>} - Handler result
   */
  async handleMessage(channelName, message) {
    try {
      console.log(`Received message from channel '${channelName}':`, message);
      
      // Find handlers for this channel
      const handlers = this.messageHandlers.get(channelName) || [];
      
      // Execute all handlers
      const results = await Promise.all(
        handlers.map(handler => handler(message, channelName))
      );
      
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error(`Error handling message from channel '${channelName}':`, error);
      throw error;
    }
  }
  
  /**
   * Register a message handler for a specific channel
   * @param {string} channelName - Channel name
   * @param {Function} handler - Message handler function
   * @returns {IntegrationManager} - This instance for chaining
   */
  onMessage(channelName, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Message handler must be a function');
    }
    
    if (!this.messageHandlers.has(channelName)) {
      this.messageHandlers.set(channelName, []);
    }
    
    this.messageHandlers.get(channelName).push(handler);
    return this;
  }
  
  /**
   * Get the status of all channels
   * @returns {Object} - Status of all channels
   */
  getStatus() {
    const status = {};
    
    this.channels.forEach((channel, name) => {
      status[name] = channel.getStatus();
    });
    
    return {
      channels: status,
      handlerCount: Array.from(this.messageHandlers.entries()).reduce(
        (count, [_, handlers]) => count + handlers.length, 
        0
      )
    };
  }
  
  /**
   * Clean up all channels
   * @returns {Promise<void>}
   */
  async cleanup() {
    const cleanupPromises = Array.from(this.channels.values()).map(
      channel => channel.cleanup()
    );
    
    await Promise.all(cleanupPromises);
    this.channels.clear();
    this.messageHandlers.clear();
  }
}

// Create singleton instance
const integrationManager = new IntegrationManager();

// Register default channels
const webChannel = createChannel('web', { port: 3001 });
integrationManager.registerChannel('web', webChannel);

module.exports = {
  integrationManager,
  createChannel,
  getAvailableChannels,
  // Export channel classes for direct use if needed
  WebChannel
};
