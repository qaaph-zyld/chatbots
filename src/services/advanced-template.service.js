/**
 * Advanced Template Service
 * 
 * This service extends the basic template functionality with advanced features:
 * - Template inheritance and composition
 * - Dynamic variables and conditional logic
 * - Custom styling and theming
 * - Advanced workflow integration
 * - Template versioning
 */

const axios = require('axios');
const mongoose = require('mongoose');
const Template = require('../models/template.model');
const TemplateService = require('./template.service');
const logger = require('../utils/logger');
const { NotFoundError, ValidationError } = require('../utils/errors');

class AdvancedTemplateService {
  constructor() {
    this.templateService = TemplateService;
    this.proxyConfig = {
      host: '104.129.196.38',
      port: 10563
    };
    
    // Configure axios with proxy
    this.httpClient = axios.create({
      proxy: this.proxyConfig
    });
    
    logger.info('Advanced Template Service initialized');
  }

  /**
   * Create a template with inheritance from a parent template
   * @param {String} parentTemplateId - ID of the parent template
   * @param {Object} templateData - New template data (will override parent values)
   * @param {String} userId - ID of the user creating the template
   * @returns {Promise<Object>} Created template
   */
  async createTemplateWithInheritance(parentTemplateId, templateData, userId) {
    try {
      logger.info('Creating template with inheritance', { parentTemplateId, userId });
      
      // Get parent template
      const parentTemplate = await this.templateService.getTemplateById(parentTemplateId);
      
      if (!parentTemplate) {
        throw new NotFoundError('Parent template not found');
      }
      
      // Merge configuration with parent (parent values as defaults)
      const mergedConfiguration = {
        ...parentTemplate.configuration,
        ...(templateData.configuration || {})
      };
      
      // Create template with inheritance information
      const template = new Template({
        name: templateData.name || `${parentTemplate.name} Child`,
        description: templateData.description || `Template inherited from ${parentTemplate.name}`,
        category: templateData.category || parentTemplate.category,
        tags: templateData.tags || [...parentTemplate.tags],
        configuration: mergedConfiguration,
        previewImage: templateData.previewImage || parentTemplate.previewImage,
        featured: false,
        official: false,
        creator: userId,
        isPublic: templateData.isPublic !== undefined ? templateData.isPublic : true,
        status: templateData.status || 'published',
        metadata: {
          ...(parentTemplate.metadata || {}),
          ...(templateData.metadata || {}),
          inheritance: {
            parentId: parentTemplateId,
            parentVersion: parentTemplate.version,
            inheritedAt: new Date()
          }
        }
      });
      
      await template.save();
      
      logger.info('Template created with inheritance successfully', { 
        templateId: template._id, 
        parentTemplateId 
      });
      
      return template;
    } catch (error) {
      logger.error('Error creating template with inheritance', { 
        error: error.message, 
        parentTemplateId, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Create a composite template from multiple source templates
   * @param {Array<String>} sourceTemplateIds - IDs of source templates
   * @param {Object} templateData - Additional template data
   * @param {Object} compositionRules - Rules for resolving conflicts between sources
   * @param {String} userId - ID of the user creating the template
   * @returns {Promise<Object>} Created template
   */
  async createCompositeTemplate(sourceTemplateIds, templateData, compositionRules = {}, userId) {
    try {
      logger.info('Creating composite template', { sourceTemplateIds, userId });
      
      if (!Array.isArray(sourceTemplateIds) || sourceTemplateIds.length < 2) {
        throw new ValidationError('At least two source templates are required for composition');
      }
      
      // Get all source templates
      const sourceTemplates = await Promise.all(
        sourceTemplateIds.map(id => this.templateService.getTemplateById(id))
      );
      
      // Check if all templates exist
      if (sourceTemplates.some(template => !template)) {
        throw new NotFoundError('One or more source templates not found');
      }
      
      // Merge configurations based on composition rules
      const mergedConfiguration = this._mergeConfigurations(
        sourceTemplates.map(template => template.configuration),
        compositionRules
      );
      
      // Merge tags
      const mergedTags = [...new Set(
        sourceTemplates.flatMap(template => template.tags || [])
      )];
      
      // Create composite template
      const template = new Template({
        name: templateData.name || 'Composite Template',
        description: templateData.description || `Template composed from ${sourceTemplates.length} sources`,
        category: templateData.category || sourceTemplates[0].category,
        tags: templateData.tags || mergedTags,
        configuration: mergedConfiguration,
        previewImage: templateData.previewImage || sourceTemplates[0].previewImage,
        featured: false,
        official: false,
        creator: userId,
        isPublic: templateData.isPublic !== undefined ? templateData.isPublic : true,
        status: templateData.status || 'published',
        metadata: {
          ...(templateData.metadata || {}),
          composition: {
            sourceIds: sourceTemplateIds,
            composedAt: new Date(),
            compositionRules
          }
        }
      });
      
      await template.save();
      
      logger.info('Composite template created successfully', { 
        templateId: template._id, 
        sourceCount: sourceTemplateIds.length 
      });
      
      return template;
    } catch (error) {
      logger.error('Error creating composite template', { 
        error: error.message, 
        sourceTemplateIds, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Create a new version of an existing template
   * @param {String} templateId - ID of the template to version
   * @param {Object} changes - Changes to apply to the new version
   * @param {String} userId - ID of the user creating the version
   * @returns {Promise<Object>} Created template version
   */
  async createTemplateVersion(templateId, changes, userId) {
    try {
      logger.info('Creating new template version', { templateId, userId });
      
      // Get original template
      const originalTemplate = await this.templateService.getTemplateById(templateId);
      
      if (!originalTemplate) {
        throw new NotFoundError('Template not found');
      }
      
      // Check if user has permission
      if (originalTemplate.creator.toString() !== userId && !changes.forkedVersion) {
        throw new ValidationError('Only the template creator can create new versions');
      }
      
      // Determine version number
      const currentVersion = originalTemplate.version || 1;
      const newVersion = changes.forkedVersion ? 1 : currentVersion + 1;
      
      // Create new template version
      const templateVersion = new Template({
        name: changes.name || originalTemplate.name,
        description: changes.description || originalTemplate.description,
        category: changes.category || originalTemplate.category,
        tags: changes.tags || [...originalTemplate.tags],
        configuration: {
          ...originalTemplate.configuration,
          ...(changes.configuration || {})
        },
        previewImage: changes.previewImage || originalTemplate.previewImage,
        featured: false,
        official: originalTemplate.official,
        creator: changes.forkedVersion ? userId : originalTemplate.creator,
        isPublic: changes.isPublic !== undefined ? changes.isPublic : originalTemplate.isPublic,
        status: changes.status || 'published',
        version: newVersion,
        metadata: {
          ...(originalTemplate.metadata || {}),
          ...(changes.metadata || {}),
          versioning: {
            originalId: changes.forkedVersion ? templateId : (originalTemplate.metadata?.versioning?.originalId || templateId),
            previousVersion: changes.forkedVersion ? null : currentVersion,
            versionedAt: new Date(),
            changeLog: changes.changeLog || 'Updated template',
            forked: !!changes.forkedVersion
          }
        }
      });
      
      await templateVersion.save();
      
      // If not a fork, update the original template to point to the latest version
      if (!changes.forkedVersion) {
        await Template.findByIdAndUpdate(templateId, {
          $set: {
            'metadata.versioning.latestVersion': newVersion,
            'metadata.versioning.latestVersionId': templateVersion._id
          }
        });
      }
      
      logger.info('Template version created successfully', { 
        templateId: templateVersion._id, 
        originalId: templateId,
        version: newVersion,
        forked: !!changes.forkedVersion
      });
      
      return templateVersion;
    } catch (error) {
      logger.error('Error creating template version', { 
        error: error.message, 
        templateId, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Apply dynamic variables to a template
   * @param {String} templateId - ID of the template
   * @param {Object} variables - Variables to apply
   * @returns {Promise<Object>} Template with applied variables
   */
  async applyTemplateVariables(templateId, variables) {
    try {
      logger.info('Applying variables to template', { templateId });
      
      // Get template
      const template = await this.templateService.getTemplateById(templateId);
      
      if (!template) {
        throw new NotFoundError('Template not found');
      }
      
      // Clone the template configuration
      const processedConfiguration = JSON.parse(JSON.stringify(template.configuration));
      
      // Apply variables to configuration
      this._processVariables(processedConfiguration, variables);
      
      logger.info('Variables applied to template successfully', { templateId });
      
      return {
        ...template.toObject(),
        configuration: processedConfiguration,
        appliedVariables: variables
      };
    } catch (error) {
      logger.error('Error applying variables to template', { 
        error: error.message, 
        templateId 
      });
      throw error;
    }
  }

  /**
   * Get template variables schema
   * @param {String} templateId - ID of the template
   * @returns {Promise<Object>} Template variables schema
   */
  async getTemplateVariablesSchema(templateId) {
    try {
      logger.info('Getting template variables schema', { templateId });
      
      // Get template
      const template = await this.templateService.getTemplateById(templateId);
      
      if (!template) {
        throw new NotFoundError('Template not found');
      }
      
      // Extract variables schema from metadata
      const variablesSchema = template.metadata?.variablesSchema || {};
      
      // If no schema is defined, generate one by scanning the configuration
      if (Object.keys(variablesSchema).length === 0) {
        const generatedSchema = this._generateVariablesSchema(template.configuration);
        
        logger.info('Generated variables schema for template', { 
          templateId,
          variableCount: Object.keys(generatedSchema).length
        });
        
        return generatedSchema;
      }
      
      logger.info('Retrieved template variables schema', { templateId });
      
      return variablesSchema;
    } catch (error) {
      logger.error('Error getting template variables schema', { 
        error: error.message, 
        templateId 
      });
      throw error;
    }
  }

  /**
   * Set template styling options
   * @param {String} templateId - ID of the template
   * @param {Object} styling - Styling options
   * @param {String} userId - ID of the user updating the template
   * @returns {Promise<Object>} Updated template
   */
  async setTemplateStyling(templateId, styling, userId) {
    try {
      logger.info('Setting template styling', { templateId, userId });
      
      // Get template
      const template = await this.templateService.getTemplateById(templateId);
      
      if (!template) {
        throw new NotFoundError('Template not found');
      }
      
      // Check if user has permission
      if (template.creator.toString() !== userId) {
        throw new ValidationError('Only the template creator can update styling');
      }
      
      // Update template styling
      const updatedTemplate = await Template.findByIdAndUpdate(
        templateId,
        {
          $set: {
            'metadata.styling': styling
          }
        },
        { new: true }
      );
      
      logger.info('Template styling updated successfully', { templateId });
      
      return updatedTemplate;
    } catch (error) {
      logger.error('Error setting template styling', { 
        error: error.message, 
        templateId, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Get templates with advanced filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options (pagination, sorting)
   * @returns {Promise<Object>} Templates and count
   */
  async getTemplatesAdvanced(filters = {}, options = {}) {
    try {
      logger.info('Getting templates with advanced filtering');
      
      const query = {};
      
      // Apply filters
      if (filters.categories && filters.categories.length > 0) {
        query.category = { $in: filters.categories };
      }
      
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $all: filters.tags };
      }
      
      if (filters.creator) {
        query.creator = filters.creator;
      }
      
      if (filters.isPublic !== undefined) {
        query.isPublic = filters.isPublic;
      }
      
      if (filters.featured !== undefined) {
        query.featured = filters.featured;
      }
      
      if (filters.official !== undefined) {
        query.official = filters.official;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
      }
      
      // Advanced filters
      if (filters.hasVariables) {
        query['metadata.variablesSchema'] = { $exists: true, $ne: {} };
      }
      
      if (filters.hasStyling) {
        query['metadata.styling'] = { $exists: true, $ne: {} };
      }
      
      if (filters.isComposite) {
        query['metadata.composition'] = { $exists: true };
      }
      
      if (filters.isInherited) {
        query['metadata.inheritance'] = { $exists: true };
      }
      
      if (filters.minVersion) {
        query.version = { $gte: filters.minVersion };
      }
      
      // Set up pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;
      
      // Set up sorting
      const sort = {};
      if (options.sortBy) {
        sort[options.sortBy] = options.sortOrder === 'desc' ? -1 : 1;
      } else {
        sort.createdAt = -1; // Default sort by creation date, newest first
      }
      
      // Execute query
      const [templates, totalCount] = await Promise.all([
        Template.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('creator', 'username email'),
        
        Template.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      logger.info('Retrieved templates with advanced filtering', { 
        count: templates.length,
        totalCount,
        page,
        totalPages
      });
      
      return {
        templates,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting templates with advanced filtering', { 
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Helper method to merge configurations from multiple templates
   * @private
   * @param {Array<Object>} configurations - Array of configurations to merge
   * @param {Object} rules - Rules for resolving conflicts
   * @returns {Object} Merged configuration
   */
  _mergeConfigurations(configurations, rules = {}) {
    // Default strategy is to use the last configuration's value for conflicts
    const strategy = rules.strategy || 'last-wins';
    
    const result = {};
    
    // Helper to get the value based on strategy
    const resolveConflict = (key, values) => {
      switch (strategy) {
        case 'first-wins':
          return values[0];
        case 'last-wins':
          return values[values.length - 1];
        case 'custom':
          if (rules.customResolvers && rules.customResolvers[key]) {
            return rules.customResolvers[key](values);
          }
          return values[values.length - 1];
        default:
          return values[values.length - 1];
      }
    };
    
    // Process each configuration
    configurations.forEach(config => {
      Object.entries(config).forEach(([key, value]) => {
        if (result[key] === undefined) {
          // No conflict, just set the value
          result[key] = value;
        } else if (Array.isArray(result[key]) && Array.isArray(value)) {
          // Merge arrays based on rules
          if (rules.arrayMergeStrategy === 'concat') {
            result[key] = [...result[key], ...value];
          } else if (rules.arrayMergeStrategy === 'unique') {
            result[key] = [...new Set([...result[key], ...value])];
          } else {
            // Default to replacement
            result[key] = resolveConflict(key, [result[key], value]);
          }
        } else if (typeof result[key] === 'object' && typeof value === 'object' && !Array.isArray(result[key]) && !Array.isArray(value)) {
          // Recursively merge nested objects
          result[key] = this._mergeConfigurations([result[key], value], rules);
        } else {
          // Resolve conflict for primitive values
          result[key] = resolveConflict(key, [result[key], value]);
        }
      });
    });
    
    return result;
  }

  /**
   * Helper method to process variables in a configuration
   * @private
   * @param {Object} obj - Object to process
   * @param {Object} variables - Variables to apply
   */
  _processVariables(obj, variables) {
    if (!obj || typeof obj !== 'object') return;
    
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Replace variables in strings
        obj[key] = this._replaceVariables(value, variables);
      } else if (typeof value === 'object') {
        // Recursively process nested objects and arrays
        this._processVariables(value, variables);
      }
    });
  }

  /**
   * Helper method to replace variables in a string
   * @private
   * @param {String} str - String to process
   * @param {Object} variables - Variables to apply
   * @returns {String} Processed string
   */
  _replaceVariables(str, variables) {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const trimmedVarName = varName.trim();
      
      // Check for conditional syntax: {{varName ? trueValue : falseValue}}
      if (trimmedVarName.includes('?')) {
        const [condition, values] = trimmedVarName.split('?').map(part => part.trim());
        const [trueValue, falseValue] = values.split(':').map(part => part.trim());
        
        return variables[condition] ? 
          this._replaceVariables(trueValue, variables) : 
          this._replaceVariables(falseValue || '', variables);
      }
      
      // Check for nested properties: {{user.name}}
      if (trimmedVarName.includes('.')) {
        const parts = trimmedVarName.split('.');
        let value = variables;
        
        for (const part of parts) {
          if (value === undefined || value === null) return match;
          value = value[part];
        }
        
        return value !== undefined ? value : match;
      }
      
      // Simple variable replacement
      return variables[trimmedVarName] !== undefined ? 
        variables[trimmedVarName] : 
        match;
    });
  }

  /**
   * Helper method to generate a variables schema from a configuration
   * @private
   * @param {Object} configuration - Configuration to scan
   * @returns {Object} Variables schema
   */
  _generateVariablesSchema(configuration) {
    const schema = {};
    const variableRegex = /\{\{([^}?:]+)(?:\?[^}]*)?}}/g;
    
    // Helper to scan an object for variables
    const scanForVariables = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.values(obj).forEach(value => {
        if (typeof value === 'string') {
          // Extract variables from string
          let match;
          while ((match = variableRegex.exec(value)) !== null) {
            const varName = match[1].trim();
            
            // Handle nested properties
            const baseName = varName.split('.')[0];
            
            if (!schema[baseName]) {
              schema[baseName] = {
                type: 'string',
                description: `Variable ${baseName}`,
                required: false
              };
            }
          }
        } else if (typeof value === 'object') {
          // Recursively scan nested objects and arrays
          scanForVariables(value);
        }
      });
    };
    
    scanForVariables(configuration);
    
    return schema;
  }
}

module.exports = new AdvancedTemplateService();
