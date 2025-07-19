const mongoose = require('mongoose');

module.exports = {
  async up() {
    try {
      // Create collection if it doesn't exist
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (!collectionNames.includes('messages')) {
        await mongoose.connection.db.createCollection('messages');
        console.log('Created messages collection');
      }

      // Create schema and indexes
      const messageSchema = new mongoose.Schema({
        conversation_id: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Conversation',
          index: true,
          required: true 
        },
        content: { 
          type: String, 
          required: true 
        },
        sender_type: { 
          type: String, 
          enum: ['user', 'bot', 'system'],
          required: true,
          index: true
        },
        intent: { 
          type: String,
          index: true
        },
        metadata: { type: Object },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });

      // Create model and indexes
      const Message = mongoose.model('Message', messageSchema);
      await Message.init();
      
      // Create additional indexes
      await Message.collection.createIndex({ conversation_id: 1, createdAt: 1 });
      
      console.log('Created Message model with indexes');
      return Message;
    } catch (error) {
      console.error('Error in messages migration:', error);
      throw error;
    }
  },

  async down() {
    try {
      await mongoose.connection.db.dropCollection('messages');
      console.log('Dropped messages collection');
      return true;
    } catch (error) {
      console.error('Error dropping messages collection:', error);
      throw error;
    }
  }
};
