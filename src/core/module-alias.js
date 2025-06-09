/**
 * Module Alias Registration
 * 
 * This file registers module aliases for cleaner import paths.
 * It should be imported at the entry point of the application.
 */

// Use module-alias package to register aliases from package.json
require('module-alias/register');

// Add any additional runtime aliases if needed
const moduleAlias = require('module-alias');
const path = require('path');

// Add tests alias which isn't in package.json
moduleAlias.addAlias('@tests', path.resolve(__dirname, '../../tests'));

// Export for direct use in other modules if needed
module.exports = {
  registerAliases: () => {
    // This function can be called explicitly if needed
    // It's already called when this file is imported
  }
};
