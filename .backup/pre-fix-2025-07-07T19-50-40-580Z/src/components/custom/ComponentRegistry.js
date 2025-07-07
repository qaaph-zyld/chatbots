/**
 * Component Registry
 * 
 * Manages the registration, discovery, and loading of custom components
 */

const fs = require('fs');
const path = require('path');

class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.componentTypes = new Set([
      'message',
      'input',
      'button',
      'card',
      'carousel',
      'list',
      'media',
      'form',
      'chart',
      'container'
    ]);
  }

  /**
   * Initialize the component registry
   * 
   * @param {string} customComponentsDir - Path to the custom components directory
   */
  async initialize(customComponentsDir) {
    try {
      // Ensure the custom components directory exists
      if (!fs.existsSync(customComponentsDir)) {
        fs.mkdirSync(customComponentsDir, { recursive: true });
      }

      // Load all components from the directory
      await this.loadComponents(customComponentsDir);
      
      console.log(`Component Registry initialized with ${this.components.size} components`);
      return true;
    } catch (error) {
      console.error('Error initializing Component Registry:', error);
      return false;
    }
  }

  /**
   * Load all components from a directory
   * 
   * @param {string} directory - Directory containing component files
   */
  async loadComponents(directory) {
    try {
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Recursively load components from subdirectories
          await this.loadComponents(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
          // Load component from file
          await this.loadComponentFromFile(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error loading components from ${directory}:`, error);
    }
  }

  /**
   * Load a component from a file
   * 
   * @param {string} filePath - Path to the component file
   */
  async loadComponentFromFile(filePath) {
    try {
      // Clear require cache to ensure we get the latest version
      delete require.cache[require.resolve(filePath)];
      
      // Import the component
      const component = require(filePath);
      
      // Validate the component
      if (this.validateComponent(component)) {
        // Register the component
        this.registerComponent(component);
      } else {
        console.warn(`Invalid component in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error loading component from ${filePath}:`, error);
    }
  }

  /**
   * Validate a component
   * 
   * @param {Object} component - Component to validate
   * @returns {boolean} - Whether the component is valid
   */
  validateComponent(component) {
    // Check if the component has the required properties
    if (!component || typeof component !== 'object') {
      return false;
    }
    
    // Check for required properties
    const requiredProps = ['name', 'type', 'version', 'component'];
    for (const prop of requiredProps) {
      if (!component[prop]) {
        console.warn(`Component missing required property: ${prop}`);
        return false;
      }
    }
    
    // Check if the component type is valid
    if (!this.componentTypes.has(component.type)) {
      console.warn(`Invalid component type: ${component.type}`);
      return false;
    }
    
    // Check if the component has a valid React component
    if (typeof component.component !== 'function') {
      console.warn('Component must export a React component function');
      return false;
    }
    
    return true;
  }

  /**
   * Register a component
   * 
   * @param {Object} component - Component to register
   */
  registerComponent(component) {
    // Create a unique key for the component
    const key = `${component.name}@${component.version}`;
    
    // Check if the component is already registered
    if (this.components.has(key)) {
      console.warn(`Component already registered: ${key}`);
      return;
    }
    
    // Register the component
    this.components.set(key, component);
    console.log(`Registered component: ${key}`);
  }

  /**
   * Get a component by name and version
   * 
   * @param {string} name - Component name
   * @param {string} version - Component version (optional, defaults to latest)
   * @returns {Object|null} - The component or null if not found
   */
  getComponent(name, version) {
    // If no version is specified, get the latest version
    if (!version) {
      // Find all components with the given name
      const matches = Array.from(this.components.entries())
        .filter(([key]) => key.startsWith(`${name}@`))
        .map(([key, component]) => ({
          key,
          version: component.version,
          component
        }));
      
      // Sort by version (assuming semver)
      matches.sort((a, b) => {
        const aParts = a.version.split('.').map(Number);
        const bParts = b.version.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aVal = i < aParts.length ? aParts[i] : 0;
          const bVal = i < bParts.length ? bParts[i] : 0;
          
          if (aVal !== bVal) {
            return bVal - aVal; // Descending order
          }
        }
        
        return 0;
      });
      
      // Return the latest version or null if none found
      return matches.length > 0 ? matches[0].component : null;
    }
    
    // Get the component with the specified version
    const key = `${name}@${version}`;
    return this.components.get(key) || null;
  }

  /**
   * Get all registered components
   * 
   * @returns {Array} - Array of all registered components
   */
  getAllComponents() {
    return Array.from(this.components.values());
  }

  /**
   * Get all components of a specific type
   * 
   * @param {string} type - Component type
   * @returns {Array} - Array of components of the specified type
   */
  getComponentsByType(type) {
    return Array.from(this.components.values())
      .filter(component => component.type === type);
  }

  /**
   * Unregister a component
   * 
   * @param {string} name - Component name
   * @param {string} version - Component version
   * @returns {boolean} - Whether the component was unregistered
   */
  unregisterComponent(name, version) {
    const key = `${name}@${version}`;
    return this.components.delete(key);
  }

  /**
   * Get all available component types
   * 
   * @returns {Array} - Array of all available component types
   */
  getComponentTypes() {
    return Array.from(this.componentTypes);
  }

  /**
   * Add a new component type
   * 
   * @param {string} type - Component type to add
   * @returns {boolean} - Whether the type was added
   */
  addComponentType(type) {
    if (this.componentTypes.has(type)) {
      return false;
    }
    
    this.componentTypes.add(type);
    return true;
  }
}

// Create and export a singleton instance
const componentRegistry = new ComponentRegistry();
module.exports = componentRegistry;
