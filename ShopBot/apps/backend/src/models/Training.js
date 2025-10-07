const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['intent', 'entity', 'response', 'conversation_flow', 'knowledge_base'],
    required: true
  },
  input: {
    text: String,
    intent: String,
    entities: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      start: Number,
      end: Number
    }],
    context: mongoose.Schema.Types.Mixed
  },
  expectedOutput: {
    intent: {
      name: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      }
    },
    entities: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    response: String,
    action: String
  },
  actualOutput: {
    intent: {
      name: String,
      confidence: Number
    },
    entities: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      confidence: Number
    }],
    response: String,
    action: String,
    processingTime: Number
  },
  validation: {
    isCorrect: {
      type: Boolean,
      default: null
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    feedback: String,
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validatedAt: Date
  },
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'conversation', 'import', 'generated'],
      default: 'manual'
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    sessionId: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    language: {
      type: String,
      default: 'en'
    },
    tags: [String],
    category: String
  },
  performance: {
    accuracy: {
      type: Number,
      min: 0,
      max: 1
    },
    precision: {
      type: Number,
      min: 0,
      max: 1
    },
    recall: {
      type: Number,
      min: 0,
      max: 1
    },
    f1Score: {
      type: Number,
      min: 0,
      max: 1
    },
    testCount: {
      type: Number,
      default: 0
    },
    lastTested: Date
  },
  status: {
    type: String,
    enum: ['pending', 'validated', 'rejected', 'needs_review', 'archived'],
    default: 'pending'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
trainingSchema.index({ chatbotId: 1, type: 1, status: 1 });
trainingSchema.index({ 'input.intent': 1 });
trainingSchema.index({ 'metadata.category': 1 });
trainingSchema.index({ 'metadata.tags': 1 });
trainingSchema.index({ priority: -1, createdAt: -1 });
trainingSchema.index({ 'performance.accuracy': -1 });

// Virtual for overall performance score
trainingSchema.virtual('performanceScore').get(function() {
  if (!this.performance.accuracy) return 0;
  
  const weights = {
    accuracy: 0.4,
    precision: 0.2,
    recall: 0.2,
    f1Score: 0.2
  };
  
  return (
    (this.performance.accuracy || 0) * weights.accuracy +
    (this.performance.precision || 0) * weights.precision +
    (this.performance.recall || 0) * weights.recall +
    (this.performance.f1Score || 0) * weights.f1Score
  );
});

// Pre-save middleware
trainingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Calculate performance metrics if we have both expected and actual output
  if (this.expectedOutput && this.actualOutput && this.validation.isCorrect !== null) {
    this.calculatePerformanceMetrics();
  }
  
  next();
});

// Instance methods
trainingSchema.methods.calculatePerformanceMetrics = function() {
  // Simple accuracy calculation
  this.performance.accuracy = this.validation.isCorrect ? 1 : 0;
  
  // Intent accuracy
  if (this.expectedOutput.intent && this.actualOutput.intent) {
    const intentMatch = this.expectedOutput.intent.name === this.actualOutput.intent.name;
    const confidenceThreshold = 0.7;
    const confidenceMatch = this.actualOutput.intent.confidence >= confidenceThreshold;
    
    this.performance.precision = intentMatch && confidenceMatch ? 1 : 0;
    this.performance.recall = intentMatch ? 1 : 0;
    
    // F1 Score
    if (this.performance.precision + this.performance.recall > 0) {
      this.performance.f1Score = 2 * (this.performance.precision * this.performance.recall) / 
        (this.performance.precision + this.performance.recall);
    }
  }
  
  this.performance.testCount += 1;
  this.performance.lastTested = new Date();
};

trainingSchema.methods.validate = function(isCorrect, feedback, validatedBy) {
  this.validation.isCorrect = isCorrect;
  this.validation.feedback = feedback;
  this.validation.validatedBy = validatedBy;
  this.validation.validatedAt = new Date();
  this.status = isCorrect ? 'validated' : 'rejected';
  
  return this.save();
};

trainingSchema.methods.test = function(actualOutput) {
  this.actualOutput = actualOutput;
  this.performance.testCount += 1;
  this.performance.lastTested = new Date();
  
  // Auto-validate if we can determine correctness
  if (this.expectedOutput.intent && actualOutput.intent) {
    const isCorrect = this.expectedOutput.intent.name === actualOutput.intent.name;
    this.validation.isCorrect = isCorrect;
    this.validation.confidence = actualOutput.intent.confidence || 0;
  }
  
  return this.save();
};

