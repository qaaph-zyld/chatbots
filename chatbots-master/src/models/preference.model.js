/**
 * Preference Model
 * 
 * Represents user preferences that can be explicitly set or inferred
 * from conversations, used for personalizing chatbot responses.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PreferenceSchema = new Schema({
  // Preference category (e.g., "communication", "topics", "interface")
  category: {
    type: String,
    required: true,
    index: true
  },
  
  // Preference key (e.g., "responseStyle", "interests", "theme")
  key: {
    type: String,
    required: true,
    index: true
  },
  
  // Preference value (can be string, number, boolean, or array)
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  
  // Source of the preference ("explicit" or "inferred")
  source: {
    type: String,
    enum: ['explicit', 'inferred'],
    default: 'explicit',
    index: true
  },
  
  // Confidence score for this preference (0-1)
  // Higher for explicit preferences, lower for inferred ones
  confidence: {
    type: Number,
    default: 1.0,
    min: 0,
    max: 1
  },
  
  // Additional preference metadata (flexible schema)
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // User who owns this preference
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Chatbot this preference belongs to
  chatbotId: {
    type: String,
    required: true,
    index: true
  },
  
  // Creation timestamp
  created: {
    type: Date,
    default: Date.now
  },
  
  // Last update timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
PreferenceSchema.index({ userId: 1, chatbotId: 1, category: 1, key: 1 }, { unique: true });
PreferenceSchema.index({ userId: 1, chatbotId: 1, source: 1 });

module.exports = mongoose.model('Preference', PreferenceSchema);
