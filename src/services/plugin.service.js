/**
 * Plugin Service
 * 
 * Handles CRUD operations for plugins and plugin instances
 */

const fs = require('fs');
const path = require('path');
const Plugin = require('../database/schemas/plugin.schema');
const PluginInstance = require('../database/schemas/pluginInstance.schema');
const Chatbot = require('../database/schemas/chatbot.schema');
const { logger } = require('../utils');
const { NotFoundError, ValidationError } = require('../utils/errors');

// Plugin registry to store loaded plugin modules
const pluginRegistry = new Map();

/**
 * Get all available plugins
 * @returns {Promise<Array>} List of plugins
 */
exports.getAllPlugins = async () => {
  try {
    const plugins = await Plugin.find({});
    
    logger.info(`Retrieved ${plugins.length} plugins`);
    
    return plugins;
  } catch (error) {
    logger.error('Error fetching plugins:', error.message);
    throw error;
  }
};

/**
 * Get plugin by ID
 * @param {string} id - Plugin ID
 * @returns {Promise<Object>} Plugin
 */
exports.getPluginById = async (id) => {
  try {
    const plugin = await Plugin.findById(id);
    
    if (!plugin) {
      throw new NotFoundError(`Plugin with ID ${id} not found`);
    }
    
    logger.info(`Retrieved plugin: ${id}`);
    
    return plugin;
  } catch (error) {
    logger.error(`Error fetching plugin ${id}:`, error.message);
    throw error;
  }
};

/**
 * Register a new plugin
 * @param {Object} pluginData - Plugin data
 * @returns {Promise<Object>} Created plugin
 */
exports.registerPlugin = async (pluginData) => {
  try {
    // Validate required fields
    if (!pluginData.name) {
      throw new ValidationError('Plugin name is required');
    }
    
    if (!pluginData.version) {
      throw new ValidationError('Plugin version is required');
    }
    
    if (!pluginData.entryPoint) {
      throw new ValidationError('Plugin entry point is required');
    }
    
    if (!pluginData.installPath) {
      throw new ValidationError('Plugin install path is required');
    }
    
    // Check if plugin entry point exists
    const entryPointPath = path.join(pluginData.installPath, pluginData.entryPoint);
    if (!fs.existsSync(entryPointPath)) {
      throw new ValidationError(`Plugin entry point not found: ${entryPointPath}`);
    }
    
    // Create plugin
    const plugin = new Plugin(pluginData);
    await plugin.save();
    
    logger.info(`Registered new plugin: ${plugin._id} (${plugin.name} v${plugin.version})`);
    
    return plugin;
  } catch (error) {
    logger.error('Error registering plugin:', error.message);
    throw error;
  }
};

/**
 * Update plugin
 * @param {string} id - Plugin ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated plugin
 */
exports.updatePlugin = async (id, updateData) => {
  try {
    const plugin = await Plugin.findById(id);
    
    if (!plugin) {
      throw new NotFoundError(`Plugin with ID ${id} not found`);
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
      plugin[key] = updateData[key];
    });
    
    await plugin.save();
    
    logger.info(`Updated plugin ${id}`);
    
    return plugin;
  } catch (error) {
    logger.error(`Error updating plugin ${id}:`, error.message);
    throw error;
  }
};

/**
 * Unregister plugin
 * @param {string} id - Plugin ID
 * @returns {Promise<boolean>} True if unregistered
 */
exports.unregisterPlugin = async (id) => {
  try {
    const plugin = await Plugin.findById(id);
    
    if (!plugin) {
      throw new NotFoundError(`Plugin with ID ${id} not found`);
    }
    
    // Check if plugin is a system plugin
    if (plugin.isSystem) {
      throw new ValidationError('Cannot unregister a system plugin');
    }
    
    // Check if plugin is installed on any chatbots
    const instances = await PluginInstance.find({ pluginId: id });
    if (instances.length > 0) {
      throw new ValidationError(`Plugin is installed on ${instances.length} chatbots. Uninstall from all chatbots before unregistering.`);
    }
    
    // Remove plugin from registry
    if (pluginRegistry.has(id)) {
      pluginRegistry.delete(id);
    }
    
    // Delete plugin
    await Plugin.findByIdAndDelete(id);
    
    logger.info(`Unregistered plugin ${id}`);
    
    return true;
  } catch (error) {
    logger.error(`Error unregistering plugin ${id}:`, error.message);
    throw error;
  }
};

/**
 * Install plugin on a chatbot
 * @param {string} chatbotId - Chatbot ID
 * @param {string} pluginId - Plugin ID
 * @param {Object} config - Plugin configuration
 * @returns {Promise<Object>} Plugin instance
 */
