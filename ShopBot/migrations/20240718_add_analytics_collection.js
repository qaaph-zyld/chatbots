const mongoose = require('mongoose');
const Analytics = require('../src/models/Analytics');

module.exports = {
  async up() {
    // Create indexes for the Analytics collection
    await Analytics.init();
    console.log('Analytics collection and indexes created');
  },

  async down() {
    await mongoose.connection.dropCollection('analytics');
    console.log('Dropped analytics collection');
  }
};
