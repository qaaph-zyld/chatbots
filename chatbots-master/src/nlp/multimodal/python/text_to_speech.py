#!/usr/bin/env python
"""
Text-to-Speech Script

This script provides text-to-speech capabilities using open-source libraries:
- Mozilla TTS/Coqui TTS for high-quality speech synthesis
- pyttsx3 as a fallback for offline TTS
- gTTS as another fallback option

It serves as a bridge between the Node.js application and Python TTS libraries.
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
    import numpy as np
except ImportError:
    import subprocess
    import sys
    
    # Install required packages
    subprocess.check_call([sys.executable, "-m", "pip", "install", "numpy"])
    
    # Import after installation
    import numpy as np

# Try to import TTS libraries in order of preference
TTS_ENGINE = None
TTS_ENGINE_NAME = None

# Try Coqui TTS (formerly Mozilla TTS)
try:
    import torch
    from TTS.utils.manage import ModelManager
    from TTS.utils.synthesizer import Synthesizer
    TTS_ENGINE = "coqui"
    TTS_ENGINE_NAME = "Coqui TTS"
    print("Using Coqui TTS for speech synthesis", file=sys.stderr)
except ImportError:
    pass

# Try pyttsx3 as fallback
if not TTS_ENGINE:
    try:
        import pyttsx3
        TTS_ENGINE = "pyttsx3"
        TTS_ENGINE_NAME = "pyttsx3"
        print("Using pyttsx3 for speech synthesis", file=sys.stderr)
    except ImportError:
        pass

# Try gTTS as another fallback
if not TTS_ENGINE:
    try:
        from gtts import gTTS
        TTS_ENGINE = "gtts"
        TTS_ENGINE_NAME = "Google Text-to-Speech"
        print("Using gTTS for speech synthesis", file=sys.stderr)
    except ImportError:
        pass

# If no TTS engine is available, install one
if not TTS_ENGINE:
    try:
        import subprocess
        print("No TTS engine found. Installing pyttsx3...", file=sys.stderr)
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyttsx3"])
        import pyttsx3
        TTS_ENGINE = "pyttsx3"
        TTS_ENGINE_NAME = "pyttsx3"
        print("Using pyttsx3 for speech synthesis", file=sys.stderr)
    except Exception as e:
        print(f"Failed to install TTS engine: {str(e)}", file=sys.stderr)

class TextToSpeech:
    """Text-to-speech using open-source libraries"""
    
    def __init__(self, model_path=None):
        """Initialize text-to-speech engine"""
        self.model_path = model_path or os.path.join(os.getcwd(), 'models')
        self.engine = TTS_ENGINE
        self.engine_name = TTS_ENGINE_NAME
        
        # Initialize TTS engine
        if self.engine == "coqui":
            self._initialize_coqui_tts()
        elif self.engine == "pyttsx3":
            self._initialize_pyttsx3()
        elif self.engine == "gtts":
            # gTTS doesn't need initialization
            pass
        else:
            raise ValueError("No TTS engine available")
    
    def _initialize_coqui_tts(self):
        """Initialize Coqui TTS"""
        try:
            # Check if models are available
            tts_model_path = os.path.join(self.model_path, "tts_model.pth")
            tts_config_path = os.path.join(self.model_path, "tts_config.json")
            vocoder_model_path = os.path.join(self.model_path, "vocoder_model.pth")
            vocoder_config_path = os.path.join(self.model_path, "vocoder_config.json")
            
            # If models are not available, use default models
            if not (os.path.exists(tts_model_path) and os.path.exists(tts_config_path)):
                print("Custom TTS models not found. Using default models.", file=sys.stderr)
                self.synthesizer = None
            else:
                # Initialize synthesizer with custom models
                self.synthesizer = Synthesizer(
                    tts_checkpoint=tts_model_path,
                    tts_config_path=tts_config_path,
                    vocoder_checkpoint=vocoder_model_path if os.path.exists(vocoder_model_path) else None,
                    vocoder_config=vocoder_config_path if os.path.exists(vocoder_config_path) else None,
                    use_cuda=torch.cuda.is_available()
                )
        except Exception as e:
            print(f"Error initializing Coqui TTS: {str(e)}", file=sys.stderr)
            self.synthesizer = None
    
    def _initialize_pyttsx3(self):
        """Initialize pyttsx3"""
        try:
            self.pyttsx3_engine = pyttsx3.init()
            
            # Get available voices
            self.voices = self.pyttsx3_engine.getProperty('voices')
            
            # Set default properties
            self.pyttsx3_engine.setProperty('rate', 150)  # Speed of speech
            self.pyttsx3_engine.setProperty('volume', 1.0)  # Volume (0.0 to 1.0)
            
            # Set default voice (usually index 0 is male, 1 is female)
            if len(self.voices) > 1:
                self.pyttsx3_engine.setProperty('voice', self.voices[1].id)  # Female voice
        except Exception as e:
            print(f"Error initializing pyttsx3: {str(e)}", file=sys.stderr)
            self.pyttsx3_engine = None
    
    def synthesize(self, text, output_path, options=None):
        """
        Synthesize speech from text
        
        Args:
            text: Text to convert to speech
            output_path: Path to save the audio file
            options: Synthesis options
            
        Returns:
            Dictionary with synthesis results
        """
        options = options or {}
        
        try:
            if self.engine == "coqui":
                return self._synthesize_coqui(text, output_path, options)
            elif self.engine == "pyttsx3":
                return self._synthesize_pyttsx3(text, output_path, options)
            elif self.engine == "gtts":
                return self._synthesize_gtts(text, output_path, options)
            else:
                return {
                    "success": False,
                    "error": "No TTS engine available"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
    
    def _synthesize_coqui(self, text, output_path, options):
        """
        Synthesize speech using Coqui TTS
        
        Args:
            text: Text to convert to speech
            output_path: Path to save the audio file
            options: Synthesis options
            
        Returns:
            Dictionary with synthesis results
        """
        try:
            if self.synthesizer is None:
                # If custom models are not available, use default models
                # This requires internet connection to download models
                from TTS.api import TTS
                
                # Get available models
                models = TTS().list_models()
                
                # Choose a model
                model_name = "tts_models/en/ljspeech/tacotron2-DDC"
                for model in models:
                    if "en" in model and "ljspeech" in model:
                        model_name = model
                        break
                
                # Initialize TTS with the chosen model
                tts = TTS(model_name)
                
                # Synthesize speech
                tts.tts_to_file(text, file_path=output_path)
            else:
                # Use custom models
                wavs = self.synthesizer.tts(text)
                self.synthesizer.save_wav(wavs, output_path)
            
            # Get audio duration
            import wave
            with wave.open(output_path, 'rb') as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                duration = frames / float(rate)
            
            return {
                "success": True,
                "engine": "coqui",
                "duration": duration,
                "outputPath": output_path
            }
        except Exception as e:
            print(f"Error synthesizing with Coqui TTS: {str(e)}", file=sys.stderr)
            # Fall back to other methods
            if self.pyttsx3_engine:
                return self._synthesize_pyttsx3(text, output_path, options)
            elif TTS_ENGINE == "gtts":
                return self._synthesize_gtts(text, output_path, options)
            else:
                return {
                    "success": False,
                    "error": str(e)
                }
    
    def _synthesize_pyttsx3(self, text, output_path, options):
        """
        Synthesize speech using pyttsx3
        
        Args:
            text: Text to convert to speech
            output_path: Path to save the audio file
            options: Synthesis options
            
        Returns:
            Dictionary with synthesis results
        """
        try:
            if not self.pyttsx3_engine:
                return {
                    "success": False,
                    "error": "pyttsx3 engine not initialized"
                }
            
            # Set voice
            voice = options.get('voice', 'female')
            if voice == 'female' and len(self.voices) > 1:
                self.pyttsx3_engine.setProperty('voice', self.voices[1].id)
            elif voice == 'male' and len(self.voices) > 0:
                self.pyttsx3_engine.setProperty('voice', self.voices[0].id)
            
            # Set rate
            rate = options.get('rate', 150)
            self.pyttsx3_engine.setProperty('rate', rate)
            
            # Set volume
            volume = options.get('volume', 1.0)
            self.pyttsx3_engine.setProperty('volume', volume)
            
            # Save to file
            self.pyttsx3_engine.save_to_file(text, output_path)
            self.pyttsx3_engine.runAndWait()
            
            # Estimate duration (rough estimate)
            words = len(text.split())
            duration = words / (rate / 100)  # Rough estimate: rate is words per minute
            
            return {
                "success": True,
                "engine": "pyttsx3",
                "duration": duration,
                "outputPath": output_path
            }
        except Exception as e:
            print(f"Error synthesizing with pyttsx3: {str(e)}", file=sys.stderr)
            # Fall back to gTTS if available
            if TTS_ENGINE == "gtts":
                return self._synthesize_gtts(text, output_path, options)
            else:
                return {
                    "success": False,
                    "error": str(e)
                }
    
    def _synthesize_gtts(self, text, output_path, options):
        """
        Synthesize speech using gTTS
        
        Args:
            text: Text to convert to speech
            output_path: Path to save the audio file
            options: Synthesis options
            
        Returns:
            Dictionary with synthesis results
        """
        try:
            # Set language
            language = options.get('language', 'en')
            
            # Set slow
            slow = options.get('slow', False)
            
            # Create gTTS object
            tts = gTTS(text=text, lang=language, slow=slow)
            
            # Save to file
            tts.save(output_path)
            
            # Estimate duration (rough estimate)
            words = len(text.split())
            duration = words * 0.5  # Rough estimate: 0.5 seconds per word
            
            return {
                "success": True,
                "engine": "gtts",
                "duration": duration,
                "outputPath": output_path
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = ["numpy"]
    optional_packages = ["torch", "TTS", "pyttsx3", "gtts"]
    
    missing_required = []
    installed_optional = []
    
    # Check required packages
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_required.append(package)
    
    # Check optional packages
    for package in optional_packages:
        try:
            __import__(package)
            installed_optional.append(package)
        except ImportError:
            pass
    
    result = {
        "success": len(missing_required) == 0,
        "missingRequired": missing_required,
        "installedOptional": installed_optional,
        "ttsEngine": TTS_ENGINE
    }
    
    if result["success"]:
        result["message"] = "All required dependencies are installed"
    else:
        result["message"] = f"Missing required dependencies: {', '.join(missing_required)}"
    
    return result

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Convert text to speech')
    parser.add_argument('--check-dependencies', action='store_true', help='Check if required dependencies are installed')
    parser.add_argument('text', nargs='?', help='Text to convert to speech')
    parser.add_argument('output_path', nargs='?', help='Path to save the audio file')
    parser.add_argument('--options', help='JSON string of synthesis options')
    return parser.parse_args()

def main():
    """Main entry point"""
    try:
        args = parse_arguments()
        
        # Check dependencies if requested
        if args.check_dependencies:
            result = check_dependencies()
            print(json.dumps(result))
            return
        
        # Validate arguments
        if not args.text or not args.output_path:
            print(json.dumps({
                "success": False,
                "error": "Text and output path are required"
            }))
            return
        
        # Parse options
        options = {}
        if args.options:
            options = json.loads(args.options)
        
        # Synthesize speech
        tts = TextToSpeech()
        result = tts.synthesize(args.text, args.output_path, options)
        
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
