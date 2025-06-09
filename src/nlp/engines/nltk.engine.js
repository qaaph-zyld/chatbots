/**
 * NLTK NLP Engine Adapter
 * 
 * Provides integration with the NLTK (Natural Language Toolkit) library through a Python bridge
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('@src/utils');

/**
 * NLTK Engine class
 */
class NLTKEngine {
  /**
   * Constructor
   * @param {Object} options - NLTK engine options
   */
  constructor(options = {}) {
    this.options = {
      pythonPath: process.env.PYTHON_PATH || 'python',
      scriptPath: path.join(__dirname, '../../../scripts/python/nltk_bridge.py'),
      ...options
    };
    
    this.initialized = false;
    this.initPromise = null;
    
    logger.info('NLTK Engine initialized');
  }
  
  /**
   * Initialize the NLTK engine
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise(async (resolve) => {
      try {
        // Check if Python script exists
        if (!fs.existsSync(this.options.scriptPath)) {
          logger.error(`NLTK bridge script not found at ${this.options.scriptPath}`);
          await this._createBridgeScript();
        }
        
        // Test connection to Python
        const testResult = await this._runPythonCommand('test_connection');
        
        if (testResult && testResult.success) {
          this.initialized = true;
          logger.info('NLTK Engine successfully connected to Python bridge');
          resolve(true);
        } else {
          logger.error('Failed to connect to NLTK Python bridge:', testResult?.error || 'Unknown error');
          resolve(false);
        }
      } catch (error) {
        logger.error('Error initializing NLTK Engine:', error.message);
        resolve(false);
      }
    });
    
    return this.initPromise;
  }
  
  /**
   * Create the Python bridge script if it doesn't exist
   * @private
   */
  async _createBridgeScript() {
    const scriptDir = path.dirname(this.options.scriptPath);
    
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }
    
    const scriptContent = `#!/usr/bin/env python
# NLTK Bridge Script
# This script provides a bridge between Node.js and NLTK

import sys
import json
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.tag import pos_tag
from nltk.chunk import ne_chunk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.probability import FreqDist

# Download required NLTK resources
try:
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('maxent_ne_chunker', quiet=True)
    nltk.download('words', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('vader_lexicon', quiet=True)
    print(json.dumps({"success": True, "message": "NLTK resources downloaded successfully"}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1)

# Initialize components
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))
sia = SentimentIntensityAnalyzer()

def process_text(text):
    """Process text with NLTK and return structured results"""
    # Tokenize into sentences
    sentences = sent_tokenize(text)
    
    # Process each sentence
    processed_sentences = []
    for sentence in sentences:
        # Tokenize into words
        tokens = word_tokenize(sentence)
        
        # Part-of-speech tagging
        pos_tags = pos_tag(tokens)
        
        # Named entity recognition
        named_entities = ne_chunk(pos_tags)
        
        # Extract entities (simplified)
        entities = []
        for chunk in named_entities:
            if hasattr(chunk, 'label'):
                entity_text = ' '.join(c[0] for c in chunk)
                entity_label = chunk.label()
                entities.append({"text": entity_text, "label": entity_label})
        
        # Process tokens
        processed_tokens = []
        for token, pos in pos_tags:
            lemma = lemmatizer.lemmatize(token)
            is_stop = token.lower() in stop_words
            processed_tokens.append({
                "text": token,
                "lemma": lemma,
                "pos": pos,
                "is_stop": is_stop
            })
        
        processed_sentences.append({
            "text": sentence,
            "tokens": processed_tokens,
            "entities": entities
        })
    
    # Get frequency distribution of words
    all_tokens = [token.lower() for sentence in processed_sentences for token in sentence["text"].split() 
                 if token.lower() not in stop_words and token.isalpha()]
    freq_dist = FreqDist(all_tokens)
    keywords = [{"text": word, "count": count} for word, count in freq_dist.most_common(10)]
    
    # Sentiment analysis
    sentiment = sia.polarity_scores(text)
    
    return {
        "sentences": processed_sentences,
        "keywords": keywords,
        "sentiment": sentiment
    }

def extract_entities(text):
    """Extract entities from text"""
    tokens = word_tokenize(text)
    pos_tags = pos_tag(tokens)
    named_entities = ne_chunk(pos_tags)
    
    entities = []
    for chunk in named_entities:
        if hasattr(chunk, 'label'):
            entity_text = ' '.join(c[0] for c in chunk)
            entity_label = chunk.label()
            entities.append({"text": entity_text, "label": entity_label})
    
    return {"entities": entities}

def extract_keywords(text):
    """Extract keywords from text"""
    tokens = word_tokenize(text.lower())
    filtered_tokens = [token for token in tokens if token.isalpha() and token not in stop_words]
    
    # Get frequency distribution
    freq_dist = FreqDist(filtered_tokens)
    keywords = [word for word, _ in freq_dist.most_common(10)]
    
    return {"keywords": keywords}

def analyze_sentiment(text):
    """Analyze sentiment of text using VADER"""
    sentiment = sia.polarity_scores(text)
    
    # Convert VADER output to our standard format
    score = sentiment["compound"]
    label = "positive" if score >= 0.05 else "negative" if score <= -0.05 else "neutral"
    magnitude = abs(score)
    
    return {"score": score, "magnitude": magnitude, "label": label, "details": sentiment}

def detect_language(text):
    """Detect language of text"""
    # Note: NLTK doesn't have built-in language detection
    # This is a placeholder that would need to be enhanced with a proper language detection library
    # In a real implementation, you would use langdetect or similar
    return {"language": "en", "confidence": 1.0}

def test_connection():
    """Test the connection to the Python bridge"""
    return {"success": True, "message": "Connection successful"}

# Main command handler
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No command specified"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "test_connection":
        print(json.dumps(test_connection()))
    elif command == "process":
        if len(sys.argv) < 3:
            print(json.dumps({"success": False, "error": "No text specified"}))
            sys.exit(1)
        text = sys.argv[2]
        print(json.dumps(process_text(text)))
    elif command == "entities":
        if len(sys.argv) < 3:
            print(json.dumps({"success": False, "error": "No text specified"}))
            sys.exit(1)
        text = sys.argv[2]
        print(json.dumps(extract_entities(text)))
    elif command == "keywords":
        if len(sys.argv) < 3:
            print(json.dumps({"success": False, "error": "No text specified"}))
            sys.exit(1)
        text = sys.argv[2]
        print(json.dumps(extract_keywords(text)))
    elif command == "sentiment":
        if len(sys.argv) < 3:
            print(json.dumps({"success": False, "error": "No text specified"}))
            sys.exit(1)
        text = sys.argv[2]
        print(json.dumps(analyze_sentiment(text)))
    elif command == "language":
        if len(sys.argv) < 3:
            print(json.dumps({"success": False, "error": "No text specified"}))
            sys.exit(1)
        text = sys.argv[2]
        print(json.dumps(detect_language(text)))
    else:
        print(json.dumps({"success": False, "error": f"Unknown command: {command}"}))
        sys.exit(1)
`;
    
