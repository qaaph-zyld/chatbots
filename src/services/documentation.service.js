/**
 * Documentation Service
 * 
 * Manages documentation content, search, and versioning
 */

const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
require('@src/utils');
require('@src/utils\indexedDB');

class DocumentationService {
  constructor() {
    this.docsDirectory = path.join(process.cwd(), 'data', 'docs');
    this.categories = [
      'getting-started',
      'chatbot-creation',
      'workflows',
      'components',
      'marketplace',
      'multilingual',
      'offline',
      'api',
      'deployment',
      'security',
      'troubleshooting',
      'contributing'
    ];
  }

  /**
   * Initialize the service
   * 
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Create docs directory if it doesn't exist
      await fs.mkdir(this.docsDirectory, { recursive: true });
      
      // Create category directories
      for (const category of this.categories) {
        await fs.mkdir(path.join(this.docsDirectory, category), { recursive: true });
      }
      
      logger.info('Documentation service initialized');
      return true;
    } catch (error) {
      logger.error('Error initializing documentation service:', error);
      return false;
    }
  }

  /**
   * Get all documentation categories
   * 
   * @returns {Promise<Array>} Categories
   */
  async getCategories() {
    try {
      return this.categories.map(category => ({
        id: category,
        name: this.formatCategoryName(category)
      }));
    } catch (error) {
      logger.error('Error getting documentation categories:', error);
      throw error;
    }
  }

