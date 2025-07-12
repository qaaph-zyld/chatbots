/**
 * Chatbot Schema
 * 
 * Mongoose schema for chatbot data
 */

const mongoose = require('mongoose');

const ChatbotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chatbot name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  engine: {
    type: String,
    required: [true, 'Engine type is required'],
    enum: ['botpress', 'huggingface', 'rasa', 'custom'],
    default: 'botpress'
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  defaultPersonality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Personality'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'training', 'error'],
    default: 'inactive'
  },
  owner: {
    type: String,
    required: [true, 'Owner is required']
  },
  isPublic: {
    type: Boolean,
    default: false
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
ChatbotSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Pre-save hook to update updatedAt timestamp
ChatbotSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for chatbot URL
ChatbotSchema.virtual('url').get(function() {
  return `/chatbots/${this._id}`;
});

// Method to check if chatbot is active
ChatbotSchema.methods.isActive = function() {
  return this.status === 'active';
};

module.exports = mongoose.model('Chatbot', ChatbotSchema);
