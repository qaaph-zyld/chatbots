/**
 * Emergency Diagnostic Test
 * 
 * Simple test to verify basic Jest functionality
 */

describe('Emergency Diagnostic Tests', () => {
  test('basic math works', () => {
    expect(1 + 1).toBe(2);
  });

  test('can require mongoose', () => {
    const mongoose = require('mongoose');
    expect(mongoose).toBeDefined();
  });

  test('can access test config', () => {
    const testConfig = require('../../src/tests/setup/test-config');
    expect(testConfig).toBeDefined();
    expect(testConfig.auth).toBeDefined();
  });

  test('can require mongoose helpers', () => {
    const { clearModels } = require('../../src/tests/setup/mongoose-test-setup');
    const { safeCompileModel } = require('../../src/tests/setup/mongoose-model-helper');
    
    expect(clearModels).toBeDefined();
    expect(safeCompileModel).toBeDefined();
  });
});
