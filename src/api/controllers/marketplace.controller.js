/**
 * Marketplace Controller
 * 
 * Controller for managing the component marketplace
 */

const marketplaceService = require('../../services/marketplace.service');

/**
 * Get all marketplace components
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getComponents(req, res) {
  try {
    const { 
      page, 
      limit, 
      sort, 
      order, 
      search, 
      tags, 
      type 
    } = req.query;
    
    // Parse query parameters
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sort: sort || 'downloads',
      order: order || 'desc',
      search: search || '',
      tags: tags ? tags.split(',') : [],
      type: type || ''
    };
    
    const components = await marketplaceService.getComponents(options);
    res.json(components);
  } catch (error) {
    console.error('Error getting marketplace components:', error);
    res.status(500).json({ error: 'Failed to get marketplace components' });
  }
}

/**
 * Get a marketplace component by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getComponent(req, res) {
  try {
    const { id } = req.params;
    const component = await marketplaceService.getComponent(id);
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    res.json(component);
  } catch (error) {
    console.error(`Error getting marketplace component ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get marketplace component' });
  }
}

/**
 * Install a component from the marketplace
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function installComponent(req, res) {
  try {
    const { id } = req.params;
    const result = await marketplaceService.installComponent(id);
    
    res.json({
      message: 'Component installed successfully',
      ...result
    });
  } catch (error) {
    console.error(`Error installing marketplace component ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to install marketplace component' });
  }
}

/**
 * Publish a component to the marketplace
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function publishComponent(req, res) {
  try {
    const { componentName } = req.params;
    const metadata = req.body || {};
    
    const result = await marketplaceService.publishComponent(componentName, metadata);
    
    res.status(201).json({
      message: 'Component published successfully',
      ...result
    });
  } catch (error) {
    console.error(`Error publishing component ${req.params.componentName}:`, error);
    res.status(500).json({ error: 'Failed to publish component' });
  }
}

/**
 * Rate a marketplace component
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function rateComponent(req, res) {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    
    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1 and 5' });
    }
    
    const result = await marketplaceService.rateComponent(id, rating, review);
    
    res.json({
      message: 'Component rated successfully',
      ...result
    });
  } catch (error) {
    console.error(`Error rating marketplace component ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to rate marketplace component' });
  }
}

/**
 * Get ratings for a marketplace component
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getComponentRatings(req, res) {
  try {
    const { id } = req.params;
    const { page, limit } = req.query;
    
    // Parse query parameters
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    };
    
    const ratings = await marketplaceService.getComponentRatings(id, options);
    
    res.json(ratings);
  } catch (error) {
    console.error(`Error getting ratings for marketplace component ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get component ratings' });
  }
}

module.exports = {
  getComponents,
  getComponent,
  installComponent,
  publishComponent,
  rateComponent,
  getComponentRatings
};
