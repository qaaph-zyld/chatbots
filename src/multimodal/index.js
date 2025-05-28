/**
 * Multi-modal Services Index
 * 
 * Exports all multi-modal services for easy access
 */

const { inputService, InputType } = require('./input.service');
const { outputService, OutputType } = require('./output.service');

module.exports = {
  inputService,
  outputService,
  InputType,
  OutputType
};
