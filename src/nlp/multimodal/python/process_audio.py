#!/usr/bin/env python
"""
Audio Processing Script

This script provides audio processing capabilities using open-source libraries:
- SpeechRecognition for speech-to-text
- Librosa for audio analysis
- PyDub for audio manipulation

It serves as a bridge between the Node.js application and Python audio processing libraries.
"""

import sys
import json
import os
import argparse
import base64
from pathlib import Path
import traceback
import tempfile

# Check if required packages are installed, if not install them
try:
    import speech_recognition as sr
    import numpy as np
    import librosa
except ImportError:
    import subprocess
    import sys
    
    # Install required packages
    subprocess.check_call([sys.executable, "-m", "pip", "install", 
                          "SpeechRecognition", "numpy", "librosa", "soundfile"])
    
    # Import after installation
    import speech_recognition as sr
    import numpy as np
    import librosa

# Try to import optional packages
try:
    from pydub import AudioSegment
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("PyDub not available. Some features will be limited.", file=sys.stderr)

class AudioProcessor:
    """Audio processing using open-source libraries"""
    
    def __init__(self, model_path=None):
        """Initialize audio processor"""
        self.model_path = model_path or os.path.join(os.getcwd(), 'models')
        self.recognizer = sr.Recognizer()
        
        # Set default properties
        self.recognizer.energy_threshold = 300  # minimum audio energy to consider for recording
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.dynamic_energy_adjustment_damping = 0.15
        self.recognizer.dynamic_energy_ratio = 1.5
        self.recognizer.pause_threshold = 0.8  # seconds of non-speaking audio before a phrase is considered complete
        self.recognizer.operation_timeout = 10  # seconds after an internal operation (e.g., an API request) starts before it times out
    
    def process_audio(self, audio_path, options=None):
        """
        Process an audio file with various audio processing tasks
        
        Args:
            audio_path: Path to the audio file
            options: Processing options
            
        Returns:
            Dictionary with processing results
        """
        options = options or {}
        
        try:
            # Get audio info
            audio_info = self._get_audio_info(audio_path)
            
            result = {
                "success": True,
                "audioInfo": audio_info,
                "features": {}
            }
            
            # Perform speech-to-text if requested
            if options.get('speechToText', True):
                transcription = self._speech_to_text(audio_path, options)
                result["features"]["transcription"] = transcription
            
            # Analyze audio features if requested
            if options.get('analyzeAudio', False):
                audio_features = self._analyze_audio(audio_path)
                result["features"]["audioFeatures"] = audio_features
            
            return result
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
    
    def _get_audio_info(self, audio_path):
        """
        Get information about an audio file
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Dictionary with audio information
        """
        try:
            # Load audio file with librosa
            y, sr = librosa.load(audio_path, sr=None)
            duration = librosa.get_duration(y=y, sr=sr)
            
            return {
                "format": os.path.splitext(audio_path)[1][1:].lower(),
                "sampleRate": sr,
                "channels": 1 if y.ndim == 1 else y.shape[1],
                "duration": duration,
                "samples": len(y)
            }
        except Exception as e:
            print(f"Error getting audio info: {str(e)}", file=sys.stderr)
            
            # Fallback to basic file info
            file_size = os.path.getsize(audio_path)
            return {
                "format": os.path.splitext(audio_path)[1][1:].lower(),
                "fileSize": file_size,
                "error": str(e)
            }
    
    def _speech_to_text(self, audio_path, options):
        """
        Convert speech to text
        
        Args:
            audio_path: Path to the audio file
            options: Speech-to-text options
            
        Returns:
            Dictionary with transcription results
        """
        language = options.get('language', 'en-US')
        
        try:
            # Load audio file
            with sr.AudioFile(audio_path) as source:
                audio_data = self.recognizer.record(source)
            
            # Try to use DeepSpeech if available
            if os.path.exists(os.path.join(self.model_path, 'deepspeech-0.9.3-models.pbmm')):
                try:
                    from deepspeech import Model
                    
                    # Load DeepSpeech model
                    model_path = os.path.join(self.model_path, 'deepspeech-0.9.3-models.pbmm')
                    scorer_path = os.path.join(self.model_path, 'deepspeech-0.9.3-models.scorer')
                    
                    model = Model(model_path)
                    if os.path.exists(scorer_path):
                        model.enableExternalScorer(scorer_path)
                    
                    # Convert audio data to format expected by DeepSpeech
                    audio_data_np = np.frombuffer(audio_data.get_raw_data(), np.int16)
                    
                    # Perform speech recognition
                    text = model.stt(audio_data_np)
                    
                    return {
                        "text": text,
                        "confidence": 0.8,  # DeepSpeech doesn't provide confidence scores
                        "engine": "deepspeech"
                    }
                except Exception as e:
                    print(f"DeepSpeech error: {str(e)}", file=sys.stderr)
                    # Fall back to other methods
            
            # Try to use Google's speech recognition
            try:
                text = self.recognizer.recognize_google(audio_data, language=language)
                return {
                    "text": text,
                    "confidence": 0.9,  # Google doesn't always provide confidence scores
                    "engine": "google"
                }
            except sr.UnknownValueError:
                return {
                    "text": "",
                    "error": "Speech could not be understood",
                    "engine": "google"
                }
            except sr.RequestError as e:
                print(f"Google speech recognition error: {str(e)}", file=sys.stderr)
                # Fall back to Sphinx
            
            # Try to use Sphinx (offline)
            try:
                text = self.recognizer.recognize_sphinx(audio_data, language=language)
                return {
                    "text": text,
                    "confidence": 0.7,  # Sphinx is less accurate
                    "engine": "sphinx"
                }
            except sr.UnknownValueError:
                return {
                    "text": "",
                    "error": "Speech could not be understood",
                    "engine": "sphinx"
                }
            except sr.RequestError as e:
                return {
                    "text": "",
                    "error": f"Sphinx error: {str(e)}",
                    "engine": "sphinx"
                }
        except Exception as e:
            return {
                "text": "",
                "error": str(e),
                "engine": "none"
            }
    
    def _analyze_audio(self, audio_path):
        """
        Analyze audio features
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            Dictionary with audio features
        """
        try:
            # Load audio file with librosa
            y, sr = librosa.load(audio_path, sr=None)
            
            # Extract features
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr).mean()
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr).mean()
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr).mean()
            zero_crossing_rate = librosa.feature.zero_crossing_rate(y).mean()
            
            # Calculate RMS energy
            rms = librosa.feature.rms(y=y).mean()
            
            # Calculate MFCCs
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfccs_mean = mfccs.mean(axis=1).tolist()
            
            return {
                "tempo": float(tempo),
                "spectralCentroid": float(spectral_centroid),
                "spectralBandwidth": float(spectral_bandwidth),
                "spectralRolloff": float(spectral_rolloff),
                "zeroCrossingRate": float(zero_crossing_rate),
                "rmsEnergy": float(rms),
                "mfccs": mfccs_mean
            }
        except Exception as e:
            return {
                "error": str(e)
            }

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Process an audio file with audio processing tasks')
    parser.add_argument('audio_path', help='Path to the audio file')
    parser.add_argument('--options', help='JSON string of processing options')
    return parser.parse_args()

def main():
    """Main entry point"""
    try:
        args = parse_arguments()
        
        # Parse options
        options = {}
        if args.options:
            options = json.loads(args.options)
        
        # Process audio
        processor = AudioProcessor()
        result = processor.process_audio(args.audio_path, options)
        
        # Print result as JSON
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }))

if __name__ == '__main__':
    main()
