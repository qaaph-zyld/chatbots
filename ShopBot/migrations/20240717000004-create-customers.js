const mongoose = require('mongoose');

module.exports = {
  async up() {
    try {
      // Create collection if it doesn't exist
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (!collectionNames.includes('customers')) {
        await mongoose.connection.db.createCollection('customers');
        console.log('Created customers collection');
      }

      // Create schema and indexes
      const customerSchema = new mongoose.Schema({
        email: { 
          type: String, 
          required: true,
          unique: true,
          index: true,
          trim: true,
          lowercase: true,
          match: [/^[\\\\\\\w-\\\\\\.]+@([\\\\\\\w-]+\\\\\\.)+[\\\\\\\w-]{2,4}$/, 'Please enter a valid email']
        },
        name: { 
          type: String, 
          required: true,
          trim: true
        },
        phone: {
          type: String,
          trim: true
        },
        address: {
          street: String,
          city: String,
          state: String,
          postalCode: String,
          country: String
        },
        metadata: {
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        createdAt: { 
          type: Date, 
          default: Date.now,
          index: true 
        },
        updatedAt: { 
          type: Date, 
          default: Date.now 
        }
      }, {
        timestamps: true
      });

      // Create model and indexes
      const Customer = mongoose.model('Customer', customerSchema);
      await Customer.init();
      
      // Create additional indexes
      await Customer.collection.createIndex({ name: 'text', email: 'text' });
      
      console.log('Created Customer model with indexes');
      return Customer;
    } catch (error) {
      console.error('Error in customers migration:', error);
      throw error;
    }
  },

  async down() {
    try {
      await mongoose.connection.db.dropCollection('customers');
      console.log('Dropped customers collection');
      return true;
    } catch (error) {
      console.error('Error dropping customers collection:', error);
      throw error;
    }
  }
};
