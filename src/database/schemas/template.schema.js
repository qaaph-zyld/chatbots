/**
 * Template Schema
 * 
 * Mongoose schema for conversation templates
 */

const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Template content is required']
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  owner: {
    type: String,
    required: [true, 'Owner is required']
  },
  tags: [String],
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
TemplateSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });

// Pre-save hook to update updatedAt timestamp
TemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Template', TemplateSchema);
