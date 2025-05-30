/**
 * Audio Processor
 * 
 * Provides utilities for processing audio data to improve
 * speech recognition quality using open-source components.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Readable, Transform } = require('stream');
const logger = require('./logger');
const config = require('../config/open-voice.config');

// Try to load audio processing libraries
let ffmpeg;
let sox;
let wavefile;

class AudioProcessor {
  constructor() {
    this.config = config.audio || {};
    this.initialized = false;
    
    // Default audio settings
    this.defaultSettings = {
      sampleRate: 16000,
      channels: 1,
      format: 'wav',
      bitDepth: 16,
      normalize: true,
      removeSilence: true,
      noiseReduction: true,
      gainDb: 0
    };
  }
  
  /**
   * Initialize audio processor
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }
      
      logger.info('Initializing audio processor');
      
      // Ensure temp directory exists
      const tempDir = path.join(process.cwd(), 'temp', 'audio');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Load wavefile for WAV manipulation
      try {
        wavefile = require('wavefile');
        logger.info('Wavefile loaded successfully');
      } catch (error) {
        logger.warn('Wavefile not installed, attempting to install...');
        await this.installDependency('wavefile');
        wavefile = require('wavefile');
      }
      
      // Check if ffmpeg is installed
      try {
        await this.execCommand('ffmpeg -version');
        ffmpeg = true;
        logger.info('FFmpeg detected');
      } catch (error) {
        logger.warn('FFmpeg not found, some audio processing features will be limited');
        ffmpeg = false;
      }
      
      // Check if SoX is installed
      try {
        await this.execCommand('sox --version');
        sox = true;
        logger.info('SoX detected');
      } catch (error) {
        logger.warn('SoX not found, some audio processing features will be limited');
        sox = false;
      }
      
      this.initialized = true;
      logger.info('Audio processor initialized successfully');
      
      return true;
    } catch (error) {
      logger.error('Error initializing audio processor', error);
      return false;
    }
  }
  
  /**
   * Install dependency
   * @param {String} packageName - Package name
   * @returns {Promise<boolean>} Whether installation was successful
   */
  async installDependency(packageName) {
    return new Promise((resolve, reject) => {
      logger.info(`Installing ${packageName}...`);
      
      const npm = spawn('npm', ['install', packageName, '--save']);
      
      npm.stdout.on('data', data => {
        logger.debug(`npm stdout: ${data}`);
      });
      
      npm.stderr.on('data', data => {
        logger.debug(`npm stderr: ${data}`);
      });
      
      npm.on('close', code => {
        if (code === 0) {
          logger.info(`Successfully installed ${packageName}`);
          resolve(true);
        } else {
          logger.error(`Failed to install ${packageName}, exit code: ${code}`);
          reject(new Error(`Failed to install ${packageName}`));
        }
      });
    });
  }
  
  /**
   * Execute command
   * @param {String} command - Command to execute
   * @returns {Promise<String>} Command output
   */
  async execCommand(command) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = command.split(' ');
      const proc = spawn(cmd, args);
      
      let stdout = '';
      let stderr = '';
      
      proc.stdout.on('data', data => {
        stdout += data.toString();
      });
      
      proc.stderr.on('data', data => {
        stderr += data.toString();
      });
      
      proc.on('close', code => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
    });
  }
  
  /**
   * Process audio file
   * @param {String|Buffer} input - Input audio file path or buffer
   * @param {Object} options - Processing options
   * @returns {Promise<Buffer>} Processed audio buffer
   */
  async processAudio(input, options = {}) {
    try {
      // Initialize if not already initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Merge options with defaults
      const settings = { ...this.defaultSettings, ...options };
      
      // Create temporary files
      const inputPath = typeof input === 'string' ? input : path.join(process.cwd(), 'temp', 'audio', `input_${Date.now()}.wav`);
      const outputPath = path.join(process.cwd(), 'temp', 'audio', `output_${Date.now()}.wav`);
      
      // If input is a buffer, write to temporary file
      if (Buffer.isBuffer(input)) {
        await fs.promises.writeFile(inputPath, input);
      }
      
      // Process audio based on available tools
      if (ffmpeg && sox) {
        // Use both ffmpeg and sox for best quality
        await this.processWithFfmpegAndSox(inputPath, outputPath, settings);
      } else if (ffmpeg) {
        // Use ffmpeg only
        await this.processWithFfmpeg(inputPath, outputPath, settings);
      } else if (sox) {
        // Use sox only
        await this.processWithSox(inputPath, outputPath, settings);
      } else {
        // Use wavefile for basic processing
        await this.processWithWavefile(inputPath, outputPath, settings);
      }
      
      // Read processed audio
      const processedAudio = await fs.promises.readFile(outputPath);
      
      // Clean up temporary files
      if (typeof input !== 'string') {
        await fs.promises.unlink(inputPath);
      }
      await fs.promises.unlink(outputPath);
      
      return processedAudio;
    } catch (error) {
      logger.error('Error processing audio', error);
      throw error;
    }
  }
  
  /**
   * Process audio with FFmpeg and SoX
   * @param {String} inputPath - Input audio file path
   * @param {String} outputPath - Output audio file path
   * @param {Object} settings - Processing settings
   * @returns {Promise<void>}
   */
  async processWithFfmpegAndSox(inputPath, outputPath, settings) {
    try {
      // First convert to WAV with ffmpeg
      const tempPath = outputPath.replace('.wav', '_temp.wav');
      
      // Convert to WAV with ffmpeg
      await this.execCommand(`ffmpeg -i "${inputPath}" -ar ${settings.sampleRate} -ac ${settings.channels} -sample_fmt s16 -y "${tempPath}"`);
      
      // Process with SoX
      let soxCommand = `sox "${tempPath}" "${outputPath}"`;
      
      // Apply noise reduction if enabled
      if (settings.noiseReduction) {
        soxCommand += ' noisered';
      }
      
      // Apply normalization if enabled
      if (settings.normalize) {
        soxCommand += ' norm';
      }
      
      // Apply gain if specified
      if (settings.gainDb !== 0) {
        soxCommand += ` gain ${settings.gainDb}`;
      }
      
      // Remove silence if enabled
      if (settings.removeSilence) {
        soxCommand += ' silence 1 0.1 1% -1 0.1 1%';
      }
      
      // Execute SoX command
      await this.execCommand(soxCommand);
      
      // Clean up temporary file
      await fs.promises.unlink(tempPath);
    } catch (error) {
      logger.error('Error processing audio with FFmpeg and SoX', error);
      throw error;
    }
  }
  
  /**
   * Process audio with FFmpeg
   * @param {String} inputPath - Input audio file path
   * @param {String} outputPath - Output audio file path
   * @param {Object} settings - Processing settings
   * @returns {Promise<void>}
   */
  async processWithFfmpeg(inputPath, outputPath, settings) {
    try {
      let ffmpegCommand = `ffmpeg -i "${inputPath}"`;
      
      // Set sample rate
      ffmpegCommand += ` -ar ${settings.sampleRate}`;
      
      // Set channels
      ffmpegCommand += ` -ac ${settings.channels}`;
      
      // Set audio format
      ffmpegCommand += ' -sample_fmt s16';
      
      // Apply filters
      let filters = [];
      
      // Apply noise reduction if enabled
      if (settings.noiseReduction) {
        filters.push('afftdn=nf=-25');
      }
      
      // Apply normalization if enabled
      if (settings.normalize) {
        filters.push('dynaudnorm=p=0.95');
      }
      
      // Apply gain if specified
      if (settings.gainDb !== 0) {
        filters.push(`volume=${settings.gainDb}dB`);
      }
      
      // Remove silence if enabled
      if (settings.removeSilence) {
        filters.push('silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.1:detection=peak');
      }
      
      // Add filters to command
      if (filters.length > 0) {
        ffmpegCommand += ` -af "${filters.join(',')}"`;
      }
      
      // Set output file
      ffmpegCommand += ` -y "${outputPath}"`;
      
      // Execute FFmpeg command
      await this.execCommand(ffmpegCommand);
    } catch (error) {
      logger.error('Error processing audio with FFmpeg', error);
      throw error;
    }
  }
  
  /**
   * Process audio with SoX
   * @param {String} inputPath - Input audio file path
   * @param {String} outputPath - Output audio file path
   * @param {Object} settings - Processing settings
   * @returns {Promise<void>}
   */
  async processWithSox(inputPath, outputPath, settings) {
    try {
      let soxCommand = `sox "${inputPath}" -r ${settings.sampleRate} -c ${settings.channels} -b ${settings.bitDepth} "${outputPath}"`;
      
      // Apply noise reduction if enabled
      if (settings.noiseReduction) {
        soxCommand += ' noisered';
      }
      
      // Apply normalization if enabled
      if (settings.normalize) {
        soxCommand += ' norm';
      }
      
      // Apply gain if specified
      if (settings.gainDb !== 0) {
        soxCommand += ` gain ${settings.gainDb}`;
      }
      
      // Remove silence if enabled
      if (settings.removeSilence) {
        soxCommand += ' silence 1 0.1 1% -1 0.1 1%';
      }
      
      // Execute SoX command
      await this.execCommand(soxCommand);
    } catch (error) {
      logger.error('Error processing audio with SoX', error);
      throw error;
    }
  }
  
  /**
   * Process audio with wavefile
   * @param {String} inputPath - Input audio file path
   * @param {String} outputPath - Output audio file path
   * @param {Object} settings - Processing settings
   * @returns {Promise<void>}
   */
  async processWithWavefile(inputPath, outputPath, settings) {
    try {
      // Read input file
      const inputData = await fs.promises.readFile(inputPath);
      
      // Create WAV instance
      const wav = new wavefile.WaveFile(inputData);
      
      // Convert to PCM format
      if (wav.fmt.audioFormat !== 1) {
        wav.fromScratch(
          settings.channels,
          settings.sampleRate,
          settings.bitDepth,
          wav.getSamples()
        );
      }
      
      // Resample if needed
      if (wav.fmt.sampleRate !== settings.sampleRate) {
        // Basic resampling (not as good as ffmpeg/sox)
        wav.toSampleRate(settings.sampleRate);
      }
      
      // Convert to mono if needed
      if (wav.fmt.numChannels !== settings.channels && settings.channels === 1) {
        wav.toMono();
      }
      
      // Apply normalization if enabled
      if (settings.normalize) {
        this.normalizeWav(wav);
      }
      
      // Write output file
      await fs.promises.writeFile(outputPath, wav.toBuffer());
    } catch (error) {
      logger.error('Error processing audio with wavefile', error);
      throw error;
    }
  }
  
  /**
   * Normalize WAV data
   * @param {Object} wav - WaveFile instance
   */
  normalizeWav(wav) {
    try {
      // Get samples
      const samples = wav.getSamples();
      
      if (!samples || !samples.length) {
        return;
      }
      
      // Find maximum amplitude
      let maxAmplitude = 0;
      for (let i = 0; i < samples.length; i++) {
        const abs = Math.abs(samples[i]);
        if (abs > maxAmplitude) {
          maxAmplitude = abs;
        }
      }
      
      // Calculate normalization factor
      const maxPossibleAmplitude = Math.pow(2, wav.fmt.bitsPerSample - 1) - 1;
      const normalizationFactor = maxPossibleAmplitude / maxAmplitude;
      
      // Apply normalization
      for (let i = 0; i < samples.length; i++) {
        samples[i] = Math.round(samples[i] * normalizationFactor);
      }
    } catch (error) {
      logger.error('Error normalizing WAV data', error);
    }
  }
  
  /**
   * Convert audio format
   * @param {String|Buffer} input - Input audio file path or buffer
   * @param {String} outputFormat - Output format (wav, mp3, ogg, etc.)
   * @param {Object} options - Conversion options
   * @returns {Promise<Buffer>} Converted audio buffer
   */
  async convertFormat(input, outputFormat, options = {}) {
    try {
      // Initialize if not already initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      if (!ffmpeg) {
        throw new Error('FFmpeg is required for format conversion');
      }
      
      // Create temporary files
      const inputPath = typeof input === 'string' ? input : path.join(process.cwd(), 'temp', 'audio', `input_${Date.now()}.tmp`);
      const outputPath = path.join(process.cwd(), 'temp', 'audio', `output_${Date.now()}.${outputFormat}`);
      
      // If input is a buffer, write to temporary file
      if (Buffer.isBuffer(input)) {
        await fs.promises.writeFile(inputPath, input);
      }
      
      // Convert format with ffmpeg
      let ffmpegCommand = `ffmpeg -i "${inputPath}"`;
      
      // Add options
      if (options.sampleRate) {
        ffmpegCommand += ` -ar ${options.sampleRate}`;
      }
      
      if (options.channels) {
        ffmpegCommand += ` -ac ${options.channels}`;
      }
      
      if (options.bitrate) {
        ffmpegCommand += ` -b:a ${options.bitrate}k`;
      }
      
      // Set output file
      ffmpegCommand += ` -y "${outputPath}"`;
      
      // Execute FFmpeg command
      await this.execCommand(ffmpegCommand);
      
      // Read converted audio
      const convertedAudio = await fs.promises.readFile(outputPath);
      
      // Clean up temporary files
      if (typeof input !== 'string') {
        await fs.promises.unlink(inputPath);
      }
      await fs.promises.unlink(outputPath);
      
      return convertedAudio;
    } catch (error) {
      logger.error('Error converting audio format', error);
      throw error;
    }
  }
  
  /**
   * Get audio information
   * @param {String|Buffer} input - Input audio file path or buffer
   * @returns {Promise<Object>} Audio information
   */
  async getAudioInfo(input) {
    try {
      // Initialize if not already initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Create temporary file if input is a buffer
      const inputPath = typeof input === 'string' ? input : path.join(process.cwd(), 'temp', 'audio', `input_${Date.now()}.tmp`);
      
      // If input is a buffer, write to temporary file
      if (Buffer.isBuffer(input)) {
        await fs.promises.writeFile(inputPath, input);
      }
      
      let info = {};
      
      if (ffmpeg) {
        // Get audio information with ffmpeg
        const output = await this.execCommand(`ffprobe -v quiet -print_format json -show_format -show_streams "${inputPath}"`);
        const ffprobeData = JSON.parse(output);
        
        const audioStream = ffprobeData.streams.find(stream => stream.codec_type === 'audio');
        
        if (audioStream) {
          info = {
            format: ffprobeData.format.format_name,
            duration: parseFloat(ffprobeData.format.duration),
            size: parseInt(ffprobeData.format.size),
            bitrate: parseInt(ffprobeData.format.bit_rate),
            codec: audioStream.codec_name,
            sampleRate: parseInt(audioStream.sample_rate),
            channels: audioStream.channels,
            channelLayout: audioStream.channel_layout
          };
        }
      } else if (inputPath.toLowerCase().endsWith('.wav')) {
        // Get WAV information with wavefile
        const inputData = await fs.promises.readFile(inputPath);
        const wav = new wavefile.WaveFile(inputData);
        
        info = {
          format: 'wav',
          duration: wav.chunkSize / wav.fmt.byteRate,
          size: wav.chunkSize,
          bitrate: wav.fmt.byteRate * 8,
          codec: wav.fmt.audioFormat === 1 ? 'pcm_s16le' : 'unknown',
          sampleRate: wav.fmt.sampleRate,
          channels: wav.fmt.numChannels,
          channelLayout: wav.fmt.numChannels === 1 ? 'mono' : 'stereo'
        };
      } else {
        throw new Error('Cannot get audio information without FFmpeg for non-WAV files');
      }
      
      // Clean up temporary file
      if (typeof input !== 'string') {
        await fs.promises.unlink(inputPath);
      }
      
      return info;
    } catch (error) {
      logger.error('Error getting audio information', error);
      throw error;
    }
  }
  
  /**
   * Detect voice activity
   * @param {String|Buffer} input - Input audio file path or buffer
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Voice activity detection result
   */
  async detectVoiceActivity(input, options = {}) {
    try {
      // Initialize if not already initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Default options
      const settings = {
        threshold: options.threshold || 0.01,
        frameDuration: options.frameDuration || 0.01,
        minSpeechDuration: options.minSpeechDuration || 0.1
      };
      
      // Create temporary file if input is a buffer
      const inputPath = typeof input === 'string' ? input : path.join(process.cwd(), 'temp', 'audio', `input_${Date.now()}.wav`);
      
      // If input is a buffer, write to temporary file
      if (Buffer.isBuffer(input)) {
        await fs.promises.writeFile(inputPath, input);
      }
      
      // Convert to WAV if not already
      let wavPath = inputPath;
      if (!inputPath.toLowerCase().endsWith('.wav')) {
        wavPath = path.join(process.cwd(), 'temp', 'audio', `input_${Date.now()}.wav`);
        await this.convertFormat(inputPath, 'wav', { sampleRate: 16000, channels: 1 });
      }
      
      // Read WAV file
      const wavData = await fs.promises.readFile(wavPath);
      const wav = new wavefile.WaveFile(wavData);
      
      // Get samples
      const samples = wav.getSamples();
      
      if (!samples || !samples.length) {
        return {
          hasSpeech: false,
          segments: []
        };
      }
      
      // Calculate frame size
      const frameSize = Math.floor(settings.frameDuration * wav.fmt.sampleRate);
      
      // Calculate energy for each frame
      const frameCount = Math.floor(samples.length / frameSize);
      const frameEnergies = [];
      
      for (let i = 0; i < frameCount; i++) {
        let energy = 0;
        const frameStart = i * frameSize;
        
        for (let j = 0; j < frameSize && frameStart + j < samples.length; j++) {
          energy += Math.pow(samples[frameStart + j] / 32768, 2);
        }
        
        energy /= frameSize;
        frameEnergies.push(energy);
      }
      
      // Find speech segments
      const segments = [];
      let inSpeech = false;
      let speechStart = 0;
      
      for (let i = 0; i < frameEnergies.length; i++) {
        if (frameEnergies[i] > settings.threshold) {
          if (!inSpeech) {
            inSpeech = true;
            speechStart = i * settings.frameDuration;
          }
        } else {
          if (inSpeech) {
            inSpeech = false;
            const speechEnd = i * settings.frameDuration;
            const speechDuration = speechEnd - speechStart;
            
            if (speechDuration >= settings.minSpeechDuration) {
              segments.push({
                start: speechStart,
                end: speechEnd,
                duration: speechDuration
              });
            }
          }
        }
      }
      
      // Handle case where speech continues until the end
      if (inSpeech) {
        const speechEnd = frameCount * settings.frameDuration;
        const speechDuration = speechEnd - speechStart;
        
        if (speechDuration >= settings.minSpeechDuration) {
          segments.push({
            start: speechStart,
            end: speechEnd,
            duration: speechDuration
          });
        }
      }
      
      // Clean up temporary files
      if (typeof input !== 'string') {
        await fs.promises.unlink(inputPath);
      }
      
      if (wavPath !== inputPath) {
        await fs.promises.unlink(wavPath);
      }
      
      return {
        hasSpeech: segments.length > 0,
        segments
      };
    } catch (error) {
      logger.error('Error detecting voice activity', error);
      throw error;
    }
  }
}

module.exports = new AudioProcessor();
