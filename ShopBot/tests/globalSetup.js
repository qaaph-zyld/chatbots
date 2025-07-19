const { setupTestDB } = require('./setup');

module.exports = async () => {
  await setupTestDB();
};
