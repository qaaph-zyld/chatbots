/**
 * Component Service
 * 
 * Service for managing custom components
 */

const path = require('path');
const fs = require('fs');
require('@src/components\custom\ComponentRegistry');
require('@src/components\custom\ComponentScaffolder');

class ComponentService {
  constructor() {
    this.initialized = false;
    this.componentsDir = path.join(process.cwd(), 'custom-components');
  }

  /**
   * Initialize the component service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure the components directory exists
      if (!fs.existsSync(this.componentsDir)) {
        fs.mkdirSync(this.componentsDir, { recursive: true });
      }

      // Initialize the component registry
      await componentRegistry.initialize(this.componentsDir);

      this.initialized = true;
      console.log('Component Service initialized');
    } catch (error) {
      console.error('Error initializing Component Service:', error);
      throw error;
    }
  }

  /**
   * Get all registered components
   * 
   * @returns {Array} - Array of all registered components
   */
  async getAllComponents() {
    await this.ensureInitialized();
    return componentRegistry.getAllComponents();
  }

  /**
   * Get components by type
   * 
   * @param {string} type - Component type
   * @returns {Array} - Array of components of the specified type
   */
  async getComponentsByType(type) {
    await this.ensureInitialized();
    return componentRegistry.getComponentsByType(type);
  }

  /**
   * Get a component by name and version
   * 
   * @param {string} name - Component name
   * @param {string} version - Component version (optional, defaults to latest)
   * @returns {Object|null} - The component or null if not found
   */
  async getComponent(name, version) {
    await this.ensureInitialized();
    return componentRegistry.getComponent(name, version);
  }

  /**
   * Create a new component
   * 
   * @param {Object} options - Component options
   * @param {string} options.name - Component name
   * @param {string} options.type - Component type
   * @param {string} options.description - Component description
   * @param {string} options.author - Component author
   * @returns {Promise<string>} - Path to the created component
   */
  async createComponent(options) {
    await this.ensureInitialized();
    
    // Create the component
    const componentDir = await componentScaffolder.createComponent(options, this.componentsDir);
    
    // Reload the component registry to include the new component
    await componentRegistry.loadComponents(componentDir);
    
    return componentDir;
  }

  /**
   * Delete a component
   * 
   * @param {string} name - Component name
   * @param {string} version - Component version
   * @returns {boolean} - Whether the component was deleted
   */
  async deleteComponent(name, version) {
    await this.ensureInitialized();
    
    // Get the component
    const component = componentRegistry.getComponent(name, version);
    if (!component) {
      return false;
    }
    
    // Unregister the component
    componentRegistry.unregisterComponent(name, version);
    
    // Delete the component directory
    const componentDir = path.join(this.componentsDir, this.kebabCase(name));
    if (fs.existsSync(componentDir)) {
      fs.rmdirSync(componentDir, { recursive: true });
      return true;
    }
    
    return false;
  }

  /**
   * Get all available component types
   * 
   * @returns {Array} - Array of all available component types
   */
  async getComponentTypes() {
    await this.ensureInitialized();
    return componentRegistry.getComponentTypes();
  }

  /**
   * Add a new component type
   * 
   * @param {string} type - Component type to add
   * @returns {boolean} - Whether the type was added
   */
  async addComponentType(type) {
    await this.ensureInitialized();
    return componentRegistry.addComponentType(type);
  }

  /**
   * Ensure the service is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Convert a string to kebab-case
   * 
   * @param {string} str - String to convert
   * @returns {string} - Kebab-case string
   */
  kebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
}

// Create and export a singleton instance
const componentService = new ComponentService();
module.exports = componentService;
