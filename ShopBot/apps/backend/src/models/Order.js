const { Model, DataTypes } = require('sequelize');

class Order extends Model {
  static init(sequelize) {
    super.init(
      {
        order_number: DataTypes.STRING,
        customer_email: DataTypes.STRING,
        status: DataTypes.STRING,
        data: DataTypes.JSONB,
      },
      {
        sequelize,
        modelName: 'Order',
      }
    );
  }
}

module.exports = Order;
