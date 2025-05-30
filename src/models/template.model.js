/**
 * Template Model
 * 
 * This model defines the schema for chatbot templates, which allow users
 * to quickly create new chatbots based on pre-defined configurations.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Template Schema
 */
const templateSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['customer-service', 'sales', 'support', 'education', 'entertainment', 'productivity', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  configuration: {
    personality: {
      type: Schema.Types.Mixed,
      required: true
    },
    knowledgeBase: {
      type: Schema.Types.Mixed,
      default: null
    },
    defaultResponses: {
      type: Schema.Types.Mixed,
      default: {}
    },
    plugins: [{
      type: Schema.Types.Mixed
    }],
    integrations: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  previewImage: {
    type: String,
    default: null
  },
  featured: {
    type: Boolean,
    default: false
  },
  official: {
    type: Boolean,
    default: false
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
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

// Middleware to update the updatedAt field
templateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for template URL
templateSchema.virtual('url').get(function() {
  return `/templates/${this._id}`;
});

// Method to increment usage count
templateSchema.methods.incrementUsage = async function() {
  this.usageCount += 1;
  return this.save();
};

// Method to add a review
templateSchema.methods.addReview = async function(userId, rating, comment) {
  // Check if user has already reviewed
  const existingReviewIndex = this.reviews.findIndex(
    review => review.user.toString() === userId.toString()
  );
  
  if (existingReviewIndex >= 0) {
    // Update existing review
    this.reviews[existingReviewIndex].rating = rating;
    this.reviews[existingReviewIndex].comment = comment;
    this.reviews[existingReviewIndex].createdAt = Date.now();
  } else {
    // Add new review
    this.reviews.push({
      user: userId,
      rating,
      comment,
      createdAt: Date.now()
    });
  }
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating.average = totalRating / this.reviews.length;
  this.rating.count = this.reviews.length;
  
  return this.save();
};

// Static method to find featured templates
templateSchema.statics.findFeatured = function(limit = 5) {
  return this.find({ featured: true, status: 'published', isPublic: true })
    .sort({ usageCount: -1 })
    .limit(limit);
};

// Static method to find popular templates
templateSchema.statics.findPopular = function(limit = 10) {
  return this.find({ status: 'published', isPublic: true })
    .sort({ usageCount: -1 })
    .limit(limit);
};

// Static method to find templates by category
templateSchema.statics.findByCategory = function(category, limit = 20) {
  return this.find({ category, status: 'published', isPublic: true })
    .sort({ usageCount: -1 })
    .limit(limit);
};

// Static method to search templates
templateSchema.statics.search = function(query, limit = 20) {
  return this.find({
    $and: [
      { status: 'published', isPublic: true },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  })
  .sort({ usageCount: -1 })
  .limit(limit);
};

// Create and export the model
const Template = mongoose.model('Template', templateSchema);
module.exports = Template;
