/**
 * Integration Schema
 * 
 * Mongoose schema for platform integrations
 */

const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Integration name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Integration type is required'],
    enum: ['slack', 'facebook', 'website', 'telegram', 'whatsapp', 'custom'],
    default: 'website'
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  enabled: {
    type: Boolean,
    default: true
  },
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: [true, 'Chatbot ID is required']
  },
  owner: {
    type: String,
    required: [true, 'Owner is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for faster queries
IntegrationSchema.index({ chatbotId: 1 });
IntegrationSchema.index({ type: 1 });
IntegrationSchema.index({ enabled: 1 });

// Pre-save hook to update updatedAt timestamp
IntegrationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Integration', IntegrationSchema);
