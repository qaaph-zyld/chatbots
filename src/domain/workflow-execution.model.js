/**
 * Workflow Execution Model
 * 
 * Represents an instance of a workflow being executed for a specific conversation,
 * tracking the current state, history, and variables.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Node execution history schema
const NodeExecutionSchema = new Schema({
  // Node ID
  nodeId: {
    type: String,
    required: true
  },
  
  // Node type
  nodeType: {
    type: String,
    required: true
  },
  
  // Input data for this node
  input: {
    type: Schema.Types.Mixed,
    default: null
  },
  
  // Output data from this node
  output: {
    type: Schema.Types.Mixed,
    default: null
  },
  
  // Execution status
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
    default: 'pending'
  },
  
  // Error details if execution failed
  error: {
    type: Schema.Types.Mixed,
    default: null
  },
  
  // Start time
  startTime: {
    type: Date,
    default: null
  },
  
  // End time
  endTime: {
    type: Date,
    default: null
  },
  
  // Execution duration in milliseconds
  duration: {
    type: Number,
    default: 0
  }
}, {
  _id: false
});

// Main workflow execution schema
const WorkflowExecutionSchema = new Schema({
  // Reference to workflow
  workflowId: {
    type: Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
    index: true
  },
  
  // Workflow version being executed
  workflowVersion: {
    type: String,
    required: true
  },
  
  // Conversation this execution belongs to
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  
  // User involved in this execution
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Chatbot this execution belongs to
  chatbotId: {
    type: String,
    required: true,
    index: true
  },
  
  // Current state
  currentNodeId: {
    type: String,
    default: null
  },
  
  // Execution status
  status: {
    type: String,
    enum: ['created', 'running', 'paused', 'completed', 'failed', 'terminated'],
    default: 'created'
  },
  
  // Execution variables (context)
  variables: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Execution history
  history: {
    type: [NodeExecutionSchema],
    default: []
  },
  
  // Start time
  startTime: {
    type: Date,
    default: null
  },
  
  // Last update time
  lastUpdateTime: {
    type: Date,
    default: null
  },
  
  // End time
  endTime: {
    type: Date,
    default: null
  },
  
  // Total execution duration in milliseconds
  totalDuration: {
    type: Number,
    default: 0
  },
  
  // Error details if execution failed
  error: {
    type: Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
WorkflowExecutionSchema.index({ workflowId: 1, status: 1 });
WorkflowExecutionSchema.index({ conversationId: 1, status: 1 });
WorkflowExecutionSchema.index({ userId: 1, chatbotId: 1, status: 1 });
WorkflowExecutionSchema.index({ chatbotId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkflowExecution', WorkflowExecutionSchema);
