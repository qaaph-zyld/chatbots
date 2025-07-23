const { Model, DataTypes } = require('sequelize');

class Customer extends Model {
  static init(sequelize) {
    super.init(
      {
        email: DataTypes.STRING,
        name: DataTypes.STRING,
      },
      {
        sequelize,
        modelName: 'Customer',
      }
    );
  }
}

module.exports = Customer;
