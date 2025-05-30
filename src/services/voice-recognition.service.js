/**
 * Voice Recognition Service
 * 
 * Provides speaker identification and verification capabilities
 * using open-source components.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('../utils/logger');
const config = require('../config/open-voice.config');
const modelManager = require('../utils/model-manager');

// Speaker recognition libraries
let speechbrain;
let pyaudio;

class VoiceRecognitionService {
  constructor() {
    this.config = config.recognition;
    this.speakerProfiles = {};
    this.isInitialized = false;
    
    // Initialize global cache for speaker profiles if not exists
    if (!global.speakerProfiles) {
      global.speakerProfiles = {};
    }
    
    this.speakerProfiles = global.speakerProfiles;
  }
  
  /**
   * Initialize voice recognition service
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }
      
      logger.info('Initializing voice recognition service');
      
      // Ensure model directory exists
      if (!fs.existsSync(this.config.modelPath)) {
        fs.mkdirSync(this.config.modelPath, { recursive: true });
      }
      
      // Ensure profile directory exists
      if (!fs.existsSync(this.config.profilePath)) {
        fs.mkdirSync(this.config.profilePath, { recursive: true });
      }
      
      // Check if model exists and download if needed
      const modelPath = path.join(this.config.modelPath, 'speaker-recognition-model');
      if (!fs.existsSync(modelPath) && this.config.autoDownload) {
        logger.info('Speaker recognition model not found, downloading...');
        const downloadResult = await modelManager.downloadModel('recognition', 'speaker-recognition-model');
        if (!downloadResult.success) {
          logger.error(`Failed to download speaker recognition model: ${downloadResult.message}`);
          return false;
        }
      } else if (!fs.existsSync(modelPath)) {
        logger.warn('Speaker recognition model not found and auto-download disabled');
        return false;
      }
      
      // Load speaker profiles
      await this.loadSpeakerProfiles();
      
      this.isInitialized = true;
      logger.info('Voice recognition service initialized successfully');
      
      return true;
    } catch (error) {
      logger.error('Error initializing voice recognition service', error);
      return false;
    }
  }
  
  /**
   * Load speaker profiles from disk
   * @returns {Promise<void>}
   */
  async loadSpeakerProfiles() {
    try {
      const profilesPath = path.join(this.config.profilePath, 'profiles.json');
      
      if (fs.existsSync(profilesPath)) {
        const profilesData = await fs.promises.readFile(profilesPath, 'utf8');
        this.speakerProfiles = JSON.parse(profilesData);
        global.speakerProfiles = this.speakerProfiles;
        
        logger.info(`Loaded ${Object.keys(this.speakerProfiles).length} speaker profiles`);
      } else {
        logger.info('No speaker profiles found, creating new profiles file');
        this.speakerProfiles = {};
        global.speakerProfiles = this.speakerProfiles;
        
        await this.saveSpeakerProfiles();
      }
    } catch (error) {
      logger.error('Error loading speaker profiles', error);
      this.speakerProfiles = {};
      global.speakerProfiles = this.speakerProfiles;
    }
  }
  
  /**
   * Save speaker profiles to disk
   * @returns {Promise<void>}
   */
  async saveSpeakerProfiles() {
    try {
      const profilesPath = path.join(this.config.profilePath, 'profiles.json');
      
      await fs.promises.writeFile(
        profilesPath,
        JSON.stringify(this.speakerProfiles, null, 2),
        'utf8'
      );
      
      logger.info(`Saved ${Object.keys(this.speakerProfiles).length} speaker profiles`);
    } catch (error) {
      logger.error('Error saving speaker profiles', error);
    }
  }
  
  /**
   * Create speaker profile
   * @param {String} speakerId - Speaker ID
   * @param {String} name - Speaker name
   * @param {Object} metadata - Speaker metadata
   * @returns {Promise<Object>} Speaker profile
   */
  async createSpeakerProfile(speakerId, name, metadata = {}) {
    try {
      // Check if profile already exists
      if (this.speakerProfiles[speakerId]) {
        return {
          success: false,
          message: 'Speaker profile already exists',
          speakerId
        };
      }
      
      // Create profile
      const profile = {
        id: speakerId,
        name,
        metadata,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        enrollments: 0,
        embeddingPath: path.join(this.config.profilePath, `${speakerId}.embedding`)
      };
      
      // Save profile
      this.speakerProfiles[speakerId] = profile;
      global.speakerProfiles = this.speakerProfiles;
      
      await this.saveSpeakerProfiles();
      
      logger.info(`Created speaker profile: ${speakerId}`);
      
      return {
        success: true,
        message: 'Speaker profile created successfully',
        profile
      };
    } catch (error) {
      logger.error('Error creating speaker profile', error);
      
      return {
        success: false,
        message: 'Error creating speaker profile',
        error: error.message
      };
    }
  }
  
  /**
   * Delete speaker profile
   * @param {String} speakerId - Speaker ID
   * @returns {Promise<Object>} Result
   */
  async deleteSpeakerProfile(speakerId) {
    try {
      // Check if profile exists
      if (!this.speakerProfiles[speakerId]) {
        return {
          success: false,
          message: 'Speaker profile not found',
          speakerId
        };
      }
      
      const profile = this.speakerProfiles[speakerId];
      
      // Delete embedding file if exists
      if (profile.embeddingPath && fs.existsSync(profile.embeddingPath)) {
        await fs.promises.unlink(profile.embeddingPath);
      }
      
      // Delete profile
      delete this.speakerProfiles[speakerId];
      global.speakerProfiles = this.speakerProfiles;
      
      await this.saveSpeakerProfiles();
      
      logger.info(`Deleted speaker profile: ${speakerId}`);
      
      return {
        success: true,
        message: 'Speaker profile deleted successfully',
        speakerId
      };
    } catch (error) {
      logger.error('Error deleting speaker profile', error);
      
      return {
        success: false,
        message: 'Error deleting speaker profile',
        error: error.message
      };
    }
  }
  
  /**
   * Enroll speaker
   * @param {String} speakerId - Speaker ID
   * @param {Buffer} audioData - Audio data
   * @returns {Promise<Object>} Enrollment result
   */
  async enrollSpeaker(speakerId, audioData) {
    try {
      // Check if service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Check if profile exists
      if (!this.speakerProfiles[speakerId]) {
        return {
          success: false,
          message: 'Speaker profile not found',
          speakerId
        };
      }
      
      // Save audio to temporary file
      const tempAudioPath = path.join(this.config.tempPath, `${speakerId}_${Date.now()}.wav`);
      await fs.promises.writeFile(tempAudioPath, audioData);
      
      // Extract embedding using Python script (simulated for now)
      const embeddingResult = await this.extractEmbedding(tempAudioPath);
      
      if (!embeddingResult.success) {
        return embeddingResult;
      }
      
      // Update profile
      const profile = this.speakerProfiles[speakerId];
      profile.enrollments += 1;
      profile.updated = new Date().toISOString();
      
      // Save embedding
      await fs.promises.writeFile(profile.embeddingPath, JSON.stringify(embeddingResult.embedding));
      
      // Save profiles
      await this.saveSpeakerProfiles();
      
      // Clean up temporary file
      if (fs.existsSync(tempAudioPath)) {
        await fs.promises.unlink(tempAudioPath);
      }
      
      logger.info(`Enrolled speaker: ${speakerId}, enrollment #${profile.enrollments}`);
      
      return {
        success: true,
        message: 'Speaker enrolled successfully',
        speakerId,
        enrollments: profile.enrollments
      };
    } catch (error) {
      logger.error('Error enrolling speaker', error);
      
      return {
        success: false,
        message: 'Error enrolling speaker',
        error: error.message
      };
    }
  }
  
  /**
   * Identify speaker
   * @param {Buffer} audioData - Audio data
   * @returns {Promise<Object>} Identification result
   */
  async identifySpeaker(audioData) {
    try {
      // Check if service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Check if there are any profiles
      if (Object.keys(this.speakerProfiles).length === 0) {
        return {
          success: false,
          message: 'No speaker profiles available',
          speakers: []
        };
      }
      
      // Save audio to temporary file
      const tempAudioPath = path.join(this.config.tempPath, `identify_${Date.now()}.wav`);
      await fs.promises.writeFile(tempAudioPath, audioData);
      
      // Extract embedding using Python script (simulated for now)
      const embeddingResult = await this.extractEmbedding(tempAudioPath);
      
      if (!embeddingResult.success) {
        return embeddingResult;
      }
      
      // Compare with all profiles
      const results = await this.compareWithProfiles(embeddingResult.embedding);
      
      // Clean up temporary file
      if (fs.existsSync(tempAudioPath)) {
        await fs.promises.unlink(tempAudioPath);
      }
      
      // Sort by score (highest first)
      results.sort((a, b) => b.score - a.score);
      
      // Get best match
      const bestMatch = results.length > 0 ? results[0] : null;
      
      // Check if best match exceeds threshold
      const identified = bestMatch && bestMatch.score >= this.config.threshold;
      
      logger.info(`Speaker identification result: ${identified ? 'identified' : 'unknown'}`);
      
      return {
        success: true,
        identified,
        bestMatch: identified ? bestMatch : null,
        speakers: results
      };
    } catch (error) {
      logger.error('Error identifying speaker', error);
      
      return {
        success: false,
        message: 'Error identifying speaker',
        error: error.message
      };
    }
  }
  
  /**
   * Verify speaker
   * @param {String} speakerId - Speaker ID
   * @param {Buffer} audioData - Audio data
   * @returns {Promise<Object>} Verification result
   */
  async verifySpeaker(speakerId, audioData) {
    try {
      // Check if service is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Check if profile exists
      if (!this.speakerProfiles[speakerId]) {
        return {
          success: false,
          message: 'Speaker profile not found',
          speakerId
        };
      }
      
      // Save audio to temporary file
      const tempAudioPath = path.join(this.config.tempPath, `verify_${speakerId}_${Date.now()}.wav`);
      await fs.promises.writeFile(tempAudioPath, audioData);
      
      // Extract embedding using Python script (simulated for now)
      const embeddingResult = await this.extractEmbedding(tempAudioPath);
      
      if (!embeddingResult.success) {
        return embeddingResult;
      }
      
      // Get profile
      const profile = this.speakerProfiles[speakerId];
      
      // Load profile embedding
      let profileEmbedding;
      try {
        const embeddingData = await fs.promises.readFile(profile.embeddingPath, 'utf8');
        profileEmbedding = JSON.parse(embeddingData);
      } catch (error) {
        logger.error(`Error loading profile embedding for ${speakerId}`, error);
        
        return {
          success: false,
          message: 'Error loading profile embedding',
          error: error.message
        };
      }
      
      // Compare embeddings
      const score = this.compareEmbeddings(embeddingResult.embedding, profileEmbedding);
      
      // Check if score exceeds threshold
      const verified = score >= this.config.threshold;
      
      // Clean up temporary file
      if (fs.existsSync(tempAudioPath)) {
        await fs.promises.unlink(tempAudioPath);
      }
      
      logger.info(`Speaker verification result for ${speakerId}: ${verified ? 'verified' : 'rejected'} (score: ${score})`);
      
      return {
        success: true,
        verified,
        score,
        speakerId,
        name: profile.name
      };
    } catch (error) {
      logger.error('Error verifying speaker', error);
      
      return {
        success: false,
        message: 'Error verifying speaker',
        error: error.message
      };
    }
  }
  
  /**
   * Extract embedding from audio
   * @param {String} audioPath - Path to audio file
   * @returns {Promise<Object>} Extraction result
   */
  async extractEmbedding(audioPath) {
    try {
      // In a real implementation, this would use a Python script to extract the embedding
      // For now, we'll simulate it
      
      logger.info(`Extracting embedding from ${audioPath}`);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a random embedding (in a real implementation, this would be the output of the model)
      const embedding = Array.from({ length: 192 }, () => Math.random() * 2 - 1);
      
      return {
        success: true,
        embedding
      };
    } catch (error) {
      logger.error('Error extracting embedding', error);
      
      return {
        success: false,
        message: 'Error extracting embedding',
        error: error.message
      };
    }
  }
  
  /**
   * Compare embeddings
   * @param {Array} embedding1 - First embedding
   * @param {Array} embedding2 - Second embedding
   * @returns {Number} Similarity score (0-1)
   */
  compareEmbeddings(embedding1, embedding2) {
    try {
      // Compute cosine similarity
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;
      
      for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
      }
      
      norm1 = Math.sqrt(norm1);
      norm2 = Math.sqrt(norm2);
      
      const similarity = dotProduct / (norm1 * norm2);
      
      // Convert to a score between 0 and 1
      return (similarity + 1) / 2;
    } catch (error) {
      logger.error('Error comparing embeddings', error);
      return 0;
    }
  }
  
  /**
   * Compare with all profiles
   * @param {Array} embedding - Embedding to compare
   * @returns {Promise<Array>} Comparison results
   */
  async compareWithProfiles(embedding) {
    try {
      const results = [];
      
      for (const speakerId in this.speakerProfiles) {
        const profile = this.speakerProfiles[speakerId];
        
        // Load profile embedding
        let profileEmbedding;
        try {
          const embeddingData = await fs.promises.readFile(profile.embeddingPath, 'utf8');
          profileEmbedding = JSON.parse(embeddingData);
        } catch (error) {
          logger.error(`Error loading profile embedding for ${speakerId}`, error);
          continue;
        }
        
        // Compare embeddings
        const score = this.compareEmbeddings(embedding, profileEmbedding);
        
        results.push({
          speakerId,
          name: profile.name,
          score
        });
      }
      
      return results;
    } catch (error) {
      logger.error('Error comparing with profiles', error);
      return [];
    }
  }
  
  /**
   * Get speaker profiles
   * @returns {Object} Speaker profiles
   */
  getSpeakerProfiles() {
    return Object.values(this.speakerProfiles).map(profile => ({
      id: profile.id,
      name: profile.name,
      metadata: profile.metadata,
      created: profile.created,
      updated: profile.updated,
      enrollments: profile.enrollments
    }));
  }
}

module.exports = new VoiceRecognitionService();
