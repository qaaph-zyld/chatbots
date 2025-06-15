// global-test-teardown.js
const { voiceService } = require('@src/services/voice.service');

module.exports = async function globalTeardown() {
  // Clean up voice service resources
  if (voiceService && typeof voiceService.shutdown === 'function') {
    await voiceService.shutdown();
  }

  // Stop MongoDB memory server
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }

  // Clean up any other global resources
};