trainingSchema.methods.generateVariations = function(count = 5) {
  const variations = [];
  const originalText = this.input.text;
  
  // Simple text variations (in production, use more sophisticated NLP)
  const synonyms = {
    'hello': ['hi', 'hey', 'greetings'],
    'help': ['assist', 'support', 'aid'],
    'buy': ['purchase', 'get', 'order'],
    'find': ['search', 'look for', 'locate']
  };
  
  for (let i = 0; i < count; i++) {
    let variation = originalText;
    
    // Replace words with synonyms
    Object.entries(synonyms).forEach(([word, syns]) => {
      if (variation.toLowerCase().includes(word)) {
        const randomSyn = syns[Math.floor(Math.random() * syns.length)];
        variation = variation.replace(new RegExp(word, 'gi'), randomSyn);
      }
    });
    
    // Add some randomness
    if (Math.random() > 0.5) {
      variation = variation + (Math.random() > 0.5 ? '?' : '.');
    }
    
    if (variation !== originalText) {
      variations.push({
        chatbotId: this.chatbotId,
        type: this.type,
        input: {
          ...this.input,
          text: variation
        },
        expectedOutput: this.expectedOutput,
        metadata: {
          ...this.metadata,
          source: 'generated',
          category: this.metadata.category + '_variation'
        },
        createdBy: this.createdBy
      });
    }
  }
  
  return variations;
};

// Static methods
trainingSchema.statics.findByType = function(chatbotId, type, status = 'validated') {
  return this.find({
    chatbotId,
    type,
    status
  }).sort({ priority: -1, createdAt: -1 });
};

trainingSchema.statics.findByIntent = function(chatbotId, intentName) {
  return this.find({
    chatbotId,
    'input.intent': intentName,
    status: { $in: ['validated', 'pending'] }
  }).sort({ priority: -1, createdAt: -1 });
};

trainingSchema.statics.getPerformanceStats = function(chatbotId, type) {
  return this.aggregate([
    {
      $match: {
        chatbotId: new mongoose.Types.ObjectId(chatbotId),
        ...(type && { type }),
        status: 'validated',
        'performance.accuracy': { $exists: true }
      }
    },
    {
      $group: {
        _id: type ? '$type' : null,
        totalSamples: { $sum: 1 },
        averageAccuracy: { $avg: '$performance.accuracy' },
        averagePrecision: { $avg: '$performance.precision' },
        averageRecall: { $avg: '$performance.recall' },
        averageF1Score: { $avg: '$performance.f1Score' },
        highPerformingSamples: {
          $sum: { $cond: [{ $gte: ['$performance.accuracy', 0.8] }, 1, 0] }
        },
        lowPerformingSamples: {
          $sum: { $cond: [{ $lt: ['$performance.accuracy', 0.5] }, 1, 0] }
        }
      }
    }
  ]);
};

trainingSchema.statics.getNeedsReview = function(chatbotId, limit = 50) {
  return this.find({
    chatbotId,
    $or: [
      { status: 'needs_review' },
      { status: 'pending', 'performance.accuracy': { $lt: 0.5 } },
      { 'validation.isCorrect': null, 'performance.testCount': { $gte: 5 } }
    ]
  })
  .sort({ priority: -1, 'performance.lastTested': -1 })
  .limit(limit)
  .populate('createdBy', 'username');
};

trainingSchema.statics.generateTrainingSet = function(chatbotId, options = {}) {
  const {
    type,
    minSamples = 10,
    maxSamples = 1000,
    includeVariations = true,
    balanceIntents = true
  } = options;
  
  const pipeline = [
    {
      $match: {
        chatbotId: new mongoose.Types.ObjectId(chatbotId),
        status: 'validated',
        ...(type && { type })
      }
    }
  ];
  
  if (balanceIntents && type === 'intent') {
    // Balance intents by limiting samples per intent
    pipeline.push(
      {
        $group: {
          _id: '$input.intent',
          samples: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          samples: {
            $slice: ['$samples', Math.min(maxSamples / 10, 100)] // Max 100 per intent
          }
        }
      },
      { $unwind: '$samples' },
      { $replaceRoot: { newRoot: '$samples' } }
    );
  }
  
  pipeline.push(
    { $sort: { 'performance.accuracy': -1, priority: -1 } },
    { $limit: maxSamples }
  );
  
  return this.aggregate(pipeline);
};

trainingSchema.statics.importFromConversations = function(chatbotId, conversationIds, options = {}) {
  const {
    minConfidence = 0.7,
    includeFailures = true,
    autoValidate = false
  } = options;
  
  // This would typically analyze conversations and extract training data
  // Implementation would depend on conversation structure and requirements
  return this.aggregate([
    {
      $lookup: {
        from: 'conversations',
        localField: 'metadata.conversationId',
        foreignField: '_id',
        as: 'conversation'
      }
    },
    {
      $match: {
        'conversation.chatbotId': new mongoose.Types.ObjectId(chatbotId),
        'conversation._id': { $in: conversationIds.map(id => new mongoose.Types.ObjectId(id)) }
      }
    }
    // Additional processing would go here
  ]);
};

module.exports = mongoose.model('Training', trainingSchema);
