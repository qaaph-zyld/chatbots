/**
 * Webhook model for the Chatbots Platform
 * Defines the schema for webhook configurations
 */
const mongoose = require('mongoose');
const crypto = require('crypto');

// Define available webhook event types
const EVENT_TYPES = [
  'conversation.created',
  'conversation.updated',
  'conversation.deleted',
  'message.created',
  'message.updated',
  'message.deleted',
  'chatbot.created',
  'chatbot.updated',
  'chatbot.deleted',
  'chatbot.trained',
  'chatbot.deployed',
  'user.created',
  'user.updated',
  'user.deleted',
  'user.login',
  'user.logout'
];

// Define the schema for webhook configurations
const webhookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  url: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  events: {
    type: [{
      type: String,
      enum: EVENT_TYPES
    }],
    required: true,
    validate: {
      validator: function(events) {
        return events && events.length > 0;
      },
      message: 'At least one event must be specified'
    }
  },
  secret: {
    type: String,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  headers: {
    type: Map,
    of: String,
    default: {}
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  retryConfig: {
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10
    },
    retryInterval: {
      type: Number,
      default: 60000, // 1 minute in milliseconds
      min: 1000,
      max: 3600000 // 1 hour in milliseconds
    }
  },
  filterConfig: {
    conditions: {
      type: Object,
      default: {}
    }
  },
  stats: {
    totalDeliveries: {
      type: Number,
      default: 0
    },
    successfulDeliveries: {
      type: Number,
      default: 0
    },
    failedDeliveries: {
      type: Number,
      default: 0
    },
    lastDeliveryAttempt: {
      type: Date
    },
    lastSuccessfulDelivery: {
      type: Date
    },
    lastFailedDelivery: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
webhookSchema.index({ createdBy: 1 });
webhookSchema.index({ events: 1 });
webhookSchema.index({ active: 1 });

// Add method to generate a new secret
webhookSchema.methods.generateNewSecret = function() {
  this.secret = crypto.randomBytes(32).toString('hex');
  return this.secret;
};

// Add method to verify a signature
webhookSchema.methods.verifySignature = function(payload, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', this.secret)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
};

// Add static method to get all active webhooks for a specific event
webhookSchema.statics.findActiveByEvent = function(eventType) {
  return this.find({
    events: eventType,
    active: true
  });
};

// Create the model
const Webhook = mongoose.model('Webhook', webhookSchema);

module.exports = {
  Webhook,
  EVENT_TYPES
};
