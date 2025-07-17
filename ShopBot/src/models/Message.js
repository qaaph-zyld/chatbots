const { Model, DataTypes } = require('sequelize');

class Message extends Model {
  static init(sequelize) {
    super.init(
      {
        content: DataTypes.TEXT,
        sender_type: DataTypes.STRING,
        intent: DataTypes.STRING,
        confidence: DataTypes.FLOAT,
      },
      {
        sequelize,
        modelName: 'Message',
      }
    );
  }
}

module.exports = Message;
