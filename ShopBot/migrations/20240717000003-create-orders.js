const mongoose = require('mongoose');

module.exports = {
  async up() {
    try {
      // Create collection if it doesn't exist
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      if (!collectionNames.includes('orders')) {
        await mongoose.connection.db.createCollection('orders');
        console.log('Created orders collection');
      }

      // Define order status enum
      const ORDER_STATUS = [
        'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
      ];

      // Create schema and indexes
      const orderSchema = new mongoose.Schema({
        store_id: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: 'Store',
          index: true,
          required: true 
        },
        order_number: { 
          type: String, 
          required: true,
          unique: true,
          index: true
        },
        customer_email: { 
          type: String, 
          required: true,
          index: true
        },
        status: { 
          type: String, 
          enum: ORDER_STATUS,
          default: 'pending',
          index: true
        },
        data: { 
          type: mongoose.Schema.Types.Mixed,
          default: {}
        },
        synced_at: { 
          type: Date,
          index: true
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
      });

      // Create model and indexes
      const Order = mongoose.model('Order', orderSchema);
      await Order.init();
      
      // Create additional indexes
      await Order.collection.createIndex({ store_id: 1, status: 1 });
      await Order.collection.createIndex({ customer_email: 1, createdAt: -1 });
      
      console.log('Created Order model with indexes');
      return Order;
    } catch (error) {
      console.error('Error in orders migration:', error);
      throw error;
    }
  },

  async down() {
    try {
      await mongoose.connection.db.dropCollection('orders');
      console.log('Dropped orders collection');
      return true;
    } catch (error) {
      console.error('Error dropping orders collection:', error);
      throw error;
    }
  }
};
