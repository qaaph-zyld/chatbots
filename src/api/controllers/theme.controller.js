/**
 * Theme Controller
 * 
 * Handles API requests for theme operations
 */

const themeService = require('../../services/theme.service');
const { logger } = require('../../utils');
const { NotFoundError, ValidationError } = require('../../utils/errors');

/**
 * Create a new theme
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createTheme = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const theme = await themeService.createTheme(req.body, userId);
    
    res.status(201).json({
      success: true,
      theme
    });
  } catch (error) {
    logger.error('Error in createTheme controller', {
      error: error.message,
      userId: req.user.id
    });
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create theme'
    });
  }
};

/**
 * Get theme by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getThemeById = async (req, res) => {
  try {
    const { themeId } = req.params;
    
    const theme = await themeService.getThemeById(themeId);
    
    res.status(200).json({
      success: true,
      theme
    });
  } catch (error) {
    logger.error('Error in getThemeById controller', {
      error: error.message,
      themeId: req.params.themeId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get theme'
    });
  }
};

/**
 * Update theme
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateTheme = async (req, res) => {
  try {
    const { themeId } = req.params;
    const userId = req.user.id;
    
    const theme = await themeService.updateTheme(themeId, req.body, userId);
    
    res.status(200).json({
      success: true,
      theme
    });
  } catch (error) {
    logger.error('Error in updateTheme controller', {
      error: error.message,
      userId: req.user.id,
      themeId: req.params.themeId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update theme'
    });
  }
};

/**
 * Delete theme
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteTheme = async (req, res) => {
  try {
    const { themeId } = req.params;
    const userId = req.user.id;
    
    await themeService.deleteTheme(themeId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Theme deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteTheme controller', {
      error: error.message,
      userId: req.user.id,
      themeId: req.params.themeId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete theme'
    });
  }
};

/**
 * Get all themes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getThemes = async (req, res) => {
  try {
    const filters = {
      creator: req.query.creator,
      isPublic: req.query.isPublic !== undefined ? req.query.isPublic === 'true' : undefined,
      isDefault: req.query.isDefault !== undefined ? req.query.isDefault === 'true' : undefined,
      search: req.query.search
    };
    
    const options = {
      page: req.query.page ? parseInt(req.query.page, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };
    
    const result = await themeService.getThemes(filters, options);
    
    res.status(200).json({
      success: true,
      themes: result.themes,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error in getThemes controller', {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get themes'
    });
  }
};

/**
 * Apply theme to chatbot
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.applyThemeToChatbot = async (req, res) => {
  try {
    const { chatbotId, themeId } = req.params;
    const userId = req.user.id;
    
    const chatbot = await themeService.applyThemeToChatbot(chatbotId, themeId, userId);
    
    res.status(200).json({
      success: true,
      chatbot
    });
  } catch (error) {
    logger.error('Error in applyThemeToChatbot controller', {
      error: error.message,
      userId: req.user.id,
      chatbotId: req.params.chatbotId,
      themeId: req.params.themeId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to apply theme to chatbot'
    });
  }
};

/**
 * Generate CSS from theme
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.generateCSSFromTheme = async (req, res) => {
  try {
    const { themeId } = req.params;
    
    const css = await themeService.generateCSSFromTheme(themeId);
    
    // Set content type to CSS
    res.set('Content-Type', 'text/css');
    res.status(200).send(css);
  } catch (error) {
    logger.error('Error in generateCSSFromTheme controller', {
      error: error.message,
      themeId: req.params.themeId
    });
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSS from theme'
    });
  }
};

/**
 * Create default themes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createDefaultThemes = async (req, res) => {
  try {
    const themes = await themeService.createDefaultThemes();
    
    res.status(200).json({
      success: true,
      themes,
      message: 'Default themes created successfully'
    });
  } catch (error) {
    logger.error('Error in createDefaultThemes controller', {
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create default themes'
    });
  }
};
