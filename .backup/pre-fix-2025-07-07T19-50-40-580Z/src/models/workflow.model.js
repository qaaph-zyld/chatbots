/**
 * Workflow Model
 * 
 * Represents a conversation workflow that defines the flow of interactions
 * between the chatbot and users, including conditional logic, actions, and integrations.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Node types for workflow
const NODE_TYPES = [
  'start',           // Starting point of workflow
  'message',         // Send a message to user
  'condition',       // Conditional logic
  'input',           // Get input from user
  'action',          // Perform an action (API call, database operation, etc.)
  'integration',     // External integration
  'context',         // Context management
  'jump',            // Jump to another node
  'end'              // End of workflow
];

// Connection schema for linking nodes
const ConnectionSchema = new Schema({
  // Source node ID
  sourceId: {
    type: String,
    required: true
  },
  
  // Target node ID
  targetId: {
    type: String,
    required: true
  },
  
  // Condition for this connection (for conditional nodes)
  condition: {
    type: Schema.Types.Mixed,
    default: null
  },
  
  // Label for this connection
  label: {
    type: String,
    default: ''
  }
});

// Node schema for workflow nodes
const NodeSchema = new Schema({
  // Node ID (unique within workflow)
  nodeId: {
    type: String,
    required: true
  },
  
  // Node type
  type: {
    type: String,
    enum: NODE_TYPES,
    required: true
  },
  
  // Node data (varies based on type)
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  
  // Node position in UI
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  
  // Node metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

// Main workflow schema
const WorkflowSchema = new Schema({
  // Workflow name
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  // Workflow description
  description: {
    type: String,
    default: ''
  },
  
  // Workflow version
  version: {
    type: String,
    default: '1.0.0'
  },
  
  // Workflow nodes
  nodes: {
    type: [NodeSchema],
    default: []
  },
  
  // Connections between nodes
  connections: {
    type: [ConnectionSchema],
    default: []
  },
  
  // Chatbot this workflow belongs to
  chatbotId: {
    type: String,
    required: true,
    index: true
  },
  
  // User who created this workflow
  createdBy: {
    type: String,
    required: true,
    index: true
  },
  
  // Is this workflow active
  isActive: {
    type: Boolean,
    default: false
  },
  
  // Tags for categorization
  tags: {
    type: [String],
    default: []
  },
  
  // Additional workflow metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
WorkflowSchema.index({ chatbotId: 1, name: 1 });
WorkflowSchema.index({ chatbotId: 1, isActive: 1 });
WorkflowSchema.index({ createdBy: 1, chatbotId: 1 });

module.exports = mongoose.model('Workflow', WorkflowSchema);
