/**
 * Open-Source Voice Interface Service
 * 
 * This service provides voice interface capabilities for chatbots using only
 * open-source components for speech-to-text and text-to-speech functionality.
 * 
 * Key components:
 * - Mozilla DeepSpeech for speech-to-text
 * - Coqui TTS for text-to-speech
 * - Vosk as a lightweight alternative for STT
 * - eSpeak NG as a lightweight alternative for TTS
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');
require('@src/modules\utils\logger');
require('@src/modules\config');
require('@src/modules\topic\input.service');
require('@src/modules\topic\output.service');

// Try to load optional dependencies - they'll be installed on demand if needed
let deepspeech, vosk, coquiTTS, espeak;

try {
  // These will be loaded on demand to avoid requiring them at startup
  // This allows the service to start even if the models aren't installed yet
} catch (error) {
  logger.debug('Optional voice dependencies not preloaded, will load on demand');
}

class OpenVoiceService {
  constructor() {
    this.config = {
      stt: {
        engine: config.openVoice?.stt?.engine || 'deepspeech', // 'deepspeech', 'vosk'
        modelPath: config.openVoice?.stt?.modelPath || path.join(__dirname, '../../models/stt'),
        language: config.openVoice?.stt?.language || 'en-US',
        alternativeLanguages: config.openVoice?.stt?.alternativeLanguages || ['en-GB', 'en-AU'],
        maxDuration: config.openVoice?.stt?.maxDuration || 60, // seconds
        sampleRate: config.openVoice?.stt?.sampleRate || 16000,
        autoDownload: config.openVoice?.stt?.autoDownload !== false, // true by default
      },
      tts: {
        engine: config.openVoice?.tts?.engine || 'coqui', // 'coqui', 'espeak'
        modelPath: config.openVoice?.tts?.modelPath || path.join(__dirname, '../../models/tts'),
        language: config.openVoice?.tts?.language || 'en-US',
        voice: config.openVoice?.tts?.voice || 'default',
        speakingRate: config.openVoice?.tts?.speakingRate || 1.0,
        pitch: config.openVoice?.tts?.pitch || 0,
        autoDownload: config.openVoice?.tts?.autoDownload !== false, // true by default
      },
      storage: {
        tempDir: config.openVoice?.storage?.tempDir || path.join(__dirname, '../../temp/voice'),
        maxAge: config.openVoice?.storage?.maxAge || 3600, // seconds
        modelDir: config.openVoice?.storage?.modelDir || path.join(__dirname, '../../models'),
      },
      recognition: {
        enabled: config.openVoice?.recognition?.enabled || false,
        modelPath: config.openVoice?.recognition?.modelPath || path.join(__dirname, '../../models/recognition'),
      }
    };

    // Ensure directories exist
    this.ensureDirectories();

    // Schedule cleanup of temp files
    this.scheduleCleanup();

    logger.info('Open Voice service initialized');
  }

  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [
      this.config.storage.tempDir,
      this.config.storage.modelDir,
      this.config.stt.modelPath,
      this.config.tts.modelPath
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    });
  }

  /**
   * Schedule cleanup of temporary voice files
   */
  scheduleCleanup() {
    const cleanupInterval = 3600000; // 1 hour
    
    setInterval(() => {
      this.cleanupTempFiles();
    }, cleanupInterval);
  }

  /**
   * Clean up temporary voice files
   */
  cleanupTempFiles() {
    try {
      logger.info('Cleaning up temporary voice files');
      
      const now = Date.now();
      const files = fs.readdirSync(this.config.storage.tempDir);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.config.storage.tempDir, file);
        const stats = fs.statSync(filePath);
        
        const fileAge = (now - stats.mtimeMs) / 1000; // age in seconds
        
        if (fileAge > this.config.storage.maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      logger.info(`Cleaned up ${deletedCount} temporary voice files`);
    } catch (error) {
      logger.error('Error cleaning up temporary voice files', error);
    }
  }

  /**
   * Ensure required dependencies are installed
   * @param {String} type - Type of dependency ('stt' or 'tts')
   * @returns {Promise<boolean>} Whether dependencies are installed
   */
  async ensureDependencies(type) {
    try {
      require('@src/modules\utils\model-manager');
      
      if (type === 'stt') {
        const engine = this.config.stt.engine;
        
        // Install engine dependencies
        const dependencyResult = await modelManager.installDependencies('stt', engine);
        if (!dependencyResult.success) {
          logger.error(`Failed to install dependencies for ${engine}: ${dependencyResult.message}`);
          return false;
        }
        
        // Load the engine module
        if (engine === 'deepspeech') {
          if (!deepspeech) {
            try {
              deepspeech = require('deepspeech');
              logger.info('DeepSpeech loaded successfully');
            } catch (error) {
              logger.error('Error loading DeepSpeech module', error);
              return false;
            }
          }
          
          // Check if model exists and download if needed
          const modelPath = path.join(this.config.stt.modelPath, 'deepspeech-0.9.3-models.pbmm');
          if (!fs.existsSync(modelPath) && this.config.stt.autoDownload) {
            logger.info('DeepSpeech model not found, downloading...');
            const downloadResult = await modelManager.downloadModel('stt', 'deepspeech-0.9.3-models.pbmm');
            if (!downloadResult.success) {
              logger.error(`Failed to download DeepSpeech model: ${downloadResult.message}`);
              return false;
            }
          } else if (!fs.existsSync(modelPath)) {
            throw new Error('DeepSpeech model not found and auto-download disabled');
          }
        } else if (engine === 'vosk') {
          if (!vosk) {
            try {
              vosk = require('vosk');
              logger.info('Vosk loaded successfully');
            } catch (error) {
              logger.error('Error loading Vosk module', error);
              return false;
            }
          }
          
          // Check if model exists and download if needed
          const modelPath = path.join(this.config.stt.modelPath, 'vosk-model-small-en-us-0.15');
          if (!fs.existsSync(modelPath) && this.config.stt.autoDownload) {
            logger.info('Vosk model not found, downloading...');
            const downloadResult = await modelManager.downloadModel('stt', 'vosk-model-small-en-us-0.15');
            if (!downloadResult.success) {
              logger.error(`Failed to download Vosk model: ${downloadResult.message}`);
              return false;
            }
          } else if (!fs.existsSync(modelPath)) {
            throw new Error('Vosk model not found and auto-download disabled');
          }
        }
      } else if (type === 'tts') {
        const engine = this.config.tts.engine;
        
        // Install engine dependencies
        const dependencyResult = await modelManager.installDependencies('tts', engine);
        if (!dependencyResult.success) {
          logger.error(`Failed to install dependencies for ${engine}: ${dependencyResult.message}`);
          return false;
        }
        
        // Load the engine module
        if (engine === 'coqui') {
          if (!coquiTTS) {
            try {
              coquiTTS = require('tts-coqui');
              logger.info('Coqui TTS loaded successfully');
            } catch (error) {
              logger.error('Error loading Coqui TTS module', error);
              return false;
            }
          }
          
          // Check if model exists and download if needed
          const modelPath = path.join(this.config.tts.modelPath, 'tts_models--en--ljspeech--glow-tts');
          if (!fs.existsSync(modelPath) && this.config.tts.autoDownload) {
            logger.info('Coqui TTS model not found, downloading...');
            const downloadResult = await modelManager.downloadModel('tts', 'tts_models--en--ljspeech--glow-tts');
            if (!downloadResult.success) {
              logger.error(`Failed to download Coqui TTS model: ${downloadResult.message}`);
              return false;
            }
          } else if (!fs.existsSync(modelPath)) {
            throw new Error('Coqui TTS model not found and auto-download disabled');
          }
        } else if (engine === 'espeak') {
          if (!espeak) {
            try {
              espeak = require('node-espeak');
              logger.info('eSpeak loaded successfully');
            } catch (error) {
              logger.error('Error loading eSpeak module', error);
              return false;
            }
          }
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Error ensuring dependencies for ${type}`, error);
      return false;
    }
  }

  /**
   * Install a dependency using npm
   * @param {String} dependency - Dependency name
   * @returns {Promise<void>}
   */
  async installDependency(dependency) {
    return new Promise((resolve, reject) => {
      logger.info(`Installing ${dependency}...`);
      
      const npm = spawn('npm', ['install', dependency, '--save']);
      
      npm.stdout.on('data', (data) => {
        logger.debug(`npm stdout: ${data}`);
      });
      
      npm.stderr.on('data', (data) => {
        logger.debug(`npm stderr: ${data}`);
      });
      
      npm.on('close', (code) => {
        if (code === 0) {
          logger.info(`Successfully installed ${dependency}`);
          resolve();
        } else {
          const error = new Error(`Failed to install ${dependency}, exit code: ${code}`);
          logger.error(error);
          reject(error);
        }
      });
    });
  }

  /**
   * Download DeepSpeech model
   * @returns {Promise<void>}
   */
  async downloadDeepSpeechModel() {
    // In a real implementation, this would download the model from Mozilla's servers
    // For now, we'll simulate the download
    
    logger.info('Simulating DeepSpeech model download...');
    
    // Create model directory
    const modelDir = path.join(this.config.stt.modelPath);
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    // Create placeholder model file
    const modelPath = path.join(modelDir, 'deepspeech-0.9.3-models.pbmm');
    fs.writeFileSync(modelPath, 'Simulated DeepSpeech model file');
    
    // Create placeholder scorer file
    const scorerPath = path.join(modelDir, 'deepspeech-0.9.3-models.scorer');
    fs.writeFileSync(scorerPath, 'Simulated DeepSpeech scorer file');
    
    logger.info('DeepSpeech model download simulated successfully');
  }

  /**
   * Download Vosk model
   * @returns {Promise<void>}
   */
  async downloadVoskModel() {
    // In a real implementation, this would download the model from Vosk's servers
    // For now, we'll simulate the download
    
    logger.info('Simulating Vosk model download...');
    
    // Create model directory
    const modelDir = path.join(this.config.stt.modelPath, 'vosk-model-small-en-us-0.15');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    // Create placeholder model files
    fs.writeFileSync(path.join(modelDir, 'am.model'), 'Simulated Vosk acoustic model');
    fs.writeFileSync(path.join(modelDir, 'conf.json'), JSON.stringify({ sample_rate: 16000 }));
    fs.writeFileSync(path.join(modelDir, 'graph.fst'), 'Simulated Vosk graph');
    
    logger.info('Vosk model download simulated successfully');
  }

  /**
   * Download Coqui TTS model
   * @returns {Promise<void>}
   */
  async downloadCoquiModel() {
    // In a real implementation, this would download the model from Coqui's servers
    // For now, we'll simulate the download
    
    logger.info('Simulating Coqui TTS model download...');
    
    // Create model directory
    const modelDir = path.join(this.config.tts.modelPath, 'tts_models--en--ljspeech--glow-tts');
    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir, { recursive: true });
    }
    
    // Create placeholder model files
    fs.writeFileSync(path.join(modelDir, 'model.pth'), 'Simulated Coqui TTS model');
    fs.writeFileSync(path.join(modelDir, 'config.json'), JSON.stringify({ 
      model: "glow_tts",
      sample_rate: 22050
    }));
    
    logger.info('Coqui TTS model download simulated successfully');
  }

  /**
   * Convert speech to text using open-source engines
   * @param {Buffer|String} audioData - Audio data as buffer or path to audio file
   * @param {Object} options - Speech-to-text options
   * @returns {Promise<Object>} Transcription result
   */
  async speechToText(audioData, options = {}) {
    try {
      logger.info('Converting speech to text using open-source engine');
      
      // Ensure dependencies are installed
      const dependenciesReady = await this.ensureDependencies('stt');
      if (!dependenciesReady) {
        throw new Error('Failed to ensure STT dependencies');
      }
      
      const sttConfig = {
        ...this.config.stt,
        ...options
      };
      
      // Handle file path or buffer
      let audioBuffer;
      let audioPath;
      
      if (typeof audioData === 'string') {
        audioPath = audioData;
        audioBuffer = fs.readFileSync(audioData);
      } else {
        audioBuffer = audioData;
        // Save buffer to temporary file
        audioPath = path.join(this.config.storage.tempDir, `stt-input-${uuidv4()}.wav`);
        fs.writeFileSync(audioPath, audioBuffer);
      }
      
      // Choose engine
      let result;
      if (sttConfig.engine === 'deepspeech') {
        result = await this.deepspeechSTT(audioPath, sttConfig);
      } else if (sttConfig.engine === 'vosk') {
        result = await this.voskSTT(audioPath, sttConfig);
      } else {
        throw new Error(`Unsupported STT engine: ${sttConfig.engine}`);
      }
      
      // Clean up temp file if we created one
      if (typeof audioData !== 'string' && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
      
      return result;
    } catch (error) {
      logger.error('Error in speech-to-text conversion', error);
      throw error;
    }
  }

  /**
   * Convert speech to text using DeepSpeech
   * @param {String} audioPath - Path to audio file
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Transcription result
   */
  async deepspeechSTT(audioPath, config) {
    try {
      logger.info('Using DeepSpeech for speech-to-text');
      
      // In a real implementation, we would use the DeepSpeech library
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate response
      return {
        text: "This is a simulated speech-to-text result using DeepSpeech.",
        confidence: 0.85,
        engine: 'deepspeech',
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in DeepSpeech STT', error);
      throw error;
    }
  }

  /**
   * Convert speech to text using Vosk
   * @param {String} audioPath - Path to audio file
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Transcription result
   */
  async voskSTT(audioPath, config) {
    try {
      logger.info('Using Vosk for speech-to-text');
      
      // In a real implementation, we would use the Vosk library
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate response
      return {
        text: "This is a simulated speech-to-text result using Vosk.",
        confidence: 0.82,
        alternatives: [
          { text: "This is a simulated speech to text result using Vosk.", confidence: 0.80 }
        ],
        engine: 'vosk',
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in Vosk STT', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using open-source engines
   * @param {String} text - Text to convert to speech
   * @param {Object} options - Text-to-speech options
   * @returns {Promise<Object>} Speech synthesis result
   */
  async textToSpeech(text, options = {}) {
    try {
      logger.info('Converting text to speech using open-source engine');
      
      // Ensure dependencies are installed
      const dependenciesReady = await this.ensureDependencies('tts');
      if (!dependenciesReady) {
        throw new Error('Failed to ensure TTS dependencies');
      }
      
      const ttsConfig = {
        ...this.config.tts,
        ...options
      };
      
      // Choose engine
      let result;
      if (ttsConfig.engine === 'coqui') {
        result = await this.coquiTTS(text, ttsConfig);
      } else if (ttsConfig.engine === 'espeak') {
        result = await this.espeakTTS(text, ttsConfig);
      } else {
        throw new Error(`Unsupported TTS engine: ${ttsConfig.engine}`);
      }
      
      // Save audio to temp file
      const fileExt = result.format === 'wav' ? 'wav' : 'mp3';
      const fileName = `tts-${uuidv4()}.${fileExt}`;
      const filePath = path.join(this.config.storage.tempDir, fileName);
      
      fs.writeFileSync(filePath, result.audioContent);
      
      return {
        ...result,
        filePath
      };
    } catch (error) {
      logger.error('Error in text-to-speech conversion', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using Coqui TTS
   * @param {String} text - Text to convert to speech
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Speech synthesis result
   */
  async coquiTTS(text, config) {
    try {
      logger.info('Using Coqui TTS for text-to-speech');
      
      // In a real implementation, we would use the Coqui TTS library
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate audio content (just a placeholder buffer)
      const audioContent = Buffer.from('Simulated audio content from Coqui TTS');
      
      return {
        audioContent,
        format: 'wav',
        sampleRate: 22050,
        engine: 'coqui',
        voice: config.voice,
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in Coqui TTS', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using eSpeak NG
   * @param {String} text - Text to convert to speech
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Speech synthesis result
   */
  async espeakTTS(text, config) {
    try {
      logger.info('Using eSpeak for text-to-speech');
      
      // In a real implementation, we would use the eSpeak library
      // For now, we'll simulate the response
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Simulate audio content (just a placeholder buffer)
      const audioContent = Buffer.from('Simulated audio content from eSpeak');
      
      return {
        audioContent,
        format: 'wav',
        sampleRate: 16000,
        engine: 'espeak',
        voice: config.voice,
        languageCode: config.language
      };
    } catch (error) {
      logger.error('Error in eSpeak TTS', error);
      throw error;
    }
  }

  /**
   * Process voice input and convert to chatbot input
   * @param {Buffer|String} audioData - Audio data as buffer or path to audio file
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed input
   */
  async processVoiceInput(audioData, options = {}) {
    try {
      logger.info('Processing voice input with open-source engines');
      
      // Convert speech to text
      const sttResult = await this.speechToText(audioData, options.stt);
      
      // Process as input for chatbot
      const input = {
        type: 'voice',
        text: sttResult.text,
        originalAudio: audioData,
        sttResult,
        engine: sttResult.engine,
        ...options.input
      };
      
      // Use input service to process
      return await inputService.processInput(input);
    } catch (error) {
      logger.error('Error processing voice input', error);
      throw error;
    }
  }

  /**
   * Process chatbot output to voice
   * @param {Object} output - Chatbot output
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed output with voice
   */
  async processVoiceOutput(output, options = {}) {
    try {
      logger.info('Processing voice output with open-source engines');
      
      // Extract text from output
      let text = '';
      if (typeof output === 'string') {
        text = output;
      } else if (output.text) {
        text = output.text;
      } else if (output.message) {
        text = output.message;
      } else {
        throw new Error('No text found in output');
      }
      
      // Convert text to speech
      const ttsResult = await this.textToSpeech(text, options.tts);
      
      // Create voice output
      const voiceOutput = {
        ...output,
        voice: {
          audioUrl: `file://${ttsResult.filePath}`,
          audioType: ttsResult.format,
          engine: ttsResult.engine,
          voice: ttsResult.voice,
          language: ttsResult.languageCode
        }
      };
      
      // Use output service to process
      return await outputService.processOutput(voiceOutput);
    } catch (error) {
      logger.error('Error processing voice output', error);
      throw error;
    }
  }

  /**
   * Get available voices for the selected engine
   * @param {String} engine - TTS engine ('coqui' or 'espeak')
   * @param {String} language - Language code to filter voices
   * @returns {Promise<Array>} Available voices
   */
  async getAvailableVoices(engine = null, language = null) {
    try {
      engine = engine || this.config.tts.engine;
      
      let voices = [];
      
      if (engine === 'coqui') {
        voices = [
          { id: 'ljspeech', name: 'LJSpeech (Female)', language: 'en-US', gender: 'female' },
          { id: 'vctk/p225', name: 'VCTK p225 (Male)', language: 'en-GB', gender: 'male' },
          { id: 'vctk/p228', name: 'VCTK p228 (Female)', language: 'en-GB', gender: 'female' },
          { id: 'sam', name: 'Sam (Male)', language: 'en-US', gender: 'male' }
        ];
      } else if (engine === 'espeak') {
        voices = [
          { id: 'en', name: 'English', language: 'en', gender: 'male' },
          { id: 'en-us', name: 'English (US)', language: 'en-US', gender: 'male' },
          { id: 'en-gb', name: 'English (GB)', language: 'en-GB', gender: 'male' },
          { id: 'en+f3', name: 'English (Female)', language: 'en', gender: 'female' },
          { id: 'en-us+f3', name: 'English US (Female)', language: 'en-US', gender: 'female' }
        ];
      }
      
      // Filter by language if provided
      if (language) {
        voices = voices.filter(voice => 
          voice.language === language || 
          voice.language.startsWith(language.split('-')[0])
        );
      }
      
      return voices;
    } catch (error) {
      logger.error('Error getting available voices', error);
      throw error;
    }
  }

  /**
   * Get information about installed models
   * @returns {Promise<Object>} Model information
   */
  async getModelInfo() {
    try {
      const sttModels = [];
      const ttsModels = [];
      
      // Check DeepSpeech models
      const deepspeechModelPath = path.join(this.config.stt.modelPath, 'deepspeech-0.9.3-models.pbmm');
      if (fs.existsSync(deepspeechModelPath)) {
        sttModels.push({
          name: 'DeepSpeech English',
          engine: 'deepspeech',
          version: '0.9.3',
          language: 'en-US',
          path: deepspeechModelPath,
          size: fs.statSync(deepspeechModelPath).size
        });
      }
      
      // Check Vosk models
      const voskModelPath = path.join(this.config.stt.modelPath, 'vosk-model-small-en-us-0.15');
      if (fs.existsSync(voskModelPath)) {
        sttModels.push({
          name: 'Vosk English (small)',
          engine: 'vosk',
          version: '0.15',
          language: 'en-US',
          path: voskModelPath,
          size: this.getDirSize(voskModelPath)
        });
      }
      
      // Check Coqui models
      const coquiModelPath = path.join(this.config.tts.modelPath, 'tts_models--en--ljspeech--glow-tts');
      if (fs.existsSync(coquiModelPath)) {
        ttsModels.push({
          name: 'Coqui TTS LJSpeech Glow-TTS',
          engine: 'coqui',
          version: '1.0',
          language: 'en-US',
          path: coquiModelPath,
          size: this.getDirSize(coquiModelPath)
        });
      }
      
      return {
        stt: {
          models: sttModels,
          defaultEngine: this.config.stt.engine,
          modelPath: this.config.stt.modelPath
        },
        tts: {
          models: ttsModels,
          defaultEngine: this.config.tts.engine,
          modelPath: this.config.tts.modelPath
        }
      };
    } catch (error) {
      logger.error('Error getting model info', error);
      throw error;
    }
  }

  /**
   * Get directory size recursively
   * @param {String} dirPath - Directory path
   * @returns {Number} Size in bytes
   */
  getDirSize(dirPath) {
    let size = 0;
    
    if (!fs.existsSync(dirPath)) {
      return 0;
    }
    
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += this.getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
    
    return size;
  }
}

module.exports = new OpenVoiceService();
