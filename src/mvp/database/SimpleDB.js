/**
 * Simple Database Layer - MVP Implementation
 * File-based storage for simplicity (no external dependencies)
 */

const fs = require('fs');
const path = require('path');

class SimpleDB {
  constructor(dataDir = './data') {
    this.dataDir = path.resolve(dataDir);
    this.ensureDataDirectory();
  }

  // Ensure data directory exists
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Get file path for collection
  getFilePath(collection) {
    return path.join(this.dataDir, `${collection}.json`);
  }

  // Read collection from file
  readCollection(collection) {
    try {
      const filePath = this.getFilePath(collection);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading collection ${collection}:`, error);
      return [];
    }
  }

  // Write collection to file
  writeCollection(collection, data) {
    try {
      const filePath = this.getFilePath(collection);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing collection ${collection}:`, error);
      return false;
    }
  }

  // Insert document into collection
  insert(collection, document) {
    const data = this.readCollection(collection);
    const id = document.id || this.generateId();
    const newDocument = { ...document, id, createdAt: new Date(), updatedAt: new Date() };
    
    data.push(newDocument);
    
    if (this.writeCollection(collection, data)) {
      return newDocument;
    }
    return null;
  }

  // Find documents in collection
  find(collection, query = {}) {
    const data = this.readCollection(collection);
    
    if (Object.keys(query).length === 0) {
      return data;
    }
    
    return data.filter(doc => {
      return Object.keys(query).every(key => {
        if (typeof query[key] === 'object' && query[key].$regex) {
          const regex = new RegExp(query[key].$regex, query[key].$options || 'i');
          return regex.test(doc[key]);
        }
        return doc[key] === query[key];
      });
    });
  }

  // Find one document
  findOne(collection, query) {
    const results = this.find(collection, query);
    return results.length > 0 ? results[0] : null;
  }

  // Find by ID
  findById(collection, id) {
    return this.findOne(collection, { id });
  }

  // Update document
  update(collection, query, updateData) {
    const data = this.readCollection(collection);
    let updatedDoc = null;
    
    const updatedData = data.map(doc => {
      const matches = Object.keys(query).every(key => doc[key] === query[key]);
      if (matches) {
        updatedDoc = { ...doc, ...updateData, updatedAt: new Date() };
        return updatedDoc;
      }
      return doc;
    });
    
    if (updatedDoc && this.writeCollection(collection, updatedData)) {
      return updatedDoc;
    }
    return null;
  }

  // Update by ID
  updateById(collection, id, updateData) {
    return this.update(collection, { id }, updateData);
  }

  // Delete documents
  delete(collection, query) {
    const data = this.readCollection(collection);
    const filteredData = data.filter(doc => {
      return !Object.keys(query).every(key => doc[key] === query[key]);
    });
    
    const deletedCount = data.length - filteredData.length;
    
    if (deletedCount > 0 && this.writeCollection(collection, filteredData)) {
      return deletedCount;
    }
    return 0;
  }

  // Delete by ID
  deleteById(collection, id) {
    return this.delete(collection, { id });
  }

  // Count documents
  count(collection, query = {}) {
    return this.find(collection, query).length;
  }

  // Generate simple ID
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear collection
  clear(collection) {
    return this.writeCollection(collection, []);
  }

  // Get all collection names
  getCollections() {
    try {
      const files = fs.readdirSync(this.dataDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  // Database stats
  getStats() {
    const collections = this.getCollections();
    const stats = {
      collections: collections.length,
      documents: 0,
      size: 0
    };

    collections.forEach(collection => {
      const data = this.readCollection(collection);
      stats.documents += data.length;
      
      try {
        const filePath = this.getFilePath(collection);
        const stat = fs.statSync(filePath);
        stats.size += stat.size;
      } catch (error) {
        // Ignore error
      }
    });

    return stats;
  }
}

module.exports = SimpleDB;
