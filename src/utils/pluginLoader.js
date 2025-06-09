/**
 * Plugin Loader Utility
 * 
 * Handles loading and registering plugins
 */

const fs = require('fs');
const path = require('path');
require('@src/utils\index');
require('@src/services\plugin.service');

/**
 * Load and register all plugins in the plugins directory
 * @returns {Promise<Array>} - Array of registered plugins
 */
exports.loadAllPlugins = async () => {
  try {
    const pluginsDir = path.join(__dirname, '../plugins');
    
    // Check if plugins directory exists
    if (!fs.existsSync(pluginsDir)) {
      logger.warn('Plugins directory not found');
      return [];
    }
    
    // Get all plugin directories
    const pluginDirs = fs.readdirSync(pluginsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    if (pluginDirs.length === 0) {
      logger.info('No plugins found in plugins directory');
      return [];
    }
    
    logger.info(`Found ${pluginDirs.length} potential plugins`);
    
    // Load and register each plugin
    const registeredPlugins = [];
    
    for (const pluginDir of pluginDirs) {
      try {
        const pluginPath = path.join(pluginsDir, pluginDir);
        const entryPointPath = path.join(pluginPath, 'index.js');
        
        // Check if entry point exists
        if (!fs.existsSync(entryPointPath)) {
          logger.warn(`Plugin ${pluginDir} has no index.js entry point, skipping`);
          continue;
        }
        
        // Load plugin module
        const pluginModule = require(entryPointPath);
        
        // Validate plugin module
        if (!pluginModule.name || !pluginModule.version) {
          logger.warn(`Plugin ${pluginDir} is missing required properties (name, version), skipping`);
          continue;
        }
        
        // Check if plugin is already registered
        const existingPlugins = await pluginService.getAllPlugins();
        const existingPlugin = existingPlugins.find(p => p.name === pluginModule.name);
        
        if (existingPlugin) {
          // Check if version is the same
          if (existingPlugin.version === pluginModule.version) {
            logger.info(`Plugin ${pluginModule.name} v${pluginModule.version} is already registered`);
            registeredPlugins.push(existingPlugin);
            continue;
          }
          
          // Update plugin if version is different
          logger.info(`Updating plugin ${pluginModule.name} from v${existingPlugin.version} to v${pluginModule.version}`);
          
          const updatedPlugin = await pluginService.updatePlugin(existingPlugin._id, {
            version: pluginModule.version,
            entryPoint: 'index.js',
            installPath: pluginPath,
            hooks: Object.keys(pluginModule.hooks || {}).map(name => ({
              name,
              description: '',
              priority: 10
            }))
          });
          
          registeredPlugins.push(updatedPlugin);
        } else {
          // Register new plugin
          logger.info(`Registering new plugin: ${pluginModule.name} v${pluginModule.version}`);
          
          const newPlugin = await pluginService.registerPlugin({
            name: pluginModule.name,
            description: pluginModule.description || '',
            version: pluginModule.version,
            author: pluginModule.author || '',
            entryPoint: 'index.js',
            installPath: pluginPath,
            hooks: Object.keys(pluginModule.hooks || {}).map(name => ({
              name,
              description: '',
              priority: 10
            })),
            isSystem: false
          });
          
          registeredPlugins.push(newPlugin);
        }
      } catch (pluginError) {
        logger.error(`Error loading plugin ${pluginDir}:`, pluginError.message);
      }
    }
    
    logger.info(`Successfully registered ${registeredPlugins.length} plugins`);
    
    return registeredPlugins;
  } catch (error) {
    logger.error('Error loading plugins:', error.message);
    return [];
  }
};

/**
 * Initialize all registered plugins
 * @returns {Promise<boolean>} - True if all plugins were initialized successfully
 */
exports.initializePlugins = async () => {
  try {
    const plugins = await pluginService.getAllPlugins();
    
    if (plugins.length === 0) {
      logger.info('No plugins to initialize');
      return true;
    }
    
    logger.info(`Initializing ${plugins.length} plugins`);
    
    for (const plugin of plugins) {
      try {
        // Load plugin module
        const pluginModule = await pluginService.loadPluginModule(plugin._id);
        
        // Initialize plugin if it has an initialize method
        if (typeof pluginModule.initialize === 'function') {
          await pluginModule.initialize();
          logger.info(`Initialized plugin: ${plugin.name}`);
        }
      } catch (initError) {
        logger.error(`Error initializing plugin ${plugin.name}:`, initError.message);
      }
    }
    
    logger.info('All plugins initialized');
    
    return true;
  } catch (error) {
    logger.error('Error initializing plugins:', error.message);
    return false;
  }
};
