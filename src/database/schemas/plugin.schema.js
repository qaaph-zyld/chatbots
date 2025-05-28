/**
 * Plugin Schema
 * 
 * Defines the structure for plugins that can extend chatbot capabilities
 */

const mongoose = require('mongoose');

// Schema for plugin configuration options
const PluginConfigOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Option name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'array', 'object'],
    required: [true, 'Option type is required']
  },
  description: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { _id: false });

// Schema for plugin hooks
const PluginHookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hook name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: Number,
    default: 10
  }
}, { _id: false });

// Main Plugin Schema
const PluginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plugin name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  version: {
    type: String,
    required: [true, 'Plugin version is required'],
    trim: true
  },
  author: {
    type: String,
    default: ''
  },
  entryPoint: {
    type: String,
    required: [true, 'Plugin entry point is required'],
    trim: true
  },
  configOptions: {
    type: [PluginConfigOptionSchema],
    default: []
  },
  hooks: {
    type: [PluginHookSchema],
    default: []
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  installPath: {
    type: String,
    required: [true, 'Plugin install path is required'],
    trim: true
  },
  dependencies: {
    type: [String],
    default: []
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
PluginSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create and export the model
const Plugin = mongoose.model('Plugin', PluginSchema);

module.exports = Plugin;
