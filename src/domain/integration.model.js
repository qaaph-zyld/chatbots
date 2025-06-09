/**
 * Integration Model
 * 
 * Defines the schema for integrations with external platforms
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IntegrationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['web', 'slack', 'telegram', 'whatsapp', 'facebook', 'discord', 'twilio'],
    index: true
  },
  chatbotId: {
    type: Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true,
    index: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'inactive',
    index: true
  },
  config: {
    type: Schema.Types.Mixed,
    required: true
  },
  webhookUrl: {
    type: String,
    trim: true
  },
  lastError: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  stats: {
    messagesReceived: {
      type: Number,
      default: 0
    },
    messagesSent: {
      type: Number,
      default: 0
    },
    activeUsers: {
      type: Number,
      default: 0
    },
    lastActivityAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
IntegrationSchema.index({ chatbotId: 1, platform: 1 });
IntegrationSchema.index({ status: 1, platform: 1 });
IntegrationSchema.index({ createdAt: -1 });

/**
 * Pre-save hook to ensure config is secure
 */
IntegrationSchema.pre('save', function(next) {
  // Ensure config doesn't contain sensitive data in clear text
  // This is a simple example - in production, you'd want to encrypt sensitive data
  if (this.config) {
    // Mask sensitive fields in logs
    if (this.config.botToken) {
      this.config.botToken = this.config.botToken.substring(0, 4) + '...' + this.config.botToken.substring(this.config.botToken.length - 4);
    }
    if (this.config.signingSecret) {
      this.config.signingSecret = this.config.signingSecret.substring(0, 4) + '...' + this.config.signingSecret.substring(this.config.signingSecret.length - 4);
    }
    if (this.config.authToken) {
      this.config.authToken = this.config.authToken.substring(0, 4) + '...' + this.config.authToken.substring(this.config.authToken.length - 4);
    }
    if (this.config.pageToken) {
      this.config.pageToken = this.config.pageToken.substring(0, 4) + '...' + this.config.pageToken.substring(this.config.pageToken.length - 4);
    }
    if (this.config.appSecret) {
      this.config.appSecret = this.config.appSecret.substring(0, 4) + '...' + this.config.appSecret.substring(this.config.appSecret.length - 4);
    }
  }
  next();
});

/**
 * Update stats when a message is received
 */
IntegrationSchema.methods.recordMessageReceived = async function() {
  this.stats.messagesReceived += 1;
  this.stats.lastActivityAt = new Date();
  return this.save();
};

/**
 * Update stats when a message is sent
 */
IntegrationSchema.methods.recordMessageSent = async function() {
  this.stats.messagesSent += 1;
  this.stats.lastActivityAt = new Date();
  return this.save();
};

/**
 * Update active users count
 */
IntegrationSchema.methods.updateActiveUsers = async function(count) {
  this.stats.activeUsers = count;
  return this.save();
};

module.exports = mongoose.model('Integration', IntegrationSchema);