    fs.writeFileSync(this.options.scriptPath, scriptContent);
    logger.info(`Created NLTK bridge script at ${this.options.scriptPath}`);
  }
  
  /**
   * Run a Python command through the bridge
   * @param {string} command - Command to run
   * @param {string} text - Text to process
   * @returns {Promise<Object>} - Command result
   * @private
   */
  async _runPythonCommand(command, text = '') {
    return new Promise((resolve) => {
      const args = [this.options.scriptPath, command];
      
      if (text) {
        args.push(text);
      }
      
      const pythonProcess = spawn(this.options.pythonPath, args);
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          logger.error(`Python process exited with code ${code}`);
          logger.error(`Error output: ${errorOutput}`);
          resolve({ success: false, error: errorOutput });
          return;
        }
        
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (error) {
          logger.error('Error parsing Python output:', error.message);
          logger.error(`Raw output: ${output}`);
          resolve({ success: false, error: 'Invalid JSON output' });
        }
      });
    });
  }
  
  /**
   * Process text with NLTK
   * @param {string} text - Text to process
   * @returns {Promise<Object>} - Processing result
   */
  async processText(text) {
    await this.initialize();
    return this._runPythonCommand('process', text);
  }
  
  /**
   * Extract entities from text
   * @param {string} text - Text to extract entities from
   * @returns {Promise<Object>} - Extraction result
   */
  async extractEntities(text) {
    await this.initialize();
    const result = await this._runPythonCommand('entities', text);
    return result.entities || [];
  }
  
  /**
   * Extract keywords from text
   * @param {string} text - Text to extract keywords from
   * @returns {Promise<Array>} - Array of extracted keywords
   */
  async extractKeywords(text) {
    await this.initialize();
    const result = await this._runPythonCommand('keywords', text);
    return result.keywords || [];
  }
  
  /**
   * Analyze sentiment of text
   * @param {string} text - Text to analyze sentiment of
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text) {
    await this.initialize();
    return this._runPythonCommand('sentiment', text);
  }
  
  /**
   * Detect language of text
   * @param {string} text - Text to detect language of
   * @returns {Promise<Object>} - Language detection result
   */
  async detectLanguage(text) {
    await this.initialize();
    return this._runPythonCommand('language', text);
  }
}

// Create singleton instance
const nltkEngine = new NLTKEngine();

module.exports = nltkEngine;
