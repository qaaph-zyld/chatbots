const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  summary: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  keywords: [{
    word: String,
    weight: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    }
  }],
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'import', 'crawl', 'api'],
      default: 'manual'
    },
    sourceUrl: String,
    language: {
      type: String,
      default: 'en'
    },
    format: {
      type: String,
      enum: ['text', 'markdown', 'html', 'json'],
      default: 'text'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    }
  },
  searchIndex: {
    // Pre-computed search vectors for faster retrieval
    titleVector: [Number],
    contentVector: [Number],
    combinedScore: {
      type: Number,
      default: 0
    }
  },
  usage: {
    accessCount: {
      type: Number,
      default: 0
    },
    lastAccessed: Date,
    relevanceScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    userFeedback: [{
      userId: String,
      helpful: Boolean,
      comment: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived', 'pending_review'],
    default: 'active'
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  relatedEntries: [{
    entryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'KnowledgeBase'
    },
    relationshipType: {
      type: String,
      enum: ['similar', 'prerequisite', 'follow_up', 'alternative'],
      default: 'similar'
    },
    strength: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  }],
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
knowledgeBaseSchema.index({ chatbotId: 1, status: 1 });
knowledgeBaseSchema.index({ category: 1, status: 1 });
knowledgeBaseSchema.index({ tags: 1 });
knowledgeBaseSchema.index({ 'keywords.word': 1 });
knowledgeBaseSchema.index({ title: 'text', content: 'text', summary: 'text' });
knowledgeBaseSchema.index({ 'usage.relevanceScore': -1 });
knowledgeBaseSchema.index({ priority: -1, 'usage.accessCount': -1 });

// Virtual for helpfulness ratio
knowledgeBaseSchema.virtual('helpfulnessRatio').get(function() {
  if (!this.usage.userFeedback || this.usage.userFeedback.length === 0) {
    return 0;
  }
  
  const helpful = this.usage.userFeedback.filter(f => f.helpful).length;
  return helpful / this.usage.userFeedback.length;
});

// Pre-save middleware
knowledgeBaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.metadata.lastUpdated = new Date();
  
  // Extract keywords from content if not provided
  if (!this.keywords || this.keywords.length === 0) {
    this.keywords = this.extractKeywords();
  }
  
  // Update search index
  this.updateSearchIndex();
  
  next();
});

