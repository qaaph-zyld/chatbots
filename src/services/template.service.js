/**
 * Template Service
 * 
 * This service handles all operations related to chatbot templates,
 * including creation, retrieval, updating, and deletion.
 */

const Template = require('../models/template.model');
const ChatbotService = require('./chatbot.service');
const logger = require('../utils/logger');

class TemplateService {
  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @param {String} userId - ID of the user creating the template
   * @returns {Promise<Object>} Created template
   */
  async createTemplate(templateData, userId) {
    try {
      logger.info('Creating new template', { userId });
      
      const template = new Template({
        ...templateData,
        creator: userId
      });
      
      await template.save();
      
      logger.info('Template created successfully', { templateId: template._id });
      
      return template;
    } catch (error) {
      logger.error('Error creating template', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Create a template from an existing chatbot
   * @param {String} chatbotId - ID of the chatbot to create template from
   * @param {Object} templateData - Additional template data
   * @param {String} userId - ID of the user creating the template
   * @returns {Promise<Object>} Created template
   */
  async createTemplateFromChatbot(chatbotId, templateData, userId) {
    try {
      logger.info('Creating template from chatbot', { chatbotId, userId });
      
      // Get chatbot data
      const chatbotService = new ChatbotService();
      const chatbot = await chatbotService.getChatbotById(chatbotId);
      
      if (!chatbot) {
        throw new Error('Chatbot not found');
      }
      
      // Extract configuration from chatbot
      const configuration = {
        personality: chatbot.personality,
        knowledgeBase: chatbot.knowledgeBase,
        defaultResponses: chatbot.defaultResponses,
        plugins: chatbot.plugins,
        integrations: chatbot.integrations
      };
      
      // Create template
      const template = new Template({
        name: templateData.name || `${chatbot.name} Template`,
        description: templateData.description || `Template created from ${chatbot.name}`,
        category: templateData.category || 'other',
        tags: templateData.tags || [],
        configuration,
        previewImage: templateData.previewImage || null,
        featured: false,
        official: false,
        creator: userId,
        isPublic: templateData.isPublic !== undefined ? templateData.isPublic : true,
        status: templateData.status || 'published'
      });
      
      await template.save();
      
      logger.info('Template created from chatbot successfully', { 
        templateId: template._id, 
        chatbotId 
      });
      
      return template;
    } catch (error) {
      logger.error('Error creating template from chatbot', { 
        error: error.message, 
        chatbotId, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Get template by ID
   * @param {String} templateId - Template ID
   * @returns {Promise<Object>} Template
   */
  async getTemplateById(templateId) {
    try {
      logger.info('Getting template by ID', { templateId });
      
      const template = await Template.findById(templateId);
      
      if (!template) {
        logger.warn('Template not found', { templateId });
        return null;
      }
      
      return template;
    } catch (error) {
      logger.error('Error getting template by ID', { error: error.message, templateId });
      throw error;
    }
  }

  /**
   * Update template
   * @param {String} templateId - Template ID
   * @param {Object} updateData - Data to update
   * @param {String} userId - ID of the user updating the template
   * @returns {Promise<Object>} Updated template
   */
  async updateTemplate(templateId, updateData, userId) {
    try {
      logger.info('Updating template', { templateId, userId });
      
      const template = await Template.findById(templateId);
      
      if (!template) {
        logger.warn('Template not found for update', { templateId });
        throw new Error('Template not found');
      }
      
      // Check if user is the creator or an admin (admin check would be implemented elsewhere)
      if (template.creator.toString() !== userId) {
        logger.warn('Unauthorized template update attempt', { templateId, userId });
        throw new Error('Unauthorized to update this template');
      }
      
      // Update fields
      const allowedFields = [
        'name', 'description', 'category', 'tags', 'configuration',
        'previewImage', 'isPublic', 'status'
      ];
      
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          template[field] = updateData[field];
        }
      });
      
      await template.save();
      
      logger.info('Template updated successfully', { templateId });
      
      return template;
    } catch (error) {
      logger.error('Error updating template', { error: error.message, templateId, userId });
      throw error;
    }
  }

  /**
   * Delete template
   * @param {String} templateId - Template ID
   * @param {String} userId - ID of the user deleting the template
   * @returns {Promise<Boolean>} Success status
   */
  async deleteTemplate(templateId, userId) {
    try {
      logger.info('Deleting template', { templateId, userId });
      
      const template = await Template.findById(templateId);
      
      if (!template) {
        logger.warn('Template not found for deletion', { templateId });
        throw new Error('Template not found');
      }
      
      // Check if user is the creator or an admin
      if (template.creator.toString() !== userId) {
        logger.warn('Unauthorized template deletion attempt', { templateId, userId });
        throw new Error('Unauthorized to delete this template');
      }
      
      await Template.findByIdAndDelete(templateId);
      
      logger.info('Template deleted successfully', { templateId });
      
      return true;
    } catch (error) {
      logger.error('Error deleting template', { error: error.message, templateId, userId });
      throw error;
    }
  }

  /**
   * Create chatbot from template
   * @param {String} templateId - Template ID
   * @param {Object} chatbotData - Additional chatbot data
   * @param {String} userId - ID of the user creating the chatbot
   * @returns {Promise<Object>} Created chatbot
   */
  async createChatbotFromTemplate(templateId, chatbotData, userId) {
    try {
      logger.info('Creating chatbot from template', { templateId, userId });
      
      const template = await Template.findById(templateId);
      
      if (!template) {
        logger.warn('Template not found for chatbot creation', { templateId });
        throw new Error('Template not found');
      }
      
      // Increment template usage count
      await template.incrementUsage();
      
      // Extract configuration from template
      const { configuration } = template;
      
      // Create chatbot
      const chatbotService = new ChatbotService();
      const chatbot = await chatbotService.createChatbot({
        name: chatbotData.name || `${template.name} Chatbot`,
        description: chatbotData.description || template.description,
        personality: configuration.personality,
        knowledgeBase: configuration.knowledgeBase,
        defaultResponses: configuration.defaultResponses,
        plugins: configuration.plugins,
        integrations: configuration.integrations,
        ...chatbotData
      }, userId);
      
      logger.info('Chatbot created from template successfully', { 
        chatbotId: chatbot._id, 
        templateId 
      });
      
      return chatbot;
    } catch (error) {
      logger.error('Error creating chatbot from template', { 
        error: error.message, 
        templateId, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Get featured templates
   * @param {Number} limit - Maximum number of templates to return
   * @returns {Promise<Array>} Featured templates
   */
  async getFeaturedTemplates(limit = 5) {
    try {
      logger.info('Getting featured templates', { limit });
      
      const templates = await Template.findFeatured(limit);
      
      return templates;
    } catch (error) {
      logger.error('Error getting featured templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Get popular templates
   * @param {Number} limit - Maximum number of templates to return
   * @returns {Promise<Array>} Popular templates
   */
  async getPopularTemplates(limit = 10) {
    try {
      logger.info('Getting popular templates', { limit });
      
      const templates = await Template.findPopular(limit);
      
      return templates;
    } catch (error) {
      logger.error('Error getting popular templates', { error: error.message });
      throw error;
    }
  }

  /**
   * Get templates by category
   * @param {String} category - Category
   * @param {Number} limit - Maximum number of templates to return
   * @returns {Promise<Array>} Templates in the category
   */
  async getTemplatesByCategory(category, limit = 20) {
    try {
      logger.info('Getting templates by category', { category, limit });
      
      const templates = await Template.findByCategory(category, limit);
      
      return templates;
    } catch (error) {
      logger.error('Error getting templates by category', { 
        error: error.message, 
        category 
      });
      throw error;
    }
  }

  /**
   * Search templates
   * @param {String} query - Search query
   * @param {Number} limit - Maximum number of templates to return
   * @returns {Promise<Array>} Matching templates
   */
  async searchTemplates(query, limit = 20) {
    try {
      logger.info('Searching templates', { query, limit });
      
      const templates = await Template.search(query, limit);
      
      return templates;
    } catch (error) {
      logger.error('Error searching templates', { error: error.message, query });
      throw error;
    }
  }

  /**
   * Get templates created by a user
   * @param {String} userId - User ID
   * @param {Number} limit - Maximum number of templates to return
   * @returns {Promise<Array>} User's templates
   */
  async getUserTemplates(userId, limit = 20) {
    try {
      logger.info('Getting user templates', { userId, limit });
      
      const templates = await Template.find({ creator: userId })
        .sort({ createdAt: -1 })
        .limit(limit);
      
      return templates;
    } catch (error) {
      logger.error('Error getting user templates', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Add review to template
   * @param {String} templateId - Template ID
   * @param {String} userId - User ID
   * @param {Number} rating - Rating (1-5)
   * @param {String} comment - Review comment
   * @returns {Promise<Object>} Updated template
   */
  async addReview(templateId, userId, rating, comment) {
    try {
      logger.info('Adding review to template', { templateId, userId, rating });
      
      const template = await Template.findById(templateId);
      
      if (!template) {
        logger.warn('Template not found for review', { templateId });
        throw new Error('Template not found');
      }
      
      await template.addReview(userId, rating, comment);
      
      logger.info('Review added to template successfully', { templateId, userId });
      
      return template;
    } catch (error) {
      logger.error('Error adding review to template', { 
        error: error.message, 
        templateId, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Export template to JSON
   * @param {String} templateId - Template ID
   * @returns {Promise<Object>} Template JSON
   */
  async exportTemplate(templateId) {
    try {
      logger.info('Exporting template', { templateId });
      
      const template = await Template.findById(templateId);
      
      if (!template) {
        logger.warn('Template not found for export', { templateId });
        throw new Error('Template not found');
      }
      
      // Create export object with essential data
      const exportData = {
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags,
        configuration: template.configuration,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      logger.info('Template exported successfully', { templateId });
      
      return exportData;
    } catch (error) {
      logger.error('Error exporting template', { error: error.message, templateId });
      throw error;
    }
  }

  /**
   * Import template from JSON
   * @param {Object} importData - Template import data
   * @param {String} userId - ID of the user importing the template
   * @returns {Promise<Object>} Imported template
   */
  async importTemplate(importData, userId) {
    try {
      logger.info('Importing template', { userId });
      
      // Validate import data
      if (!importData.name || !importData.configuration) {
        throw new Error('Invalid template import data');
      }
      
      // Create template from import data
      const template = new Template({
        name: importData.name,
        description: importData.description || 'Imported template',
        category: importData.category || 'other',
        tags: importData.tags || [],
        configuration: importData.configuration,
        creator: userId,
        isPublic: false,
        status: 'draft'
      });
      
      await template.save();
      
      logger.info('Template imported successfully', { templateId: template._id });
      
      return template;
    } catch (error) {
      logger.error('Error importing template', { error: error.message, userId });
      throw error;
    }
  }
}

module.exports = new TemplateService();