  /**
   * Format category name for display
   * 
   * @param {string} category - Category ID
   * @returns {string} Formatted name
   */
  formatCategoryName(category) {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get documentation items by category
   * 
   * @param {string} category - Category ID
   * @returns {Promise<Array>} Documentation items
   */
  async getDocumentationByCategory(category) {
    try {
      // Check if category exists
      if (!this.categories.includes(category)) {
        throw new Error(`Category ${category} not found`);
      }
      
      // Get items from IndexedDB
      const items = await getAllDocumentationItems();
      
      // Filter by category
      return items.filter(item => item.category === category);
    } catch (error) {
      logger.error(`Error getting documentation for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get documentation item by ID
   * 
   * @param {string} id - Documentation item ID
   * @returns {Promise<Object>} Documentation item
   */
  async getDocumentationItem(id) {
    try {
      // Get item from IndexedDB
      const item = await getDocumentationItem(id);
      
      if (!item) {
        throw new Error(`Documentation item ${id} not found`);
      }
      
      // Read content from file
      const filePath = path.join(this.docsDirectory, item.category, `${id}.md`);
      const content = await fs.readFile(filePath, 'utf8');
      
      // Parse markdown to HTML
      const htmlContent = marked(content);
      
      return {
        ...item,
        content,
        htmlContent
      };
    } catch (error) {
      logger.error(`Error getting documentation item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create or update documentation item
   * 
   * @param {Object} item - Documentation item
   * @param {string} item.id - Item ID
   * @param {string} item.title - Item title
   * @param {string} item.category - Item category
   * @param {string} item.content - Item content (markdown)
   * @param {Array} item.tags - Item tags
   * @param {string} item.version - Item version
   * @returns {Promise<Object>} Created/updated item
   */
  async saveDocumentationItem(item) {
    try {
      // Validate item
      if (!item.id || !item.title || !item.category || !item.content) {
        throw new Error('Missing required fields');
      }
      
      // Check if category exists
      if (!this.categories.includes(item.category)) {
        throw new Error(`Category ${item.category} not found`);
      }
      
      // Create item object
      const docItem = {
        id: item.id,
        title: item.title,
        category: item.category,
        tags: item.tags || [],
        version: item.version || '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Check if item already exists
      const existingItem = await getDocumentationItem(item.id);
      if (existingItem) {
        docItem.createdAt = existingItem.createdAt;
      }
      
      // Save content to file
      const filePath = path.join(this.docsDirectory, item.category, `${item.id}.md`);
      await fs.writeFile(filePath, item.content);
      
      // Save item to IndexedDB
      await storeDocumentationItem(docItem);
      
      return docItem;
    } catch (error) {
      logger.error(`Error saving documentation item ${item.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete documentation item
   * 
   * @param {string} id - Documentation item ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteDocumentationItem(id) {
    try {
      // Get item from IndexedDB
      const item = await getDocumentationItem(id);
      
      if (!item) {
        throw new Error(`Documentation item ${id} not found`);
      }
      
      // Delete file
      const filePath = path.join(this.docsDirectory, item.category, `${id}.md`);
      await fs.unlink(filePath);
      
      // Delete from IndexedDB
      await deleteDocumentationItem(id);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting documentation item ${id}:`, error);
      throw error;
    }
  }

  /**
   * Search documentation
   * 
   * @param {string} query - Search query
   * @param {string} category - Category to search in (optional)
   * @returns {Promise<Array>} Search results
   */
  async searchDocumentation(query, category = null) {
    try {
      if (!query) {
        return [];
      }
      
      // Get all items from IndexedDB
      const items = await getAllDocumentationItems();
      
      // Filter by category if specified
      let filteredItems = items;
      if (category) {
        filteredItems = items.filter(item => item.category === category);
      }
      
      // Search in titles and tags
      const results = [];
      
      for (const item of filteredItems) {
        // Check title
        if (item.title.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            ...item,
            matchType: 'title'
          });
          continue;
        }
        
        // Check tags
        if (item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
          results.push({
            ...item,
            matchType: 'tag'
          });
          continue;
        }
        
        // Check content
        try {
          const filePath = path.join(this.docsDirectory, item.category, `${item.id}.md`);
          const content = await fs.readFile(filePath, 'utf8');
          
          if (content.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              ...item,
              matchType: 'content'
            });
          }
        } catch (error) {
          logger.warn(`Error reading content for item ${item.id}:`, error);
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error searching documentation for ${query}:`, error);
      throw error;
    }
  }

  /**
   * Generate table of contents for a documentation item
   * 
   * @param {string} content - Markdown content
   * @returns {Array} Table of contents
   */
  generateTableOfContents(content) {
    try {
      const toc = [];
      const lines = content.split('\n');
      
      for (const line of lines) {
        // Check for headings
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        
        if (headingMatch) {
          const level = headingMatch[1].length;
          const text = headingMatch[2].trim();
          const id = text.toLowerCase().replace(/[^\w]+/g, '-');
          
          toc.push({
            level,
            text,
            id
          });
        }
      }
      
      return toc;
    } catch (error) {
      logger.error('Error generating table of contents:', error);
      return [];
    }
  }

  /**
   * Export documentation to static HTML
   * 
   * @param {string} outputDir - Output directory
   * @returns {Promise<boolean>} Success status
   */
  async exportDocumentation(outputDir) {
    try {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });
      
      // Get all items
      const items = await getAllDocumentationItems();
      
      // Create index.html
      const categories = this.categories.map(category => ({
        id: category,
        name: this.formatCategoryName(category)
      }));
      
      const indexHtml = this.generateIndexHtml(categories);
      await fs.writeFile(path.join(outputDir, 'index.html'), indexHtml);
      
      // Create category pages
      for (const category of categories) {
        const categoryItems = items.filter(item => item.category === category.id);
        const categoryHtml = this.generateCategoryHtml(category, categoryItems);
        
        await fs.mkdir(path.join(outputDir, category.id), { recursive: true });
        await fs.writeFile(path.join(outputDir, category.id, 'index.html'), categoryHtml);
        
        // Create item pages
        for (const item of categoryItems) {
          try {
            const filePath = path.join(this.docsDirectory, item.category, `${item.id}.md`);
            const content = await fs.readFile(filePath, 'utf8');
            const htmlContent = marked(content);
            const toc = this.generateTableOfContents(content);
            
            const itemHtml = this.generateItemHtml(item, htmlContent, toc);
            await fs.writeFile(path.join(outputDir, item.category, `${item.id}.html`), itemHtml);
          } catch (error) {
            logger.warn(`Error exporting item ${item.id}:`, error);
          }
        }
      }
      
      // Copy assets
      // In a real implementation, this would copy CSS, JS, and images
      
      return true;
    } catch (error) {
      logger.error('Error exporting documentation:', error);
      throw error;
    }
  }

  /**
   * Generate index HTML
   * 
   * @param {Array} categories - Categories
   * @returns {string} HTML content
   */
  generateIndexHtml(categories) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chatbot Platform Documentation</title>
        <link rel="stylesheet" href="styles.css">
      </head>
      <body>
        <header>
          <h1>Chatbot Platform Documentation</h1>
        </header>
        <main>
          <div class="categories">
            ${categories.map(category => `
              <div class="category-card">
                <h2><a href="${category.id}/index.html">${category.name}</a></h2>
              </div>
            `).join('')}
          </div>
        </main>
        <footer>
          <p>&copy; ${new Date().getFullYear()} Chatbot Platform</p>
        </footer>
      </body>
      </html>
    `;
  }

  /**
   * Generate category HTML
   * 
   * @param {Object} category - Category
   * @param {Array} items - Category items
   * @returns {string} HTML content
   */
  generateCategoryHtml(category, items) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${category.name} - Chatbot Platform Documentation</title>
        <link rel="stylesheet" href="../styles.css">
      </head>
      <body>
        <header>
          <h1>${category.name}</h1>
          <nav>
            <a href="../index.html">Home</a>
          </nav>
        </header>
        <main>
          <div class="items">
            ${items.map(item => `
              <div class="item-card">
                <h2><a href="${item.id}.html">${item.title}</a></h2>
                <div class="tags">
                  ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </main>
        <footer>
          <p>&copy; ${new Date().getFullYear()} Chatbot Platform</p>
        </footer>
      </body>
      </html>
    `;
  }

  /**
   * Generate item HTML
   * 
   * @param {Object} item - Documentation item
   * @param {string} htmlContent - HTML content
   * @param {Array} toc - Table of contents
   * @returns {string} HTML content
   */
  generateItemHtml(item, htmlContent, toc) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${item.title} - Chatbot Platform Documentation</title>
        <link rel="stylesheet" href="../styles.css">
      </head>
      <body>
        <header>
          <h1>${item.title}</h1>
          <nav>
            <a href="../index.html">Home</a>
            <a href="index.html">${this.formatCategoryName(item.category)}</a>
          </nav>
        </header>
        <main>
          <div class="content-wrapper">
            ${toc.length > 0 ? `
              <div class="toc">
                <h2>Table of Contents</h2>
                <ul>
                  ${toc.map(heading => `
                    <li class="toc-level-${heading.level}">
                      <a href="#${heading.id}">${heading.text}</a>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            <div class="content">
              ${htmlContent}
            </div>
          </div>
        </main>
        <footer>
          <p>&copy; ${new Date().getFullYear()} Chatbot Platform</p>
        </footer>
      </body>
      </html>
    `;
  }
}

module.exports = new DocumentationService();
