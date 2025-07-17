'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      store_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Stores',
          key: 'id'
        }
      },
      order_number: {
        type: Sequelize.STRING
      },
      customer_email: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.STRING
      },
      data: {
        type: Sequelize.JSONB
      },
      synced_at: {
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};
