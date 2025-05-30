/**
 * Component Controller
 * 
 * Controller for managing custom components
 */

const componentService = require('../../services/component.service');

/**
 * Get all components
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllComponents(req, res) {
  try {
    const components = await componentService.getAllComponents();
    res.json(components);
  } catch (error) {
    console.error('Error getting all components:', error);
    res.status(500).json({ error: 'Failed to get components' });
  }
}

/**
 * Get components by type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getComponentsByType(req, res) {
  try {
    const { type } = req.params;
    const components = await componentService.getComponentsByType(type);
    res.json(components);
  } catch (error) {
    console.error(`Error getting components of type ${req.params.type}:`, error);
    res.status(500).json({ error: 'Failed to get components' });
  }
}

/**
 * Get a component by name and version
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getComponent(req, res) {
  try {
    const { name, version } = req.params;
    const component = await componentService.getComponent(name, version);
    
    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    res.json(component);
  } catch (error) {
    console.error(`Error getting component ${req.params.name}@${req.params.version}:`, error);
    res.status(500).json({ error: 'Failed to get component' });
  }
}

/**
 * Create a new component
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createComponent(req, res) {
  try {
    const { name, type, description, author } = req.body;
    
    // Validate required fields
    if (!name || !type || !description || !author) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create the component
    const componentPath = await componentService.createComponent({
      name,
      type,
      description,
      author
    });
    
    res.status(201).json({
      message: 'Component created successfully',
      path: componentPath
    });
  } catch (error) {
    console.error('Error creating component:', error);
    res.status(500).json({ error: 'Failed to create component' });
  }
}

/**
 * Delete a component
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteComponent(req, res) {
  try {
    const { name, version } = req.params;
    const deleted = await componentService.deleteComponent(name, version);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Component not found' });
    }
    
    res.json({ message: 'Component deleted successfully' });
  } catch (error) {
    console.error(`Error deleting component ${req.params.name}@${req.params.version}:`, error);
    res.status(500).json({ error: 'Failed to delete component' });
  }
}

/**
 * Get all component types
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getComponentTypes(req, res) {
  try {
    const types = await componentService.getComponentTypes();
    res.json(types);
  } catch (error) {
    console.error('Error getting component types:', error);
    res.status(500).json({ error: 'Failed to get component types' });
  }
}

/**
 * Add a new component type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function addComponentType(req, res) {
  try {
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Missing required field: type' });
    }
    
    const added = await componentService.addComponentType(type);
    
    if (!added) {
      return res.status(409).json({ error: 'Component type already exists' });
    }
    
    res.status(201).json({ message: 'Component type added successfully' });
  } catch (error) {
    console.error('Error adding component type:', error);
    res.status(500).json({ error: 'Failed to add component type' });
  }
}

module.exports = {
  getAllComponents,
  getComponentsByType,
  getComponent,
  createComponent,
  deleteComponent,
  getComponentTypes,
  addComponentType
};
