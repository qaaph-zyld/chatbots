const { Model, DataTypes } = require('sequelize');

class Store extends Model {
  static init(sequelize) {
    super.init(
      {
        name: DataTypes.STRING,
        platform: DataTypes.STRING,
        api_credentials: DataTypes.JSONB,
        settings: DataTypes.JSONB,
      },
      {
        sequelize,
        modelName: 'Store',
      }
    );
  }
}

module.exports = Store;
