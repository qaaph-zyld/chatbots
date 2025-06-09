/**
 * Theme Service
 * 
 * This service handles all operations related to chatbot themes,
 * including creation, retrieval, updating, and deletion.
 */

const mongoose = require('mongoose');
const axios = require('axios');
require('@src/modules\utils');
require('@src/modules\utils\errors');

// Define theme schema if not already defined
let Theme;
try {
  Theme = mongoose.model('Theme');
} catch (error) {
  const ThemeSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    colors: {
      primary: {
        type: String,
        default: '#336699'
      },
      secondary: {
        type: String,
        default: '#66AACC'
      },
      accent: {
        type: String,
        default: '#FF9900'
      },
      background: {
        type: String,
        default: '#FFFFFF'
      },
      text: {
        type: String,
        default: '#333333'
      },
      error: {
        type: String,
        default: '#FF3333'
      },
      success: {
        type: String,
        default: '#33CC66'
      },
      warning: {
        type: String,
        default: '#FFCC00'
      },
      info: {
        type: String,
        default: '#3399FF'
      }
    },
    typography: {
      fontFamily: {
        type: String,
        default: 'Roboto, sans-serif'
      },
      headingFontFamily: {
        type: String,
        default: 'Roboto, sans-serif'
      },
      fontSize: {
        type: String,
        default: '16px'
      },
      headingSizes: {
        h1: {
          type: String,
          default: '2rem'
        },
        h2: {
          type: String,
          default: '1.75rem'
        },
        h3: {
          type: String,
          default: '1.5rem'
        },
        h4: {
          type: String,
          default: '1.25rem'
        },
        h5: {
          type: String,
          default: '1.125rem'
        },
        h6: {
          type: String,
          default: '1rem'
        }
      },
      fontWeights: {
        normal: {
          type: Number,
          default: 400
        },
        bold: {
          type: Number,
          default: 700
        },
        light: {
          type: Number,
          default: 300
        }
      },
      lineHeight: {
        type: String,
        default: '1.5'
      }
    },
    spacing: {
      unit: {
        type: String,
        default: '1rem'
      },
      small: {
        type: String,
        default: '0.5rem'
      },
      medium: {
        type: String,
        default: '1rem'
      },
      large: {
        type: String,
        default: '2rem'
      },
      extraLarge: {
        type: String,
        default: '4rem'
      }
    },
    borders: {
      radius: {
        type: String,
        default: '0.25rem'
      },
      width: {
        type: String,
        default: '1px'
      },
      style: {
        type: String,
        default: 'solid'
      },
      color: {
        type: String,
        default: '#DDDDDD'
      }
    },
    shadows: {
      small: {
        type: String,
        default: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
      },
      medium: {
        type: String,
        default: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
      },
      large: {
        type: String,
        default: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)'
      }
    },
    animations: {
      transition: {
        type: String,
        default: 'all 0.3s ease'
      },
      duration: {
        type: String,
        default: '0.3s'
      },
      timing: {
        type: String,
        default: 'ease'
      }
    },
    layout: {
      containerWidth: {
        type: String,
        default: '1200px'
      },
      chatWidth: {
        type: String,
        default: '400px'
      },
      chatHeight: {
        type: String,
        default: '600px'
      },
      chatPosition: {
        type: String,
        default: 'right',
        enum: ['left', 'right', 'center']
      }
    },
    customCSS: {
      type: String,
      default: ''
    },
    previewImage: {
      type: String,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Pre-save hook to update the updatedAt field
  ThemeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });
  
  Theme = mongoose.model('Theme', ThemeSchema);
}

class ThemeService {
  constructor() {
    this.proxyConfig = {
      host: '104.129.196.38',
      port: 10563
    };
    
    // Configure axios with proxy
    this.httpClient = axios.create({
      proxy: this.proxyConfig
    });
    
    logger.info('Theme Service initialized');
  }

