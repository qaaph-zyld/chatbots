const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Conversation',
    required: true,
    index: true
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 4000
  },
  sender_type: { 
    type: String, 
    enum: ['user', 'bot', 'agent', 'system'],
    required: true,
    index: true
  },
  sender_id: {
    type: String,
    index: true
  },
  intent: { 
    type: String,
    index: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  entities: [{
    type: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  actions: [{
    type: {
      type: String,
      required: true
    },
    data: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    result: mongoose.Schema.Types.Mixed
  }],
  response_time: {
    type: Number // Time in milliseconds
  },
  language: {
    type: String,
    default: 'en',
    maxlength: 5
  },
  is_escalated: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file', 'link']
    },
    url: String,
    filename: String,
    size: Number,
    mime_type: String
  }],
  edited: {
    type: Boolean,
    default: false
  },
  edited_at: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes
messageSchema.index({ conversation_id: 1, createdAt: 1 });
messageSchema.index({ sender_type: 1, createdAt: -1 });
messageSchema.index({ intent: 1, createdAt: -1 });
messageSchema.index({ conversation_id: 1, sender_type: 1 });

// Text index for search
messageSchema.index({ content: 'text' });

// Methods
messageSchema.methods.isFromUser = function() {
  return this.sender_type === 'user';
};

messageSchema.methods.isFromBot = function() {
  return this.sender_type === 'bot';
};

messageSchema.methods.isFromAgent = function() {
  return this.sender_type === 'agent';
};

messageSchema.methods.addAction = function(actionType, actionData) {
  this.actions.push({
    type: actionType,
    data: actionData,
    status: 'pending'
  });
  return this.save();
};

messageSchema.methods.updateActionStatus = function(actionIndex, status, result) {
  if (this.actions[actionIndex]) {
    this.actions[actionIndex].status = status;
    if (result) {
      this.actions[actionIndex].result = result;
    }
    return this.save();
  }
  return Promise.resolve(this);
};

messageSchema.methods.addEntity = function(entityType, value, confidence) {
  this.entities.push({
    type: entityType,
    value: value,
    confidence: confidence || 1.0
  });
  return this.save();
};

messageSchema.methods.edit = function(newContent) {
  this.content = newContent;
  this.edited = true;
  this.edited_at = new Date();
  return this.save();
};

messageSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deleted_at = new Date();
  return this.save();
};

messageSchema.methods.addAttachment = function(type, url, filename, size, mimeType) {
  this.attachments.push({
    type: type,
    url: url,
    filename: filename,
    size: size,
    mime_type: mimeType
  });
  return this.save();
};

// Static methods
messageSchema.statics.findByConversation = function(conversationId, options = {}) {
  const query = { 
    conversation_id: conversationId,
    deleted: { $ne: true }
  };
  
  if (options.sender_type) {
    query.sender_type = options.sender_type;
  }
  
  if (options.intent) {
    query.intent = options.intent;
  }
  
  return this.find(query)
    .sort({ createdAt: options.sort === 'desc' ? -1 : 1 })
    .limit(options.limit || 100);
};

messageSchema.statics.findByIntent = function(intent, storeId, limit = 50) {
  return this.aggregate([
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversation_id',
        foreignField: '_id',
        as: 'conversation'
      }
    },
    {
      $match: {
        intent: intent,
        'conversation.store_id': mongoose.Types.ObjectId(storeId),
        deleted: { $ne: true }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

messageSchema.statics.searchContent = function(searchTerm, conversationId, limit = 20) {
  const query = {
    $text: { $search: searchTerm },
    deleted: { $ne: true }
  };
  
  if (conversationId) {
    query.conversation_id = conversationId;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

messageSchema.statics.getAnalytics = function(storeId, startDate, endDate) {
  const pipeline = [
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversation_id',
        foreignField: '_id',
        as: 'conversation'
      }
    },
    {
      $match: {
        'conversation.store_id': mongoose.Types.ObjectId(storeId),
        deleted: { $ne: true }
      }
    }
  ];
  
  if (startDate && endDate) {
    pipeline.push({
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    });
  }
  
  pipeline.push({
    $group: {
      _id: null,
      total_messages: { $sum: 1 },
      user_messages: { $sum: { $cond: [{ $eq: ['$sender_type', 'user'] }, 1, 0] } },
      bot_messages: { $sum: { $cond: [{ $eq: ['$sender_type', 'bot'] }, 1, 0] } },
      agent_messages: { $sum: { $cond: [{ $eq: ['$sender_type', 'agent'] }, 1, 0] } },
      avg_response_time: { $avg: '$response_time' },
      avg_confidence: { $avg: '$confidence' },
      top_intents: { $push: '$intent' }
    }
  });
  
  return this.aggregate(pipeline);
};

messageSchema.statics.getIntentDistribution = function(storeId, startDate, endDate) {
  const pipeline = [
    {
      $lookup: {
        from: 'conversations',
        localField: 'conversation_id',
        foreignField: '_id',
        as: 'conversation'
      }
    },
    {
      $match: {
        'conversation.store_id': mongoose.Types.ObjectId(storeId),
        intent: { $exists: true, $ne: null },
        deleted: { $ne: true }
      }
    }
  ];
  
  if (startDate && endDate) {
    pipeline.push({
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    });
  }
  
  pipeline.push(
    {
      $group: {
        _id: '$intent',
        count: { $sum: 1 },
        avg_confidence: { $avg: '$confidence' }
      }
    },
    {
      $sort: { count: -1 }
    }
  );
  
  return this.aggregate(pipeline);
};

// Virtual for word count
messageSchema.virtual('wordCount').get(function() {
  return this.content.split(/\s+/).length;
});

// Virtual for character count
messageSchema.virtual('characterCount').get(function() {
  return this.content.length;
});

// Pre-save middleware
messageSchema.pre('save', function(next) {
  if (this.isNew && this.sender_type === 'bot' && !this.response_time) {
    // Set a default response time for bot messages
    this.response_time = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
  }
  next();
});

// Ensure virtual fields are serialized
messageSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Message', messageSchema);
