/**
 * Personality Schema
 * 
 * Mongoose schema for chatbot personality configurations
 */

const mongoose = require('mongoose');

const PersonalityTraitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Trait name is required'],
    trim: true
  },
  value: {
    type: Number,
    required: [true, 'Trait value is required'],
    min: -1,
    max: 1
  },
  description: {
    type: String,
    trim: true
  }
});

const ToneSettingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tone name is required'],
    trim: true
  },
  strength: {
    type: Number,
    required: [true, 'Tone strength is required'],
    min: 0,
    max: 1
  },
  description: {
    type: String,
    trim: true
  }
});

const PersonalitySchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: [true, 'Chatbot ID is required']
  },
  name: {
    type: String,
    required: [true, 'Personality name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  traits: [PersonalityTraitSchema],
  tones: [ToneSettingSchema],
  languageStyle: {
    formality: {
      type: Number,
      min: -1, // Very informal
      max: 1,  // Very formal
      default: 0
    },
    complexity: {
      type: Number,
      min: -1, // Very simple
      max: 1,  // Very complex
      default: 0
    },
    verbosity: {
      type: Number,
      min: -1, // Very concise
      max: 1,  // Very verbose
      default: 0
    }
  },
  responseCharacteristics: {
    humor: {
      type: Number,
      min: 0, // No humor
      max: 1, // Very humorous
      default: 0.2
    },
    empathy: {
      type: Number,
      min: 0, // No empathy
      max: 1, // Very empathetic
      default: 0.5
    },
    creativity: {
      type: Number,
      min: 0, // Factual/literal
      max: 1, // Very creative
      default: 0.3
    }
  },
  customInstructions: {
    type: String,
    trim: true,
    maxlength: [2000, 'Custom instructions cannot be more than 2000 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
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
  timestamps: true
});

// Create index for faster queries
PersonalitySchema.index({ chatbotId: 1 });
PersonalitySchema.index({ name: 'text', description: 'text' });

// Pre-save hook to update updatedAt timestamp
PersonalitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to generate a prompt modifier based on personality settings
PersonalitySchema.methods.generatePromptModifier = function() {
  let modifier = `Personality: ${this.name}\n\n`;
  
  // Add language style instructions
  modifier += 'Language Style:\n';
  if (this.languageStyle.formality < -0.3) {
    modifier += '- Use casual, informal language\n';
  } else if (this.languageStyle.formality > 0.3) {
    modifier += '- Use formal, professional language\n';
  }
  
  if (this.languageStyle.complexity < -0.3) {
    modifier += '- Use simple, easy-to-understand language\n';
  } else if (this.languageStyle.complexity > 0.3) {
    modifier += '- Use sophisticated, nuanced language\n';
  }
  
  if (this.languageStyle.verbosity < -0.3) {
    modifier += '- Be concise and to the point\n';
  } else if (this.languageStyle.verbosity > 0.3) {
    modifier += '- Be detailed and thorough in explanations\n';
  }
  
  // Add response characteristics
  modifier += '\nResponse Characteristics:\n';
  if (this.responseCharacteristics.humor > 0.7) {
    modifier += '- Use humor frequently\n';
  } else if (this.responseCharacteristics.humor > 0.3) {
    modifier += '- Include occasional humor\n';
  }
  
  if (this.responseCharacteristics.empathy > 0.7) {
    modifier += '- Show strong empathy and emotional understanding\n';
  } else if (this.responseCharacteristics.empathy > 0.3) {
    modifier += '- Be empathetic when appropriate\n';
  }
  
  if (this.responseCharacteristics.creativity > 0.7) {
    modifier += '- Be highly creative and imaginative\n';
  } else if (this.responseCharacteristics.creativity > 0.3) {
    modifier += '- Balance creativity with factual information\n';
  }
  
  // Add traits
  if (this.traits && this.traits.length > 0) {
    modifier += '\nPersonality Traits:\n';
    this.traits.forEach(trait => {
      if (Math.abs(trait.value) > 0.3) {
        const intensity = Math.abs(trait.value) > 0.7 ? 'very ' : '';
        const direction = trait.value > 0 ? '' : 'not ';
        modifier += `- Be ${intensity}${direction}${trait.name}\n`;
      }
    });
  }
  
  // Add tones
  if (this.tones && this.tones.length > 0) {
    modifier += '\nTone of Voice:\n';
    this.tones.forEach(tone => {
      if (tone.strength > 0.3) {
        const intensity = tone.strength > 0.7 ? 'strongly ' : '';
        modifier += `- Communicate with a ${intensity}${tone.name} tone\n`;
      }
    });
  }
  
  // Add custom instructions
  if (this.customInstructions) {
    modifier += '\nCustom Instructions:\n';
    modifier += this.customInstructions;
  }
  
  return modifier;
};

module.exports = mongoose.model('Personality', PersonalitySchema);
