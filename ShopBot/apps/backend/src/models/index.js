const sequelize = require('../sequelize');
const Store = require('./Store');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Order = require('./Order');

// Initialize models
Store.init(sequelize);
Conversation.init(sequelize);
Message.init(sequelize);
Order.init(sequelize);

// Define associations
Store.hasMany(Conversation);
Conversation.belongsTo(Store);

Conversation.hasMany(Message);
Message.belongsTo(Conversation);

Store.hasMany(Order);
Order.belongsTo(Store);

module.exports = {
  sequelize,
  Store,
  Conversation,
  Message,
  Order,
};
