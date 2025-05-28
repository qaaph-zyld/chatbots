/**
 * Plugin Instance Schema
 * 
 * Defines the structure for plugin instances that are installed on specific chatbots
 */

const mongoose = require('mongoose');

// Plugin Instance Schema
const PluginInstanceSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: [true, 'Chatbot ID is required']
  },
  pluginId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plugin',
    required: [true, 'Plugin ID is required']
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the updatedAt field
PluginInstanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create and export the model
const PluginInstance = mongoose.model('PluginInstance', PluginInstanceSchema);

module.exports = PluginInstance;
