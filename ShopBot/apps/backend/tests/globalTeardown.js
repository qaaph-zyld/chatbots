const { teardownTestDB } = require('./setup');

module.exports = async () => {
  await teardownTestDB();
};
