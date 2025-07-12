/**
 * Training Schema
 * 
 * Defines the structure for training data and sessions
 */

const mongoose = require('mongoose');

// Schema for individual training examples
const TrainingExampleSchema = new mongoose.Schema({
  input: {
    type: String,
    required: [true, 'Training example input is required']
  },
  output: {
    type: String,
    required: [true, 'Training example output is required']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: false });

// Schema for training sessions
const TrainingSessionSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending'
  },
  startedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: {
    type: String,
    default: null
  }
}, { _id: false });

// Main Training Dataset Schema
const TrainingDatasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Training dataset name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: [true, 'Chatbot ID is required']
  },
  domain: {
    type: String,
    required: [true, 'Training domain is required'],
    trim: true
  },
  examples: {
    type: [TrainingExampleSchema],
    default: []
  },
  sessions: {
    type: [TrainingSessionSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
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
TrainingDatasetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add a training example
TrainingDatasetSchema.methods.addExample = function(exampleData) {
  this.examples.push(exampleData);
  return this.save();
};

// Method to remove a training example
TrainingDatasetSchema.methods.removeExample = function(index) {
  if (index >= 0 && index < this.examples.length) {
    this.examples.splice(index, 1);
    return this.save();
  }
  return Promise.reject(new Error('Invalid example index'));
};

// Method to start a new training session
TrainingDatasetSchema.methods.startTrainingSession = function() {
  this.sessions.push({
    status: 'in_progress',
    startedAt: new Date()
  });
  return this.save();
};

// Method to complete a training session
TrainingDatasetSchema.methods.completeTrainingSession = function(metrics) {
  const currentSession = this.sessions[this.sessions.length - 1];
  if (currentSession && currentSession.status === 'in_progress') {
    currentSession.status = 'completed';
    currentSession.completedAt = new Date();
    currentSession.metrics = metrics || {};
    return this.save();
  }
  return Promise.reject(new Error('No active training session found'));
};

// Method to fail a training session
TrainingDatasetSchema.methods.failTrainingSession = function(error) {
  const currentSession = this.sessions[this.sessions.length - 1];
  if (currentSession && currentSession.status === 'in_progress') {
    currentSession.status = 'failed';
    currentSession.completedAt = new Date();
    currentSession.error = error || 'Unknown error';
    return this.save();
  }
  return Promise.reject(new Error('No active training session found'));
};

// Create and export the model
const TrainingDataset = mongoose.model('TrainingDataset', TrainingDatasetSchema);

module.exports = TrainingDataset;
