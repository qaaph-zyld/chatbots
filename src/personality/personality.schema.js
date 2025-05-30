/**
 * Personality Schema
 * 
 * Defines the schema for chatbot personalities, allowing customization
 * of tone, style, and behavioral characteristics.
 */

const mongoose = require('mongoose');

const PersonalityTraitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  description: String
});

const PersonalitySchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  traits: [PersonalityTraitSchema],
  toneStyle: {
    formality: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
      description: 'How formal the chatbot\'s language should be (0: casual, 1: formal)'
    },
    friendliness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7,
      description: 'How friendly the chatbot\'s responses should be (0: neutral, 1: very friendly)'
    },
    humor: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.3,
      description: 'How humorous the chatbot should be (0: serious, 1: humorous)'
    },
    empathy: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.6,
      description: 'How empathetic the chatbot should be (0: factual, 1: highly empathetic)'
    },
    assertiveness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
      description: 'How assertive the chatbot should be (0: passive, 1: assertive)'
    }
  },
  responseStyle: {
    verbosity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
      description: 'How verbose the chatbot\'s responses should be (0: concise, 1: detailed)'
    },
    creativity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
      description: 'How creative the chatbot\'s responses should be (0: straightforward, 1: creative)'
    },
    precision: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7,
      description: 'How precise the chatbot\'s responses should be (0: general, 1: specific)'
    },
    complexity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
      description: 'How complex the chatbot\'s language should be (0: simple, 1: complex)'
    }
  },
  behavioralTendencies: {
    proactiveness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
      description: 'How proactive the chatbot should be (0: reactive, 1: proactive)'
    },
    persistence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
      description: 'How persistent the chatbot should be (0: gives up easily, 1: highly persistent)'
    },
    adaptability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7,
      description: 'How adaptable the chatbot should be to changing topics (0: focused, 1: adaptable)'
    },
    curiosity: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.6,
      description: 'How curious the chatbot should be (0: direct, 1: asks follow-up questions)'
    }
  },
  persona: {
    background: {
      type: String,
      default: ''
    },
    expertise: [String],
    interests: [String],
    values: [String]
  },
  languagePatterns: {
    greetings: [String],
    farewells: [String],
    transitions: [String],
    clarifications: [String],
    confirmations: [String]
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Create compound index for efficient lookups
PersonalitySchema.index({ chatbotId: 1, name: 1 }, { unique: true });

// Pre-save hook to update the updatedAt timestamp
PersonalitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create model
const Personality = mongoose.model('Personality', PersonalitySchema);

module.exports = {
  PersonalitySchema,
  Personality
};
