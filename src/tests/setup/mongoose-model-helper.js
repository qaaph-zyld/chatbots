/**
 * Mongoose Model Helper
 * 
 * Provides utilities to safely compile Mongoose models only once
 */

const mongoose = require('mongoose');
require('@src/utils');

/**
 * Safely compile a model only if it doesn't already exist
 * @param {string} modelName - Name of the model
 * @param {mongoose.Schema} schema - Mongoose schema
 * @param {string} collection - Optional collection name
 * @returns {mongoose.Model} The compiled model
 */
const safeCompileModel = (modelName, schema, collection = null) => {
  try {
    // Check if model already exists
    if (mongoose.models && mongoose.models[modelName]) {
      return mongoose.models[modelName];
    }
    
    // Create model options
    const options = collection ? { collection } : {};
    
    // Compile and return the model
    return mongoose.model(modelName, schema, collection, options);
  } catch (error) {
    if (error.name === 'OverwriteModelError') {
      // If model already exists, return it
      return mongoose.model(modelName);
    }
    
    // Log and rethrow other errors
    logger.error(`Error compiling model ${modelName}`, { error: error.message });
    throw error;
  }
};

module.exports = {
  safeCompileModel
};
