/**
 * Base Repository
 * 
 * Abstract base class for MongoDB repositories providing common CRUD operations
 * and query optimization capabilities.
 */

const mongoose = require('mongoose');
require('@src/utils');

class BaseRepository {
  /**
   * Create a new repository instance
   * @param {mongoose.Model} model - Mongoose model
   */
  constructor(model) {
    this.model = model;
    this.modelName = model.modelName;
    this.logger = logger;
  }

  /**
   * Find a document by ID
   * @param {string} id - Document ID
   * @param {Object} options - Query options
   * @param {string[]} options.select - Fields to select
   * @param {Object} options.populate - Population options
   * @returns {Promise<Object>} Found document
   */
  async findById(id, options = {}) {
    try {
      let query = this.model.findById(id);
      
      if (options.select) {
        query = query.select(options.select.join(' '));
      }
      
      if (options.populate) {
        query = Array.isArray(options.populate) 
          ? options.populate.reduce((q, p) => q.populate(p), query)
          : query.populate(options.populate);
      }
      
      const document = await query.exec();
      return document;
    } catch (error) {
      this.logger.error(`Error finding ${this.modelName} by ID`, { id, error: error.message });
      throw error;
    }
  }

  /**
   * Find documents by query
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @param {string[]} options.select - Fields to select
   * @param {Object} options.populate - Population options
   * @param {Object} options.sort - Sort options
   * @param {number} options.skip - Number of documents to skip
   * @param {number} options.limit - Maximum number of documents to return
   * @param {boolean} options.lean - Whether to return plain objects instead of Mongoose documents
   * @returns {Promise<Object[]>} Found documents
   */
  async find(filter = {}, options = {}) {
    try {
      let query = this.model.find(filter);
      
      if (options.select) {
        query = query.select(options.select.join(' '));
      }
      
      if (options.populate) {
        query = Array.isArray(options.populate) 
          ? options.populate.reduce((q, p) => q.populate(p), query)
          : query.populate(options.populate);
      }
      
      if (options.sort) {
        query = query.sort(options.sort);
      }
      
      if (options.skip) {
        query = query.skip(options.skip);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.lean) {
        query = query.lean();
      }
      
      const documents = await query.exec();
      return documents;
    } catch (error) {
      this.logger.error(`Error finding ${this.modelName} documents`, { filter, error: error.message });
      throw error;
    }
  }

  /**
   * Find one document by query
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @param {string[]} options.select - Fields to select
   * @param {Object} options.populate - Population options
   * @param {boolean} options.lean - Whether to return plain objects instead of Mongoose documents
   * @returns {Promise<Object>} Found document
   */
  async findOne(filter = {}, options = {}) {
    try {
      let query = this.model.findOne(filter);
      
      if (options.select) {
        query = query.select(options.select.join(' '));
      }
      
      if (options.populate) {
        query = Array.isArray(options.populate) 
          ? options.populate.reduce((q, p) => q.populate(p), query)
          : query.populate(options.populate);
      }
      
      if (options.lean) {
        query = query.lean();
      }
      
      const document = await query.exec();
      return document;
    } catch (error) {
      this.logger.error(`Error finding one ${this.modelName} document`, { filter, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(data) {
    try {
      const document = await this.model.create(data);
      return document;
    } catch (error) {
      this.logger.error(`Error creating ${this.modelName} document`, { error: error.message });
      throw error;
    }
  }

  /**
   * Update a document by ID
   * @param {string} id - Document ID
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @param {boolean} options.new - Whether to return the updated document
   * @param {boolean} options.runValidators - Whether to run validators
   * @returns {Promise<Object>} Updated document
   */
  async updateById(id, data, options = { new: true, runValidators: true }) {
    try {
      const document = await this.model.findByIdAndUpdate(id, data, options);
      return document;
    } catch (error) {
      this.logger.error(`Error updating ${this.modelName} by ID`, { id, error: error.message });
      throw error;
    }
  }

  /**
   * Update documents by query
   * @param {Object} filter - Query filter
   * @param {Object} data - Update data
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async updateMany(filter, data, options = {}) {
    try {
      const result = await this.model.updateMany(filter, data, options);
      return result;
    } catch (error) {
      this.logger.error(`Error updating many ${this.modelName} documents`, { filter, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Deleted document
   */
  async deleteById(id) {
    try {
      const document = await this.model.findByIdAndDelete(id);
      return document;
    } catch (error) {
      this.logger.error(`Error deleting ${this.modelName} by ID`, { id, error: error.message });
      throw error;
    }
  }

  /**
   * Delete documents by query
   * @param {Object} filter - Query filter
   * @returns {Promise<Object>} Delete result
   */
  async deleteMany(filter) {
    try {
      const result = await this.model.deleteMany(filter);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting many ${this.modelName} documents`, { filter, error: error.message });
      throw error;
    }
  }

  /**
   * Count documents by query
   * @param {Object} filter - Query filter
   * @returns {Promise<number>} Document count
   */
  async count(filter = {}) {
    try {
      const count = await this.model.countDocuments(filter);
      return count;
    } catch (error) {
      this.logger.error(`Error counting ${this.modelName} documents`, { filter, error: error.message });
      throw error;
    }
  }

  /**
   * Execute an aggregation pipeline
   * @param {Array} pipeline - Aggregation pipeline
   * @param {Object} options - Aggregation options
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipeline, options = {}) {
    try {
      const result = await this.model.aggregate(pipeline).option(options).exec();
      return result;
    } catch (error) {
      this.logger.error(`Error executing ${this.modelName} aggregation`, { error: error.message });
      throw error;
    }
  }

  /**
   * Execute a query with explanation for optimization
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query explanation
   */
  async explainQuery(filter = {}, options = {}) {
    try {
      let query = this.model.find(filter);
      
      if (options.select) {
        query = query.select(options.select.join(' '));
      }
      
      if (options.sort) {
        query = query.sort(options.sort);
      }
      
      const explanation = await query.explain();
      return explanation;
    } catch (error) {
      this.logger.error(`Error explaining ${this.modelName} query`, { filter, error: error.message });
      throw error;
    }
  }

  /**
   * Create a transaction session
   * @returns {Promise<mongoose.ClientSession>} Transaction session
   */
  async startTransaction() {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  }

  /**
   * Commit a transaction
   * @param {mongoose.ClientSession} session - Transaction session
   * @returns {Promise<void>}
   */
  async commitTransaction(session) {
    await session.commitTransaction();
    session.endSession();
  }

  /**
   * Abort a transaction
   * @param {mongoose.ClientSession} session - Transaction session
   * @returns {Promise<void>}
   */
  async abortTransaction(session) {
    await session.abortTransaction();
    session.endSession();
  }
}

module.exports = BaseRepository;
