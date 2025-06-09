/**
 * Plugin Controller
 * 
 * Handles all plugin-related operations and API endpoints
 */

require('@src/services\plugin.service');
require('@src/utils');
require('@src/utils\errors');

/**
 * Get all plugins
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getAllPlugins = async (req, res, next) => {
  try {
    logger.debug('Getting all plugins');
    
    // Get plugins from service
    const plugins = await pluginService.getAllPlugins();
    
    logger.info(`Retrieved ${plugins.length} plugins`);
    
    res.status(200).json({
      success: true,
      count: plugins.length,
      data: plugins
    });
  } catch (error) {
    logger.error('Error fetching plugins:', error.message);
    next(error);
  }
};

/**
 * Get plugin by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getPluginById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Getting plugin by ID: ${id}`);
    
    // Get plugin by ID from service
    const plugin = await pluginService.getPluginById(id);
    
    logger.info(`Retrieved plugin: ${id}`);
    
    res.status(200).json({
      success: true,
      data: plugin
    });
  } catch (error) {
    logger.error(`Error fetching plugin ${req.params.id}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Register a new plugin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.registerPlugin = async (req, res, next) => {
  try {
    const pluginData = req.body;
    
    logger.debug('Registering new plugin');
    
    // Register plugin using service
    const plugin = await pluginService.registerPlugin(pluginData);
    
    logger.info(`Registered new plugin: ${plugin._id} (${plugin.name})`);
    
    res.status(201).json({
      success: true,
      data: plugin
    });
  } catch (error) {
    logger.error('Error registering plugin:', error.message);
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Update plugin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updatePlugin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.debug(`Updating plugin ${id}`);
    
    // Update plugin using service
    const plugin = await pluginService.updatePlugin(id, updateData);
    
    logger.info(`Updated plugin ${id}`);
    
    res.status(200).json({
      success: true,
      data: plugin
    });
  } catch (error) {
    logger.error(`Error updating plugin ${req.params.id}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Unregister plugin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.unregisterPlugin = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.debug(`Unregistering plugin ${id}`);
    
    // Unregister plugin using service
    await pluginService.unregisterPlugin(id);
    
    logger.info(`Unregistered plugin ${id}`);
    
    res.status(200).json({
      success: true,
      message: `Plugin with ID ${id} successfully unregistered`
    });
  } catch (error) {
    logger.error(`Error unregistering plugin ${req.params.id}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Get all plugins installed on a chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getChatbotPlugins = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    
    logger.debug(`Getting plugins for chatbot ${chatbotId}`);
    
    // Get chatbot plugins from service
    const plugins = await pluginService.getChatbotPlugins(chatbotId);
    
    logger.info(`Retrieved ${plugins.length} plugins for chatbot ${chatbotId}`);
    
    res.status(200).json({
      success: true,
      count: plugins.length,
      data: plugins
    });
  } catch (error) {
    logger.error(`Error fetching plugins for chatbot ${req.params.chatbotId}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Install plugin on a chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.installPlugin = async (req, res, next) => {
  try {
    const { chatbotId } = req.params;
    const { pluginId, config } = req.body;
    
    logger.debug(`Installing plugin ${pluginId} on chatbot ${chatbotId}`);
    
    // Validate required fields
    if (!pluginId) {
      throw new ValidationError('Plugin ID is required');
    }
    
    // Install plugin using service
    const pluginInstance = await pluginService.installPlugin(chatbotId, pluginId, config || {});
    
    logger.info(`Installed plugin ${pluginId} on chatbot ${chatbotId}`);
    
    res.status(201).json({
      success: true,
      data: pluginInstance
    });
  } catch (error) {
    logger.error(`Error installing plugin on chatbot ${req.params.chatbotId}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Uninstall plugin from a chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.uninstallPlugin = async (req, res, next) => {
  try {
    const { chatbotId, pluginId } = req.params;
    
    logger.debug(`Uninstalling plugin ${pluginId} from chatbot ${chatbotId}`);
    
    // Uninstall plugin using service
    await pluginService.uninstallPlugin(chatbotId, pluginId);
    
    logger.info(`Uninstalled plugin ${pluginId} from chatbot ${chatbotId}`);
    
    res.status(200).json({
      success: true,
      message: `Plugin with ID ${pluginId} successfully uninstalled from chatbot ${chatbotId}`
    });
  } catch (error) {
    logger.error(`Error uninstalling plugin ${req.params.pluginId} from chatbot ${req.params.chatbotId}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Update plugin configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.updatePluginConfig = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    const { config } = req.body;
    
    logger.debug(`Updating configuration for plugin instance ${instanceId}`);
    
    // Validate required fields
    if (!config) {
      throw new ValidationError('Plugin configuration is required');
    }
    
    // Update plugin configuration using service
    const pluginInstance = await pluginService.updatePluginConfig(instanceId, config);
    
    logger.info(`Updated configuration for plugin instance ${instanceId}`);
    
    res.status(200).json({
      success: true,
      data: pluginInstance
    });
  } catch (error) {
    logger.error(`Error updating plugin configuration for instance ${req.params.instanceId}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};

/**
 * Enable or disable a plugin instance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.setPluginEnabled = async (req, res, next) => {
  try {
    const { instanceId } = req.params;
    const { enabled } = req.body;
    
    logger.debug(`${enabled ? 'Enabling' : 'Disabling'} plugin instance ${instanceId}`);
    
    // Validate required fields
    if (enabled === undefined) {
      throw new ValidationError('Enabled status is required');
    }
    
    // Set plugin enabled status using service
    const pluginInstance = await pluginService.setPluginEnabled(instanceId, enabled);
    
    logger.info(`${enabled ? 'Enabled' : 'Disabled'} plugin instance ${instanceId}`);
    
    res.status(200).json({
      success: true,
      data: pluginInstance
    });
  } catch (error) {
    logger.error(`Error setting plugin enabled status for instance ${req.params.instanceId}:`, error.message);
    
    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message
      });
    }
    
    next(error);
  }
};
