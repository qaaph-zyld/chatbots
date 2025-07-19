const mongoose = require('mongoose');

module.exports = {
  async up() {
    try {
      // Create collection if it doesn't exist
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (!collectionNames.includes('stores')) {
        await mongoose.connection.db.createCollection('stores');
        console.log('Created stores collection');
      }

      // Create schema and indexes
      const storeSchema = new mongoose.Schema({
        name: { type: String, required: true, index: true, unique: true },
        platform: { type: String, required: true, index: true },
        api_credentials: { type: Object, required: true },
        settings: { type: Object },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Create model and indexes
      const Store = mongoose.model('Store', storeSchema);
      await Store.init();
      
      console.log('Created Store model with indexes');
      return Store;
    } catch (error) {
      console.error('Error in stores migration:', error);
      throw error;
    }
  },

  async down() {
    try {
      await mongoose.connection.db.dropCollection('stores');
      console.log('Dropped stores collection');
      return true;
    } catch (error) {
      console.error('Error dropping stores collection:', error);
      throw error;
    }
  }
};