  /**
   * Create a new theme
   * @param {Object} themeData - Theme data
   * @param {String} userId - ID of the user creating the theme
   * @returns {Promise<Object>} Created theme
   */
  async createTheme(themeData, userId) {
    try {
      logger.info('Creating new theme', { userId });
      
      const theme = new Theme({
        ...themeData,
        creator: userId
      });
      
      await theme.save();
      
      logger.info('Theme created successfully', { themeId: theme._id });
      
      return theme;
    } catch (error) {
      logger.error('Error creating theme', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get theme by ID
   * @param {String} themeId - ID of the theme
   * @returns {Promise<Object>} Theme
   */
  async getThemeById(themeId) {
    try {
      logger.info('Getting theme by ID', { themeId });
      
      const theme = await Theme.findById(themeId);
      
      if (!theme) {
        throw new NotFoundError('Theme not found');
      }
      
      logger.info('Theme retrieved successfully', { themeId });
      
      return theme;
    } catch (error) {
      logger.error('Error getting theme', { error: error.message, themeId });
      throw error;
    }
  }

  /**
   * Update theme
   * @param {String} themeId - ID of the theme
   * @param {Object} themeData - Updated theme data
   * @param {String} userId - ID of the user updating the theme
   * @returns {Promise<Object>} Updated theme
   */
  async updateTheme(themeId, themeData, userId) {
    try {
      logger.info('Updating theme', { themeId, userId });
      
      // Check if theme exists and user has permission
      const theme = await Theme.findById(themeId);
      
      if (!theme) {
        throw new NotFoundError('Theme not found');
      }
      
      if (theme.creator.toString() !== userId) {
        throw new ValidationError('Only the theme creator can update it');
      }
      
      // Update theme
      const updatedTheme = await Theme.findByIdAndUpdate(
        themeId,
        {
          $set: {
            ...themeData,
            updatedAt: Date.now()
          }
        },
        { new: true }
      );
      
      logger.info('Theme updated successfully', { themeId });
      
      return updatedTheme;
    } catch (error) {
      logger.error('Error updating theme', { error: error.message, themeId, userId });
      throw error;
    }
  }

  /**
   * Delete theme
   * @param {String} themeId - ID of the theme
   * @param {String} userId - ID of the user deleting the theme
   * @returns {Promise<boolean>} Success status
   */
  async deleteTheme(themeId, userId) {
    try {
      logger.info('Deleting theme', { themeId, userId });
      
      // Check if theme exists and user has permission
      const theme = await Theme.findById(themeId);
      
      if (!theme) {
        throw new NotFoundError('Theme not found');
      }
      
      if (theme.creator.toString() !== userId) {
        throw new ValidationError('Only the theme creator can delete it');
      }
      
      // Prevent deletion of default themes
      if (theme.isDefault) {
        throw new ValidationError('Default themes cannot be deleted');
      }
      
      // Delete theme
      await Theme.findByIdAndDelete(themeId);
      
      logger.info('Theme deleted successfully', { themeId });
      
      return true;
    } catch (error) {
      logger.error('Error deleting theme', { error: error.message, themeId, userId });
      throw error;
    }
  }

  /**
   * Get all themes
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options (pagination, sorting)
   * @returns {Promise<Object>} Themes and count
   */
  async getThemes(filters = {}, options = {}) {
    try {
      logger.info('Getting themes', { filters });
      
      const query = {};
      
      // Apply filters
      if (filters.creator) {
        query.creator = filters.creator;
      }
      
      if (filters.isPublic !== undefined) {
        query.isPublic = filters.isPublic;
      }
      
      if (filters.isDefault !== undefined) {
        query.isDefault = filters.isDefault;
      }
      
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } }
        ];
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
      const [themes, totalCount] = await Promise.all([
        Theme.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('creator', 'username email'),
        
        Theme.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(totalCount / limit);
      
      logger.info('Themes retrieved successfully', { 
        count: themes.length,
        totalCount,
        page,
        totalPages
      });
      
      return {
        themes,
        pagination: {
          totalCount,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting themes', { error: error.message });
      throw error;
    }
  }

  /**
   * Apply theme to chatbot
   * @param {String} chatbotId - ID of the chatbot
   * @param {String} themeId - ID of the theme
   * @param {String} userId - ID of the user applying the theme
   * @returns {Promise<Object>} Updated chatbot
   */
  async applyThemeToChatbot(chatbotId, themeId, userId) {
    try {
      logger.info('Applying theme to chatbot', { chatbotId, themeId, userId });
      
      // Get theme
      const theme = await Theme.findById(themeId);
      
      if (!theme) {
        throw new NotFoundError('Theme not found');
      }
      
      // Check if theme is public or owned by user
      if (!theme.isPublic && theme.creator.toString() !== userId) {
        throw new ValidationError('You do not have permission to use this theme');
      }
      
      // Update chatbot with theme
      const Chatbot = mongoose.model('Chatbot');
      const updatedChatbot = await Chatbot.findByIdAndUpdate(
        chatbotId,
        {
          $set: {
            'appearance.theme': themeId,
            'appearance.colors': theme.colors,
            'appearance.typography': theme.typography,
            'appearance.spacing': theme.spacing,
            'appearance.borders': theme.borders,
            'appearance.shadows': theme.shadows,
            'appearance.animations': theme.animations,
            'appearance.layout': theme.layout,
            'appearance.customCSS': theme.customCSS,
            updatedAt: Date.now()
          }
        },
        { new: true }
      );
      
      if (!updatedChatbot) {
        throw new NotFoundError('Chatbot not found');
      }
      
      logger.info('Theme applied to chatbot successfully', { chatbotId, themeId });
      
      return updatedChatbot;
    } catch (error) {
      logger.error('Error applying theme to chatbot', { 
        error: error.message, 
        chatbotId, 
        themeId, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Generate CSS from theme
   * @param {String} themeId - ID of the theme
   * @returns {Promise<String>} Generated CSS
   */
  async generateCSSFromTheme(themeId) {
    try {
      logger.info('Generating CSS from theme', { themeId });
      
      // Get theme
      const theme = await Theme.findById(themeId);
      
      if (!theme) {
        throw new NotFoundError('Theme not found');
      }
      
      // Generate CSS
      let css = `
/* Generated CSS for theme: ${theme.name} */

:root {
  /* Colors */
  --primary-color: ${theme.colors.primary};
  --secondary-color: ${theme.colors.secondary};
  --accent-color: ${theme.colors.accent};
  --background-color: ${theme.colors.background};
  --text-color: ${theme.colors.text};
  --error-color: ${theme.colors.error};
  --success-color: ${theme.colors.success};
  --warning-color: ${theme.colors.warning};
  --info-color: ${theme.colors.info};
  
  /* Typography */
  --font-family: ${theme.typography.fontFamily};
  --heading-font-family: ${theme.typography.headingFontFamily};
  --font-size: ${theme.typography.fontSize};
  --h1-size: ${theme.typography.headingSizes.h1};
  --h2-size: ${theme.typography.headingSizes.h2};
  --h3-size: ${theme.typography.headingSizes.h3};
  --h4-size: ${theme.typography.headingSizes.h4};
  --h5-size: ${theme.typography.headingSizes.h5};
  --h6-size: ${theme.typography.headingSizes.h6};
  --font-weight-normal: ${theme.typography.fontWeights.normal};
  --font-weight-bold: ${theme.typography.fontWeights.bold};
  --font-weight-light: ${theme.typography.fontWeights.light};
  --line-height: ${theme.typography.lineHeight};
  
  /* Spacing */
  --spacing-unit: ${theme.spacing.unit};
  --spacing-small: ${theme.spacing.small};
  --spacing-medium: ${theme.spacing.medium};
  --spacing-large: ${theme.spacing.large};
  --spacing-xl: ${theme.spacing.extraLarge};
  
  /* Borders */
  --border-radius: ${theme.borders.radius};
  --border-width: ${theme.borders.width};
  --border-style: ${theme.borders.style};
  --border-color: ${theme.borders.color};
  
  /* Shadows */
  --shadow-small: ${theme.shadows.small};
  --shadow-medium: ${theme.shadows.medium};
  --shadow-large: ${theme.shadows.large};
  
  /* Animations */
  --transition: ${theme.animations.transition};
  --duration: ${theme.animations.duration};
  --timing: ${theme.animations.timing};
  
  /* Layout */
  --container-width: ${theme.layout.containerWidth};
  --chat-width: ${theme.layout.chatWidth};
  --chat-height: ${theme.layout.chatHeight};
}

/* Base Styles */
body {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: var(--line-height);
  color: var(--text-color);
  background-color: var(--background-color);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font-family);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-medium);
}

h1 { font-size: var(--h1-size); }
h2 { font-size: var(--h2-size); }
h3 { font-size: var(--h3-size); }
h4 { font-size: var(--h4-size); }
h5 { font-size: var(--h5-size); }
h6 { font-size: var(--h6-size); }

/* Chatbot Container */
.chatbot-container {
  width: var(--chat-width);
  height: var(--chat-height);
  background-color: var(--background-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-medium);
  overflow: hidden;
  transition: var(--transition);
}

/* Chatbot Header */
.chatbot-header {
  background-color: var(--primary-color);
  color: white;
  padding: var(--spacing-medium);
  font-weight: var(--font-weight-bold);
}

/* Chatbot Messages */
.chatbot-messages {
  padding: var(--spacing-medium);
  overflow-y: auto;
  height: calc(100% - 120px);
}

/* User Message */
.user-message {
  background-color: var(--primary-color);
  color: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-medium);
  align-self: flex-end;
  max-width: 80%;
}

/* Bot Message */
.bot-message {
  background-color: var(--secondary-color);
  color: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-medium);
  margin-bottom: var(--spacing-medium);
  align-self: flex-start;
  max-width: 80%;
}

/* Chatbot Input */
.chatbot-input {
  display: flex;
  padding: var(--spacing-medium);
  border-top: var(--border-width) var(--border-style) var(--border-color);
}

.chatbot-input input {
  flex: 1;
  padding: var(--spacing-medium);
  border: var(--border-width) var(--border-style) var(--border-color);
  border-radius: var(--border-radius);
  margin-right: var(--spacing-small);
}

.chatbot-input button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-small) var(--spacing-medium);
  cursor: pointer;
  transition: var(--transition);
}

.chatbot-input button:hover {
  background-color: var(--accent-color);
}

/* Buttons */
.btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: var(--spacing-small) var(--spacing-medium);
  cursor: pointer;
  transition: var(--transition);
}

.btn:hover {
  background-color: var(--accent-color);
}

.btn-secondary {
  background-color: var(--secondary-color);
}

.btn-accent {
  background-color: var(--accent-color);
}

/* Custom CSS */
${theme.customCSS}
`;
      
      logger.info('CSS generated successfully', { themeId });
      
      return css;
    } catch (error) {
      logger.error('Error generating CSS from theme', { error: error.message, themeId });
      throw error;
    }
  }

  /**
   * Create default themes
   * @returns {Promise<Array>} Created themes
   */
  async createDefaultThemes() {
    try {
      logger.info('Creating default themes');
      
      // Check if default themes already exist
      const existingDefaultThemes = await Theme.find({ isDefault: true });
      
      if (existingDefaultThemes.length > 0) {
        logger.info('Default themes already exist');
        return existingDefaultThemes;
      }
      
      // Create system user if not exists
      const User = mongoose.model('User');
      let systemUser = await User.findOne({ username: 'system' });
      
      if (!systemUser) {
        systemUser = new User({
          username: 'system',
          email: 'system@chatbotplatform.com',
          password: Math.random().toString(36).slice(-10), // Random password
          isSystem: true
        });
        
        await systemUser.save();
      }
      
      // Define default themes
      const defaultThemes = [
        {
          name: 'Light Theme',
          description: 'Default light theme with blue accents',
          creator: systemUser._id,
          isPublic: true,
          isDefault: true,
          colors: {
            primary: '#336699',
            secondary: '#66AACC',
            accent: '#FF9900',
            background: '#FFFFFF',
            text: '#333333',
            error: '#FF3333',
            success: '#33CC66',
            warning: '#FFCC00',
            info: '#3399FF'
          }
        },
        {
          name: 'Dark Theme',
          description: 'Default dark theme with blue accents',
          creator: systemUser._id,
          isPublic: true,
          isDefault: true,
          colors: {
            primary: '#336699',
            secondary: '#66AACC',
            accent: '#FF9900',
            background: '#222222',
            text: '#EEEEEE',
            error: '#FF5555',
            success: '#55DD88',
            warning: '#FFDD55',
            info: '#55AAFF'
          },
          typography: {
            fontFamily: 'Roboto, sans-serif',
            headingFontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            headingSizes: {
              h1: '2rem',
              h2: '1.75rem',
              h3: '1.5rem',
              h4: '1.25rem',
              h5: '1.125rem',
              h6: '1rem'
            },
            fontWeights: {
              normal: 400,
              bold: 700,
              light: 300
            },
            lineHeight: '1.5'
          }
        },
        {
          name: 'Minimal Theme',
          description: 'Clean and minimal theme with subtle styling',
          creator: systemUser._id,
          isPublic: true,
          isDefault: true,
          colors: {
            primary: '#555555',
            secondary: '#777777',
            accent: '#999999',
            background: '#FFFFFF',
            text: '#333333',
            error: '#FF3333',
            success: '#33CC66',
            warning: '#FFCC00',
            info: '#3399FF'
          },
          typography: {
            fontFamily: 'Inter, sans-serif',
            headingFontFamily: 'Inter, sans-serif',
            fontSize: '16px'
          },
          borders: {
            radius: '0.125rem',
            width: '1px',
            style: 'solid',
            color: '#EEEEEE'
          },
          shadows: {
            small: '0 1px 2px rgba(0,0,0,0.05)',
            medium: '0 2px 4px rgba(0,0,0,0.05)',
            large: '0 4px 8px rgba(0,0,0,0.05)'
          }
        },
        {
          name: 'Colorful Theme',
          description: 'Vibrant and colorful theme with rounded elements',
          creator: systemUser._id,
          isPublic: true,
          isDefault: true,
          colors: {
            primary: '#FF5555',
            secondary: '#55AAFF',
            accent: '#FFCC00',
            background: '#FFFFFF',
            text: '#333333',
            error: '#FF3333',
            success: '#33CC66',
            warning: '#FFCC00',
            info: '#3399FF'
          },
          typography: {
            fontFamily: 'Nunito, sans-serif',
            headingFontFamily: 'Nunito, sans-serif',
            fontSize: '16px'
          },
          borders: {
            radius: '1rem',
            width: '2px',
            style: 'solid',
            color: '#EEEEEE'
          },
          animations: {
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            duration: '0.4s',
            timing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }
        }
      ];
      
      // Create themes
      const createdThemes = await Promise.all(
        defaultThemes.map(themeData => {
          const theme = new Theme(themeData);
          return theme.save();
        })
      );
      
      logger.info('Default themes created successfully', { count: createdThemes.length });
      
      return createdThemes;
    } catch (error) {
      logger.error('Error creating default themes', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ThemeService();
