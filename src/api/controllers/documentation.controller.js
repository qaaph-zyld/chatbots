/**
 * Documentation Controller
 * 
 * Handles API requests for documentation management
 */

const documentationService = require('../../services/documentation.service');
const { logger } = require('../../utils');

/**
 * Get all documentation categories
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCategories = async (req, res) => {
  try {
    const categories = await documentationService.getCategories();
    
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error getting documentation categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get documentation categories'
    });
  }
};

/**
 * Get documentation items by category
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDocumentationByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
      });
    }
    
    const items = await documentationService.getDocumentationByCategory(category);
    
    return res.status(200).json({
      success: true,
      data: items
    });
  } catch (error) {
    logger.error(`Error getting documentation for category ${req.params.category}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get documentation items'
    });
  }
};

/**
 * Get documentation item by ID
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDocumentationItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required'
      });
    }
    
    const item = await documentationService.getDocumentationItem(id);
    
    return res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error(`Error getting documentation item ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Documentation item not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to get documentation item'
    });
  }
};

/**
 * Create or update documentation item
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const saveDocumentationItem = async (req, res) => {
  try {
    const { id, title, category, content, tags, version } = req.body;
    
    if (!id || !title || !category || !content) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const item = await documentationService.saveDocumentationItem({
      id,
      title,
      category,
      content,
      tags: tags || [],
      version: version || '1.0.0'
    });
    
    return res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error('Error saving documentation item:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save documentation item'
    });
  }
};

/**
 * Delete documentation item
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteDocumentationItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Item ID is required'
      });
    }
    
    const success = await documentationService.deleteDocumentationItem(id);
    
    return res.status(200).json({
      success,
      message: 'Documentation item deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting documentation item ${req.params.id}:`, error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Documentation item not found'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to delete documentation item'
    });
  }
};

/**
 * Search documentation
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const searchDocumentation = async (req, res) => {
  try {
    const { query, category } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const results = await documentationService.searchDocumentation(query, category || null);
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error searching documentation for ${req.query.query}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search documentation'
    });
  }
};

/**
 * Export documentation to static HTML
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportDocumentation = async (req, res) => {
  try {
    const { outputDir } = req.body;
    
    if (!outputDir) {
      return res.status(400).json({
        success: false,
        error: 'Output directory is required'
      });
    }
    
    const success = await documentationService.exportDocumentation(outputDir);
    
    return res.status(200).json({
      success,
      message: 'Documentation exported successfully'
    });
  } catch (error) {
    logger.error('Error exporting documentation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to export documentation'
    });
  }
};

/**
 * Generate table of contents for content
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateTableOfContents = async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    const toc = documentationService.generateTableOfContents(content);
    
    return res.status(200).json({
      success: true,
      data: toc
    });
  } catch (error) {
    logger.error('Error generating table of contents:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate table of contents'
    });
  }
};

module.exports = {
  getCategories,
  getDocumentationByCategory,
  getDocumentationItem,
  saveDocumentationItem,
  deleteDocumentationItem,
  searchDocumentation,
  exportDocumentation,
  generateTableOfContents
};
