/**
 * spaCy NLP Engine Adapter
 * 
 * Provides integration with the spaCy NLP library through a Python bridge
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { logger } = require('../../utils');

/**
 * spaCy Engine class
 */
class SpacyEngine {
  /**
   * Constructor
   * @param {Object} options - spaCy engine options
   */
  constructor(options = {}) {
    this.options = {
      pythonPath: process.env.PYTHON_PATH || 'python',
      modelName: process.env.SPACY_MODEL || 'en_core_web_md',
      scriptPath: path.join(__dirname, '../../../scripts/python/spacy_bridge.py'),
      ...options
    };
    
    this.initialized = false;
    this.initPromise = null;
    
    logger.info('spaCy Engine initialized with model:', this.options.modelName);
  }
  
  /**
   * Initialize the spaCy engine
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.initialized) return true;
    
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise(async (resolve) => {
      try {
        // Check if Python script exists
        if (!fs.existsSync(this.options.scriptPath)) {
          logger.error(`spaCy bridge script not found at ${this.options.scriptPath}`);
          await this._createBridgeScript();
        }
        
        // Test connection to Python
        const testResult = await this._runPythonCommand('test_connection');
        
        if (testResult && testResult.success) {
          this.initialized = true;
          logger.info('spaCy Engine successfully connected to Python bridge');
          resolve(true);
        } else {
          logger.error('Failed to connect to spaCy Python bridge:', testResult?.error || 'Unknown error');
          resolve(false);
        }
      } catch (error) {
        logger.error('Error initializing spaCy Engine:', error.message);
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
# spaCy Bridge Script
# This script provides a bridge between Node.js and spaCy

import sys
import json
import spacy

# Load the spaCy model
try:
    nlp = spacy.load("${this.options.modelName}")
    print(json.dumps({"success": True, "message": "Model loaded successfully"}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
    sys.exit(1)

def process_text(text):
    """Process text with spaCy and return structured results"""
    doc = nlp(text)
    
    # Extract entities
    entities = [{"text": ent.text, "label": ent.label_, "start": ent.start_char, "end": ent.end_char} 
                for ent in doc.ents]
    
    # Extract tokens with part-of-speech tags
    tokens = [{"text": token.text, "lemma": token.lemma_, "pos": token.pos_, 
               "tag": token.tag_, "dep": token.dep_, "is_stop": token.is_stop}
              for token in doc]
    
    # Extract noun chunks
    noun_chunks = [{"text": chunk.text, "root_text": chunk.root.text, 
                    "root_dep": chunk.root.dep_, "start": chunk.start_char, 
                    "end": chunk.end_char}
                   for chunk in doc.noun_chunks]
    
    # Extract sentences
    sentences = [{"text": sent.text, "start": sent.start_char, "end": sent.end_char}
                 for sent in doc.sents]
    
    return {
        "entities": entities,
        "tokens": tokens,
        "noun_chunks": noun_chunks,
        "sentences": sentences
    }

def extract_entities(text):
    """Extract entities from text"""
    doc = nlp(text)
    entities = [{"text": ent.text, "label": ent.label_, "start": ent.start_char, "end": ent.end_char} 
                for ent in doc.ents]
    return {"entities": entities}

def extract_keywords(text):
    """Extract keywords from text"""
    doc = nlp(text)
    keywords = [token.text for token in doc if not token.is_stop and token.is_alpha and token.pos_ in ["NOUN", "PROPN", "ADJ"]]
    return {"keywords": keywords}

def analyze_sentiment(text):
    """Basic sentiment analysis based on spaCy"""
    # Note: spaCy doesn't have built-in sentiment analysis
    # This is a placeholder that would need to be enhanced with a proper sentiment library
    doc = nlp(text)
    # Simple heuristic based on presence of positive/negative words
    # In a real implementation, you would use a proper sentiment lexicon
    positive_words = ["good", "great", "excellent", "amazing", "wonderful", "fantastic"]
    negative_words = ["bad", "terrible", "awful", "horrible", "poor", "disappointing"]
    
    score = 0
    for token in doc:
        if token.lemma_.lower() in positive_words:
            score += 1
        elif token.lemma_.lower() in negative_words:
            score -= 1
    
    magnitude = abs(score)
    label = "positive" if score > 0 else "negative" if score < 0 else "neutral"
    
    return {"score": score, "magnitude": magnitude, "label": label}

def detect_language(text):
    """Detect language of text"""
    # Note: spaCy doesn't have built-in language detection
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
    logger.info(`Created spaCy bridge script at ${this.options.scriptPath}`);
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
   * Process text with spaCy
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
const spacyEngine = new SpacyEngine();

module.exports = spacyEngine;
