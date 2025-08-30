/**
 * Marketplace Service
 * 
 * Service for managing the component marketplace
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('@src/modules\topic\component.service');

class MarketplaceService {
  constructor() {
    this.initialized = false;
    this.marketplaceUrl = process.env.MARKETPLACE_URL || 'https://api.chatbot-marketplace.example.com';
    this.marketplaceDir = path.join(process.cwd(), 'marketplace-components');
    this.apiKey = process.env.MARKETPLACE_API_KEY;
  }

  /**
   * Initialize the marketplace service
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Ensure the marketplace directory exists
      if (!fs.existsSync(this.marketplaceDir)) {
        fs.mkdirSync(this.marketplaceDir, { recursive: true });
      }

      this.initialized = true;
      console.log('Marketplace Service initialized');
    } catch (error) {
      console.error('Error initializing Marketplace Service:', error);
      throw error;
    }
  }

  /**
   * Get all marketplace components
   * 
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Number of items per page
   * @param {string} options.sort - Sort field
   * @param {string} options.order - Sort order (asc, desc)
   * @param {string} options.search - Search query
   * @param {Array<string>} options.tags - Filter by tags
   * @param {string} options.type - Filter by component type
   * @returns {Promise<Object>} - Paginated components
   */
  async getComponents(options = {}) {
    await this.ensureInitialized();

    try {
      // Set default options
      const defaultOptions = {
        page: 1,
        limit: 20,
        sort: 'downloads',
        order: 'desc'
      };

      // Merge options with defaults
      const queryOptions = { ...defaultOptions, ...options };

      // Make API request
      const response = await this.makeRequest('GET', '/components', { params: queryOptions });
      return response.data;
    } catch (error) {
      console.error('Error getting marketplace components:', error);
      throw error;
    }
  }

  /**
   * Get a marketplace component by ID
   * 
   * @param {string} id - Component ID
   * @returns {Promise<Object>} - Component details
   */
  async getComponent(id) {
    await this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', `/components/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting marketplace component ${id}:`, error);
      throw error;
    }
  }

  /**
   * Install a component from the marketplace
   * 
   * @param {string} id - Component ID
   * @returns {Promise<Object>} - Installation result
   */
  async installComponent(id) {
    await this.ensureInitialized();

    try {
      // Get component details
      const component = await this.getComponent(id);

      // Download the component
      const downloadResponse = await this.makeRequest('GET', `/components/${id}/download`, {
        responseType: 'arraybuffer'
      });

      // Create component directory
      const componentDir = path.join(this.marketplaceDir, component.name.toLowerCase());
      if (!fs.existsSync(componentDir)) {
        fs.mkdirSync(componentDir, { recursive: true });
      }

      // Write component files
      const zipPath = path.join(componentDir, `${component.name}.zip`);
      fs.writeFileSync(zipPath, downloadResponse.data);

      // Extract the component
      await this.extractComponent(zipPath, componentDir);

      // Register the component with the component service
      await componentService.loadComponent(componentDir);

      // Track the installation
      await this.makeRequest('POST', `/components/${id}/installations`);

      return {
        success: true,
        component,
        path: componentDir
      };
    } catch (error) {
      console.error(`Error installing marketplace component ${id}:`, error);
      throw error;
    }
  }

  /**
   * Extract a component zip file
   * 
   * @param {string} zipPath - Path to the zip file
   * @param {string} extractPath - Path to extract to
   * @returns {Promise<void>}
   */
  async extractComponent(zipPath, extractPath) {
    // This is a simplified implementation
    // In a real implementation, you would use a library like unzipper or adm-zip
    console.log(`Extracting ${zipPath} to ${extractPath}`);
    
    // For now, we'll just assume the extraction was successful
    // In a real implementation, you would extract the zip file here
    
    // Delete the zip file after extraction
    fs.unlinkSync(zipPath);
  }

  /**
   * Publish a component to the marketplace
   * 
   * @param {string} componentName - Name of the component to publish
   * @param {Object} metadata - Additional metadata for the component
   * @returns {Promise<Object>} - Publication result
   */
  async publishComponent(componentName, metadata = {}) {
    await this.ensureInitialized();

    try {
      // Get the component
      const component = await componentService.getComponent(componentName);
      if (!component) {
        throw new Error(`Component ${componentName} not found`);
      }

      // Create a zip file of the component
      const zipPath = await this.createComponentZip(componentName);

      // Create form data
      const formData = new FormData();
      formData.append('file', fs.createReadStream(zipPath));
      formData.append('metadata', JSON.stringify({
        ...component,
        ...metadata
      }));

      // Publish the component
      const response = await this.makeRequest('POST', '/components', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Delete the temporary zip file
      fs.unlinkSync(zipPath);

      return response.data;
    } catch (error) {
      console.error(`Error publishing component ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Create a zip file of a component
   * 
   * @param {string} componentName - Name of the component
   * @returns {Promise<string>} - Path to the zip file
   */
  async createComponentZip(componentName) {
    // This is a simplified implementation
    // In a real implementation, you would use a library like archiver
    console.log(`Creating zip file for component ${componentName}`);
    
    // For now, we'll just return a dummy path
    // In a real implementation, you would create a zip file here
    return path.join(os.tmpdir(), `${componentName}.zip`);
  }

  /**
   * Rate a marketplace component
   * 
   * @param {string} id - Component ID
   * @param {number} rating - Rating (1-5)
   * @param {string} review - Review text
   * @returns {Promise<Object>} - Rating result
   */
  async rateComponent(id, rating, review = '') {
    await this.ensureInitialized();

    try {
      const response = await this.makeRequest('POST', `/components/${id}/ratings`, {
        rating,
        review
      });
      return response.data;
    } catch (error) {
      console.error(`Error rating marketplace component ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get ratings for a marketplace component
   * 
   * @param {string} id - Component ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Paginated ratings
   */
  async getComponentRatings(id, options = {}) {
    await this.ensureInitialized();

    try {
      const response = await this.makeRequest('GET', `/components/${id}/ratings`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting ratings for marketplace component ${id}:`, error);
      throw error;
    }
  }

  /**
   * Make an API request to the marketplace
   * 
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - API response
   */
  async makeRequest(method, endpoint, options = {}) {
    // Ensure the API key is set
    if (!this.apiKey) {
      throw new Error('Marketplace API key not set');
    }

    // Set default headers
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      ...(options.headers || {})
    };

    // Make the request
    return axios({
      method,
      url: `${this.marketplaceUrl}${endpoint}`,
      ...options,
      headers
    });
  }

  /**
   * Ensure the service is initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Create and export a singleton instance
const marketplaceService = new MarketplaceService();
module.exports = marketplaceService;