exports.installPlugin = async (chatbotId, pluginId, config = {}) => {
  try {
    // Validate chatbot exists
    const chatbotExists = await Chatbot.exists({ _id: chatbotId });
    if (!chatbotExists) {
      throw new NotFoundError(`Chatbot with ID ${chatbotId} not found`);
    }
    
    // Validate plugin exists
    const plugin = await Plugin.findById(pluginId);
    if (!plugin) {
      throw new NotFoundError(`Plugin with ID ${pluginId} not found`);
    }
    
    // Check if plugin is already installed
    const existingInstance = await PluginInstance.findOne({ chatbotId, pluginId });
    if (existingInstance) {
      throw new ValidationError(`Plugin ${plugin.name} is already installed on this chatbot`);
    }
    
    // Validate plugin configuration
    const validationErrors = [];
    
    // Check required config options
    plugin.configOptions.forEach(option => {
      if (option.required && !config.hasOwnProperty(option.name)) {
        validationErrors.push(`Missing required config option: ${option.name}`);
      }
    });
    
    if (validationErrors.length > 0) {
      throw new ValidationError(`Plugin configuration validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Create plugin instance
    const pluginInstance = new PluginInstance({
      chatbotId,
      pluginId,
      config
    });
    
    await pluginInstance.save();
    
    logger.info(`Installed plugin ${pluginId} on chatbot ${chatbotId}`);
    
    return pluginInstance;
  } catch (error) {
    logger.error(`Error installing plugin ${pluginId} on chatbot ${chatbotId}:`, error.message);
    throw error;
  }
};

/**
 * Uninstall plugin from a chatbot
 * @param {string} chatbotId - Chatbot ID
 * @param {string} pluginId - Plugin ID
 * @returns {Promise<boolean>} True if uninstalled
 */
exports.uninstallPlugin = async (chatbotId, pluginId) => {
  try {
    // Find plugin instance
    const pluginInstance = await PluginInstance.findOne({ chatbotId, pluginId });
    
    if (!pluginInstance) {
      throw new NotFoundError(`Plugin with ID ${pluginId} is not installed on chatbot ${chatbotId}`);
    }
    
    // Delete plugin instance
    await PluginInstance.findByIdAndDelete(pluginInstance._id);
    
    logger.info(`Uninstalled plugin ${pluginId} from chatbot ${chatbotId}`);
    
    return true;
  } catch (error) {
    logger.error(`Error uninstalling plugin ${pluginId} from chatbot ${chatbotId}:`, error.message);
    throw error;
  }
};

/**
 * Get all plugins installed on a chatbot
 * @param {string} chatbotId - Chatbot ID
 * @returns {Promise<Array>} List of plugin instances
 */
exports.getChatbotPlugins = async (chatbotId) => {
  try {
    // Validate chatbot exists
    const chatbotExists = await Chatbot.exists({ _id: chatbotId });
    if (!chatbotExists) {
      throw new NotFoundError(`Chatbot with ID ${chatbotId} not found`);
    }
    
    // Get plugin instances
    const pluginInstances = await PluginInstance.find({ chatbotId }).populate('pluginId');
    
    logger.info(`Retrieved ${pluginInstances.length} plugins for chatbot ${chatbotId}`);
    
    return pluginInstances;
  } catch (error) {
    logger.error(`Error fetching plugins for chatbot ${chatbotId}:`, error.message);
    throw error;
  }
};

/**
 * Update plugin configuration
 * @param {string} instanceId - Plugin instance ID
 * @param {Object} config - Updated configuration
 * @returns {Promise<Object>} Updated plugin instance
 */
exports.updatePluginConfig = async (instanceId, config) => {
  try {
    const pluginInstance = await PluginInstance.findById(instanceId);
    
    if (!pluginInstance) {
      throw new NotFoundError(`Plugin instance with ID ${instanceId} not found`);
    }
    
    // Get plugin to validate config
    const plugin = await Plugin.findById(pluginInstance.pluginId);
    
    if (!plugin) {
      throw new NotFoundError(`Plugin with ID ${pluginInstance.pluginId} not found`);
    }
    
    // Validate plugin configuration
    const validationErrors = [];
    
    // Check required config options
    plugin.configOptions.forEach(option => {
      if (option.required && !config.hasOwnProperty(option.name)) {
        validationErrors.push(`Missing required config option: ${option.name}`);
      }
    });
    
    if (validationErrors.length > 0) {
      throw new ValidationError(`Plugin configuration validation failed: ${validationErrors.join(', ')}`);
    }
    
    // Update config
    pluginInstance.config = config;
    await pluginInstance.save();
    
    logger.info(`Updated configuration for plugin instance ${instanceId}`);
    
    return pluginInstance;
  } catch (error) {
    logger.error(`Error updating plugin configuration for instance ${instanceId}:`, error.message);
    throw error;
  }
};

/**
 * Enable or disable a plugin instance
 * @param {string} instanceId - Plugin instance ID
 * @param {boolean} isEnabled - Whether the plugin should be enabled
 * @returns {Promise<Object>} Updated plugin instance
 */
exports.setPluginEnabled = async (instanceId, isEnabled) => {
  try {
    const pluginInstance = await PluginInstance.findById(instanceId);
    
    if (!pluginInstance) {
      throw new NotFoundError(`Plugin instance with ID ${instanceId} not found`);
    }
    
    // Update enabled status
    pluginInstance.isEnabled = isEnabled;
    await pluginInstance.save();
    
    logger.info(`${isEnabled ? 'Enabled' : 'Disabled'} plugin instance ${instanceId}`);
    
    return pluginInstance;
  } catch (error) {
    logger.error(`Error ${isEnabled ? 'enabling' : 'disabling'} plugin instance ${instanceId}:`, error.message);
    throw error;
  }
};

/**
 * Load a plugin module
 * @param {string} pluginId - Plugin ID
 * @returns {Promise<Object>} Plugin module
 */
exports.loadPluginModule = async (pluginId) => {
  try {
    // Check if plugin is already loaded
    if (pluginRegistry.has(pluginId)) {
      return pluginRegistry.get(pluginId);
    }
    
    // Get plugin
    const plugin = await Plugin.findById(pluginId);
    
    if (!plugin) {
      throw new NotFoundError(`Plugin with ID ${pluginId} not found`);
    }
    
    // Load plugin module
    const entryPointPath = path.join(plugin.installPath, plugin.entryPoint);
    
    try {
      // In a real implementation, we would use dynamic import or require
      // For now, we'll simulate loading the plugin
      
      // Simulate plugin module
      const pluginModule = {
        name: plugin.name,
        version: plugin.version,
        hooks: {},
        initialize: async () => {
          logger.debug(`Initialized plugin: ${plugin.name}`);
          return true;
        },
        shutdown: async () => {
          logger.debug(`Shutdown plugin: ${plugin.name}`);
          return true;
        }
      };
      
      // Register plugin hooks
      plugin.hooks.forEach(hook => {
        pluginModule.hooks[hook.name] = async (data) => {
          logger.debug(`Executing hook ${hook.name} for plugin ${plugin.name}`);
          return data;
        };
      });
      
      // Add plugin to registry
      pluginRegistry.set(pluginId, pluginModule);
      
      logger.info(`Loaded plugin module: ${plugin.name} (${plugin._id})`);
      
      return pluginModule;
    } catch (loadError) {
      logger.error(`Error loading plugin module ${plugin.name}:`, loadError.message);
      throw new Error(`Failed to load plugin module: ${loadError.message}`);
    }
  } catch (error) {
    logger.error(`Error loading plugin module ${pluginId}:`, error.message);
    throw error;
  }
};

/**
 * Execute a plugin hook
 * @param {string} chatbotId - Chatbot ID
 * @param {string} hookName - Hook name
 * @param {Object} data - Data to pass to the hook
 * @returns {Promise<Object>} Modified data
 */
exports.executeHook = async (chatbotId, hookName, data) => {
  try {
    // Get all enabled plugin instances for the chatbot
    const pluginInstances = await PluginInstance.find({ 
      chatbotId, 
      isEnabled: true 
    }).populate('pluginId');
    
    if (pluginInstances.length === 0) {
      // No plugins installed or enabled, return original data
      return data;
    }
    
    // Filter plugins that have the requested hook
    const pluginsWithHook = pluginInstances.filter(instance => {
      const plugin = instance.pluginId;
      return plugin.hooks.some(hook => hook.name === hookName);
    });
    
    if (pluginsWithHook.length === 0) {
      // No plugins with the requested hook, return original data
      return data;
    }
    
    // Sort plugins by hook priority
    pluginsWithHook.sort((a, b) => {
      const hookA = a.pluginId.hooks.find(hook => hook.name === hookName);
      const hookB = b.pluginId.hooks.find(hook => hook.name === hookName);
      return hookA.priority - hookB.priority;
    });
    
    // Execute hooks in order
    let modifiedData = { ...data };
    
    for (const instance of pluginsWithHook) {
      const plugin = instance.pluginId;
      
      // Load plugin module if not already loaded
      const pluginModule = await exports.loadPluginModule(plugin._id);
      
      // Execute hook
      if (pluginModule.hooks[hookName]) {
        modifiedData = await pluginModule.hooks[hookName](modifiedData, instance.config);
      }
    }
    
    return modifiedData;
  } catch (error) {
    logger.error(`Error executing hook ${hookName} for chatbot ${chatbotId}:`, error.message);
    // Return original data in case of error
    return data;
  }
};
