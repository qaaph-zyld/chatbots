/**
 * Local Storage Service
 * 
 * Provides a local storage implementation for chatbot data
 * Supports file-based and SQLite storage options
 */

const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils');

/**
 * Local Storage Service class
 */
class LocalStorageService {
  /**
   * Constructor
   * @param {Object} options - Storage options
   */
  constructor(options = {}) {
    this.options = {
      storageType: process.env.LOCAL_STORAGE_TYPE || 'file', // 'file' or 'sqlite'
      basePath: process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'data'),
      sqliteDbPath: process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'chatbot.db'),
      ...options
    };
    
    this.db = null;
    this.initialized = false;
    this.initPromise = null;
    
    logger.info(`Local Storage Service initialized with type: ${this.options.storageType}`);
  }
  
  /**
   * Initialize the storage service
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise(async (resolve) => {
      try {
        if (this.options.storageType === 'file') {
          await this._initializeFileStorage();
        } else if (this.options.storageType === 'sqlite') {
          await this._initializeSqliteStorage();
        } else {
          throw new Error(`Unsupported storage type: ${this.options.storageType}`);
        }
        
        this.initialized = true;
        logger.info('Local Storage Service initialized successfully');
        resolve(true);
      } catch (error) {
        logger.error('Error initializing Local Storage Service:', error.message);
        resolve(false);
      }
    });
    
    return this.initPromise;
  }
  
  /**
   * Initialize file-based storage
   * @private
   */
  async _initializeFileStorage() {
    // Create base directory if it doesn't exist
    try {
      await fs.mkdir(this.options.basePath, { recursive: true });
      
      // Create subdirectories for different data types
      const subdirs = ['conversations', 'users', 'bots', 'messages', 'settings'];
      
      for (const subdir of subdirs) {
        const dirPath = path.join(this.options.basePath, subdir);
        await fs.mkdir(dirPath, { recursive: true });
      }
      
      logger.info('File storage directories created successfully');
    } catch (error) {
      logger.error('Error creating file storage directories:', error.message);
      throw error;
    }
  }
  
  /**
   * Initialize SQLite storage
   * @private
   */
  async _initializeSqliteStorage() {
    try {
      // Create directory for SQLite database if it doesn't exist
      const dbDir = path.dirname(this.options.sqliteDbPath);
      await fs.mkdir(dbDir, { recursive: true });
      
      // Open database connection
      this.db = await open({
        filename: this.options.sqliteDbPath,
        driver: sqlite3.Database
      });
      
      // Create tables if they don't exist
      await this._createTables();
      
      logger.info('SQLite storage initialized successfully');
    } catch (error) {
      logger.error('Error initializing SQLite storage:', error.message);
      throw error;
    }
  }
  
  /**
   * Create SQLite tables
   * @private
   */
  async _createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        data TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS bots (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        data TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        bot_id TEXT,
        title TEXT,
        created_at INTEGER,
        updated_at INTEGER,
        data TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (bot_id) REFERENCES bots (id)
      )`,
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        user_id TEXT,
        bot_id TEXT,
        content TEXT,
        type TEXT,
        created_at INTEGER,
        data TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (bot_id) REFERENCES bots (id)
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE,
        value TEXT,
        updated_at INTEGER
      )`
    ];
    
    for (const table of tables) {
      await this.db.exec(table);
    }
  }
  
  /**
   * Store data in the local storage
   * @param {string} collection - Collection name (e.g., 'conversations', 'users')
   * @param {string} id - Item ID (optional, will be generated if not provided)
   * @param {Object} data - Data to store
   * @returns {Promise<Object>} - Stored data with ID
   */
  async store(collection, id = null, data = {}) {
    await this.initialize();
    
    const itemId = id || uuidv4();
    const timestamp = Date.now();
    
    const item = {
      id: itemId,
      ...data,
      created_at: data.created_at || timestamp,
      updated_at: timestamp
    };
    
    if (this.options.storageType === 'file') {
      return this._storeFile(collection, itemId, item);
    } else {
      return this._storeSqlite(collection, itemId, item);
    }
  }
  
  /**
   * Store data in file storage
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @param {Object} data - Data to store
   * @returns {Promise<Object>} - Stored data
   * @private
   */
  async _storeFile(collection, id, data) {
    try {
      const collectionPath = path.join(this.options.basePath, collection);
      
      // Ensure collection directory exists
      await fs.mkdir(collectionPath, { recursive: true });
      
      const filePath = path.join(collectionPath, `${id}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      
      return data;
    } catch (error) {
      logger.error(`Error storing data in file storage (${collection}/${id}):`, error.message);
      throw error;
    }
  }
  
  /**
   * Store data in SQLite storage
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @param {Object} data - Data to store
   * @returns {Promise<Object>} - Stored data
   * @private
   */
  async _storeSqlite(collection, id, data) {
    try {
      // Check if table exists
      if (!['users', 'bots', 'conversations', 'messages', 'settings'].includes(collection)) {
        throw new Error(`Invalid collection: ${collection}`);
      }
      
      // Extract specific fields based on collection type
      let query;
      let params;
      
      if (collection === 'users') {
        query = `INSERT OR REPLACE INTO users (id, name, email, created_at, updated_at, data)
                VALUES (?, ?, ?, ?, ?, ?)`;
        params = [
          id,
          data.name || null,
          data.email || null,
          data.created_at,
          data.updated_at,
          JSON.stringify(data)
        ];
      } else if (collection === 'bots') {
        query = `INSERT OR REPLACE INTO bots (id, name, description, created_at, updated_at, data)
                VALUES (?, ?, ?, ?, ?, ?)`;
        params = [
          id,
          data.name || null,
          data.description || null,
          data.created_at,
          data.updated_at,
          JSON.stringify(data)
        ];
      } else if (collection === 'conversations') {
        query = `INSERT OR REPLACE INTO conversations (id, user_id, bot_id, title, created_at, updated_at, data)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;
        params = [
          id,
          data.user_id || null,
          data.bot_id || null,
          data.title || null,
          data.created_at,
          data.updated_at,
          JSON.stringify(data)
        ];
      } else if (collection === 'messages') {
        query = `INSERT OR REPLACE INTO messages (id, conversation_id, user_id, bot_id, content, type, created_at, data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        params = [
          id,
          data.conversation_id || null,
          data.user_id || null,
          data.bot_id || null,
          data.content || null,
          data.type || 'text',
          data.created_at,
          JSON.stringify(data)
        ];
      } else if (collection === 'settings') {
        query = `INSERT OR REPLACE INTO settings (id, key, value, updated_at)
                VALUES (?, ?, ?, ?)`;
        params = [
          id,
          data.key || id,
          typeof data.value === 'object' ? JSON.stringify(data.value) : String(data.value),
          data.updated_at
        ];
      }
      
      await this.db.run(query, params);
      return data;
    } catch (error) {
      logger.error(`Error storing data in SQLite storage (${collection}/${id}):`, error.message);
      throw error;
    }
  }
  
  /**
   * Retrieve data from local storage
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @returns {Promise<Object|null>} - Retrieved data or null if not found
   */
  async retrieve(collection, id) {
    await this.initialize();
    
    if (this.options.storageType === 'file') {
      return this._retrieveFile(collection, id);
    } else {
      return this._retrieveSqlite(collection, id);
    }
  }
  
  /**
   * Retrieve data from file storage
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @returns {Promise<Object|null>} - Retrieved data or null if not found
   * @private
   */
  async _retrieveFile(collection, id) {
    try {
      const filePath = path.join(this.options.basePath, collection, `${id}.json`);
      
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File not found
        return null;
      }
      
      logger.error(`Error retrieving data from file storage (${collection}/${id}):`, error.message);
      throw error;
    }
  }
  
  /**
   * Retrieve data from SQLite storage
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @returns {Promise<Object|null>} - Retrieved data or null if not found
   * @private
   */
  async _retrieveSqlite(collection, id) {
    try {
      // Check if table exists
      if (!['users', 'bots', 'conversations', 'messages', 'settings'].includes(collection)) {
        throw new Error(`Invalid collection: ${collection}`);
      }
      
      let query;
      
      if (collection === 'settings') {
        // For settings, we can query by key or id
        query = `SELECT * FROM settings WHERE id = ? OR key = ? LIMIT 1`;
        const result = await this.db.get(query, [id, id]);
        
        if (!result) return null;
        
        // Parse value if it's JSON
        try {
          result.value = JSON.parse(result.value);
        } catch (e) {
          // Not JSON, keep as is
        }
        
        return result;
      } else {
        // For other collections, query by id and return the full data object
        query = `SELECT data FROM ${collection} WHERE id = ? LIMIT 1`;
        const result = await this.db.get(query, [id]);
        
        if (!result) return null;
        
        return JSON.parse(result.data);
      }
    } catch (error) {
      logger.error(`Error retrieving data from SQLite storage (${collection}/${id}):`, error.message);
      throw error;
    }
  }
  
  /**
   * Query data from local storage
   * @param {string} collection - Collection name
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options (limit, offset, sort)
   * @returns {Promise<Array>} - Array of matching items
   */
  async query(collection, query = {}, options = {}) {
    await this.initialize();
    
    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const sort = options.sort || { updated_at: -1 };
    
    if (this.options.storageType === 'file') {
      return this._queryFile(collection, query, { limit, offset, sort });
    } else {
      return this._querySqlite(collection, query, { limit, offset, sort });
    }
  }
  
  /**
   * Query data from file storage
   * @param {string} collection - Collection name
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of matching items
   * @private
   */
  async _queryFile(collection, query, options) {
    try {
      const collectionPath = path.join(this.options.basePath, collection);
      
      // Ensure collection directory exists
      try {
        await fs.access(collectionPath);
      } catch (error) {
        // Directory doesn't exist, return empty array
        return [];
      }
      
      // Get all files in the collection directory
      const files = await fs.readdir(collectionPath);
      
      // Read and filter files
      const results = [];
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(collectionPath, file);
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        // Check if data matches query
        let matches = true;
        
        for (const [key, value] of Object.entries(query)) {
          if (typeof value === 'object' && value !== null) {
            // Handle operators like $gt, $lt, etc.
            for (const [op, opValue] of Object.entries(value)) {
              if (op === '$gt' && !(data[key] > opValue)) {
                matches = false;
                break;
              } else if (op === '$gte' && !(data[key] >= opValue)) {
                matches = false;
                break;
              } else if (op === '$lt' && !(data[key] < opValue)) {
                matches = false;
                break;
              } else if (op === '$lte' && !(data[key] <= opValue)) {
                matches = false;
                break;
              } else if (op === '$ne' && data[key] === opValue) {
                matches = false;
                break;
              } else if (op === '$in' && !opValue.includes(data[key])) {
                matches = false;
                break;
              } else if (op === '$nin' && opValue.includes(data[key])) {
                matches = false;
                break;
              }
            }
          } else if (data[key] !== value) {
            matches = false;
            break;
          }
        }
        
        if (matches) {
          results.push(data);
        }
      }
      
      // Sort results
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey];
      
      results.sort((a, b) => {
        if (sortOrder === 1) {
          return a[sortKey] - b[sortKey];
        } else {
          return b[sortKey] - a[sortKey];
        }
      });
      
      // Apply limit and offset
      return results.slice(options.offset, options.offset + options.limit);
    } catch (error) {
      logger.error(`Error querying data from file storage (${collection}):`, error.message);
      throw error;
    }
  }
  
  /**
   * Query data from SQLite storage
   * @param {string} collection - Collection name
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of matching items
   * @private
   */
  async _querySqlite(collection, query, options) {
    try {
      // Check if table exists
      if (!['users', 'bots', 'conversations', 'messages', 'settings'].includes(collection)) {
        throw new Error(`Invalid collection: ${collection}`);
      }
      
      // Build query
      let sqlQuery = `SELECT data FROM ${collection} WHERE 1=1`;
      const params = [];
      
      // Add query conditions
      for (const [key, value] of Object.entries(query)) {
        // Handle special case for settings table
        if (collection === 'settings' && key === 'key') {
          sqlQuery += ` AND key = ?`;
          params.push(value);
          continue;
        }
        
        // For other tables, we need to check if the column exists in the table
        // If it does, we can query it directly, otherwise we need to use JSON extraction
        const directQueryColumns = {
          users: ['id', 'name', 'email', 'created_at', 'updated_at'],
          bots: ['id', 'name', 'description', 'created_at', 'updated_at'],
          conversations: ['id', 'user_id', 'bot_id', 'title', 'created_at', 'updated_at'],
          messages: ['id', 'conversation_id', 'user_id', 'bot_id', 'content', 'type', 'created_at']
        };
        
        if (directQueryColumns[collection] && directQueryColumns[collection].includes(key)) {
          // Direct column query
          if (typeof value === 'object' && value !== null) {
            // Handle operators
            for (const [op, opValue] of Object.entries(value)) {
              if (op === '$gt') {
                sqlQuery += ` AND ${key} > ?`;
                params.push(opValue);
              } else if (op === '$gte') {
                sqlQuery += ` AND ${key} >= ?`;
                params.push(opValue);
              } else if (op === '$lt') {
                sqlQuery += ` AND ${key} < ?`;
                params.push(opValue);
              } else if (op === '$lte') {
                sqlQuery += ` AND ${key} <= ?`;
                params.push(opValue);
              } else if (op === '$ne') {
                sqlQuery += ` AND ${key} != ?`;
                params.push(opValue);
              } else if (op === '$in') {
                const placeholders = opValue.map(() => '?').join(',');
                sqlQuery += ` AND ${key} IN (${placeholders})`;
                params.push(...opValue);
              } else if (op === '$nin') {
                const placeholders = opValue.map(() => '?').join(',');
                sqlQuery += ` AND ${key} NOT IN (${placeholders})`;
                params.push(...opValue);
              }
            }
          } else {
            sqlQuery += ` AND ${key} = ?`;
            params.push(value);
          }
        } else {
          // JSON extraction query
          // This is a simplified approach and may not work for complex queries
          // For production use, consider using a proper ORM or query builder
          sqlQuery += ` AND json_extract(data, '$.${key}') = ?`;
          params.push(JSON.stringify(value));
        }
      }
      
      // Add sorting
      const sortKey = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortKey] === 1 ? 'ASC' : 'DESC';
      
      // Check if sort key is a direct column
      const directSortColumns = {
        users: ['id', 'name', 'email', 'created_at', 'updated_at'],
        bots: ['id', 'name', 'description', 'created_at', 'updated_at'],
        conversations: ['id', 'user_id', 'bot_id', 'title', 'created_at', 'updated_at'],
        messages: ['id', 'conversation_id', 'user_id', 'bot_id', 'content', 'type', 'created_at']
      };
      
      if (directSortColumns[collection] && directSortColumns[collection].includes(sortKey)) {
        sqlQuery += ` ORDER BY ${sortKey} ${sortOrder}`;
      } else {
        sqlQuery += ` ORDER BY json_extract(data, '$.${sortKey}') ${sortOrder}`;
      }
      
      // Add limit and offset
      sqlQuery += ` LIMIT ? OFFSET ?`;
      params.push(options.limit, options.offset);
      
      // Execute query
      const rows = await this.db.all(sqlQuery, params);
      
      // Parse data
      return rows.map(row => JSON.parse(row.data));
    } catch (error) {
      logger.error(`Error querying data from SQLite storage (${collection}):`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete data from local storage
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @returns {Promise<boolean>} - Whether deletion was successful
   */
  async delete(collection, id) {
    await this.initialize();
    
    if (this.options.storageType === 'file') {
      return this._deleteFile(collection, id);
    } else {
      return this._deleteSqlite(collection, id);
    }
  }
  
  /**
   * Delete data from file storage
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @returns {Promise<boolean>} - Whether deletion was successful
   * @private
   */
  async _deleteFile(collection, id) {
    try {
      const filePath = path.join(this.options.basePath, collection, `${id}.json`);
      
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File not found, consider deletion successful
        return true;
      }
      
      logger.error(`Error deleting data from file storage (${collection}/${id}):`, error.message);
      return false;
    }
  }
  
  /**
   * Delete data from SQLite storage
   * @param {string} collection - Collection name
   * @param {string} id - Item ID
   * @returns {Promise<boolean>} - Whether deletion was successful
   * @private
   */
  async _deleteSqlite(collection, id) {
    try {
      // Check if table exists
      if (!['users', 'bots', 'conversations', 'messages', 'settings'].includes(collection)) {
        throw new Error(`Invalid collection: ${collection}`);
      }
      
      // For settings, we can delete by key or id
      if (collection === 'settings') {
        await this.db.run(`DELETE FROM settings WHERE id = ? OR key = ?`, [id, id]);
      } else {
        await this.db.run(`DELETE FROM ${collection} WHERE id = ?`, [id]);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error deleting data from SQLite storage (${collection}/${id}):`, error.message);
      return false;
    }
  }
  
  /**
   * Close the storage connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.options.storageType === 'sqlite' && this.db) {
      await this.db.close();
      this.db = null;
    }
    
    this.initialized = false;
    this.initPromise = null;
    
    logger.info('Local Storage Service closed');
  }
}

// Create singleton instance
const localStorageService = new LocalStorageService();

module.exports = localStorageService;
