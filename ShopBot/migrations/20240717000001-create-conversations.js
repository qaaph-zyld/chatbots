const mongoose = require('mongoose');

module.exports = {
  async up() {
    try {
      // Create collection if it doesn't exist
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (!collectionNames.includes('conversations')) {
        await mongoose.connection.db.createCollection('conversations');
        console.log('Created conversations collection');
      }

      // Create schema and indexes
      const conversationSchema = new mongoose.Schema({
        store_id: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Store',
          index: true,
          required: true 
        },
        customer_id: { 
          type: String, 
          index: true,
          required: true 
        },
        session_id: { 
          type: String, 
          index: true,
          required: true 
        },
        status: { 
          type: String, 
          enum: ['active', 'completed', 'abandoned'],
          default: 'active',
          index: true
        },
        metadata: { type: Object },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Create model and indexes
      const Conversation = mongoose.model('Conversation', conversationSchema);
      await Conversation.init();
      
      console.log('Created Conversation model with indexes');
      return Conversation;
    } catch (error) {
      console.error('Error in conversations migration:', error);
      throw error;
    }
  },

  async down() {
    try {
      await mongoose.connection.db.dropCollection('conversations');
      console.log('Dropped conversations collection');
      return true;
    } catch (error) {
      console.error('Error dropping conversations collection:', error);
      throw error;
    }
  }
};
