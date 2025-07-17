const { Model, DataTypes } = require('sequelize');

class Conversation extends Model {
  static init(sequelize) {
    super.init(
      {
        session_id: DataTypes.STRING,
        status: DataTypes.STRING,
      },
      {
        sequelize,
        modelName: 'Conversation',
      }
    );
  }
}

module.exports = Conversation;