// Instance methods
knowledgeBaseSchema.methods.extractKeywords = function() {
  const text = `${this.title} ${this.content}`.toLowerCase();
  const words = text.match(/\b\w{3,}\b/g) || [];
  
  // Simple keyword extraction (in production, use more sophisticated NLP)
  const wordFreq = {};
  words.forEach(word => {
    if (!this.isStopWord(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Get top keywords
  const sortedWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20);
  
  return sortedWords.map(([word, freq]) => ({
    word,
    weight: Math.min(freq / words.length * 10, 1)
  }));
};

knowledgeBaseSchema.methods.isStopWord = function(word) {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);
  return stopWords.has(word);
};

knowledgeBaseSchema.methods.updateSearchIndex = function() {
  // Simple text vectorization (in production, use proper embedding models)
  const titleWords = this.title.toLowerCase().split(/\s+/);
  const contentWords = this.content.toLowerCase().split(/\s+/);
  
  // Create simple word frequency vectors
  this.searchIndex.titleVector = this.createWordVector(titleWords);
  this.searchIndex.contentVector = this.createWordVector(contentWords);
  
  // Combined relevance score
  this.searchIndex.combinedScore = 
    (this.priority / 10) * 0.3 +
    (this.usage.relevanceScore || 0) * 0.4 +
    (this.helpfulnessRatio || 0) * 0.3;
};

knowledgeBaseSchema.methods.createWordVector = function(words) {
  // Simplified vectorization - in production use proper embeddings
  const vector = new Array(100).fill(0);
  words.forEach((word, index) => {
    const hash = this.simpleHash(word) % 100;
    vector[hash] += 1;
  });
  return vector;
};

knowledgeBaseSchema.methods.simpleHash = function(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

knowledgeBaseSchema.methods.recordAccess = function(userId) {
  this.usage.accessCount += 1;
  this.usage.lastAccessed = new Date();
  
  // Update relevance score based on access patterns
  const daysSinceCreated = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
  const accessFrequency = this.usage.accessCount / Math.max(daysSinceCreated, 1);
  
  this.usage.relevanceScore = Math.min(accessFrequency * 0.1, 1);
  
  return this.save();
};

knowledgeBaseSchema.methods.addFeedback = function(userId, helpful, comment) {
  // Remove existing feedback from same user
  this.usage.userFeedback = this.usage.userFeedback.filter(
    f => f.userId !== userId
  );
  
  // Add new feedback
  this.usage.userFeedback.push({
    userId,
    helpful,
    comment,
    timestamp: new Date()
  });
  
  return this.save();
};

knowledgeBaseSchema.methods.findSimilar = function(limit = 5) {
  // Find similar entries based on tags and keywords
  const tagQuery = this.tags.length > 0 ? { tags: { $in: this.tags } } : {};
  const keywordWords = this.keywords.map(k => k.word);
  const keywordQuery = keywordWords.length > 0 ? 
    { 'keywords.word': { $in: keywordWords } } : {};
  
  return this.constructor.find({
    $and: [
      { _id: { $ne: this._id } },
      { chatbotId: this.chatbotId },
      { status: 'active' },
      {
        $or: [
          tagQuery,
          keywordQuery,
          { category: this.category }
        ]
      }
    ]
  })
  .sort({ 'usage.relevanceScore': -1, 'usage.accessCount': -1 })
  .limit(limit);
};

// Static methods
knowledgeBaseSchema.statics.search = function(chatbotId, query, options = {}) {
  const {
    limit = 10,
    category,
    tags,
    minRelevance = 0,
    includeInactive = false
  } = options;
  
  const searchFilter = {
    chatbotId,
    status: includeInactive ? { $in: ['active', 'inactive'] } : 'active'
  };
  
  if (category) searchFilter.category = category;
  if (tags && tags.length > 0) searchFilter.tags = { $in: tags };
  if (minRelevance > 0) searchFilter['usage.relevanceScore'] = { $gte: minRelevance };
  
  // Text search with scoring
  return this.find(
    {
      ...searchFilter,
      $text: { $search: query }
    },
    { score: { $meta: 'textScore' } }
  )
  .sort({ 
    score: { $meta: 'textScore' },
    'searchIndex.combinedScore': -1,
    priority: -1
  })
  .limit(limit);
};

knowledgeBaseSchema.statics.findByCategory = function(chatbotId, category, limit = 20) {
  return this.find({
    chatbotId,
    category,
    status: 'active'
  })
  .sort({ priority: -1, 'usage.relevanceScore': -1 })
  .limit(limit);
};

knowledgeBaseSchema.statics.findByTags = function(chatbotId, tags, limit = 20) {
  return this.find({
    chatbotId,
    tags: { $in: tags },
    status: 'active'
  })
  .sort({ 'usage.relevanceScore': -1, priority: -1 })
  .limit(limit);
};

knowledgeBaseSchema.statics.getPopular = function(chatbotId, limit = 10) {
  return this.find({
    chatbotId,
    status: 'active'
  })
  .sort({ 'usage.accessCount': -1, 'usage.relevanceScore': -1 })
  .limit(limit);
};

knowledgeBaseSchema.statics.getRecent = function(chatbotId, limit = 10) {
  return this.find({
    chatbotId,
    status: 'active'
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

knowledgeBaseSchema.statics.getAnalytics = function(chatbotId) {
  return this.aggregate([
    { $match: { chatbotId: new mongoose.Types.ObjectId(chatbotId) } },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        activeEntries: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        totalAccesses: { $sum: '$usage.accessCount' },
        averageRelevance: { $avg: '$usage.relevanceScore' },
        categoriesCount: { $addToSet: '$category' },
        tagsCount: { $addToSet: '$tags' }
      }
    },
    {
      $project: {
        totalEntries: 1,
        activeEntries: 1,
        totalAccesses: 1,
        averageRelevance: 1,
        uniqueCategories: { $size: '$categoriesCount' },
        uniqueTags: { $size: { $reduce: {
          input: '$tagsCount',
          initialValue: [],
          in: { $setUnion: ['$$value', '$$this'] }
        }}}
      }
    }
  ]);
};

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
