/**
 * Voice Interface Component
 * 
 * A React component that provides voice interface capabilities for chatbots
 */

class VoiceInterface extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      isListening: false,
      isSpeaking: false,
      transcript: '',
      errorMessage: '',
      audioBlob: null,
      mediaRecorder: null,
      audioChunks: [],
      settings: {
        stt: {
          provider: 'google',
          language: 'en-US'
        },
        tts: {
          provider: 'google',
          voice: 'en-US-Neural2-F',
          language: 'en-US',
          speakingRate: 1.0,
          pitch: 0
        }
      }
    };
    
    // Refs
    this.audioPlayer = React.createRef();
    
    // Bind methods
    this.startListening = this.startListening.bind(this);
    this.stopListening = this.stopListening.bind(this);
    this.handleAudioData = this.handleAudioData.bind(this);
    this.sendAudioToServer = this.sendAudioToServer.bind(this);
    this.playResponse = this.playResponse.bind(this);
    this.loadVoiceSettings = this.loadVoiceSettings.bind(this);
  }
  
  componentDidMount() {
    // Load voice settings if chatbot ID is provided
    if (this.props.chatbotId) {
      this.loadVoiceSettings();
    }
  }
  
  componentDidUpdate(prevProps) {
    // Reload settings if chatbot ID changes
    if (prevProps.chatbotId !== this.props.chatbotId && this.props.chatbotId) {
      this.loadVoiceSettings();
    }
  }
  
  /**
   * Load voice settings for the chatbot
   */
  async loadVoiceSettings() {
    try {
      const response = await fetch(`/api/voice/chatbots/${this.props.chatbotId}/settings`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load voice settings');
      }
      
      const data = await response.json();
      
      if (data.success && data.settings) {
        this.setState({ settings: data.settings });
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
      this.setState({ errorMessage: 'Failed to load voice settings' });
    }
  }
  
  /**
   * Start listening for voice input
   */
  async startListening() {
    try {
      // Reset state
      this.setState({
        isListening: true,
        transcript: '',
        errorMessage: '',
        audioBlob: null,
        audioChunks: []
      });
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.setState(prevState => ({
            audioChunks: [...prevState.audioChunks, event.data]
          }));
        }
      };
      
      mediaRecorder.onstop = this.handleAudioData;
      
      // Start recording
      mediaRecorder.start();
      
      this.setState({ mediaRecorder });
      
      // Provide visual feedback
      if (this.props.onListeningStart) {
        this.props.onListeningStart();
      }
    } catch (error) {
      console.error('Error starting voice recording:', error);
      this.setState({
        isListening: false,
        errorMessage: 'Failed to access microphone. Please check permissions.'
      });
      
      if (this.props.onError) {
        this.props.onError(error);
      }
    }
  }
  
  /**
   * Stop listening for voice input
   */
  stopListening() {
    const { mediaRecorder } = this.state;
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      
      // Stop all tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      this.setState({ isListening: false });
      
      // Provide visual feedback
      if (this.props.onListeningStop) {
        this.props.onListeningStop();
      }
    }
  }
  
  /**
   * Handle audio data after recording stops
   */
  handleAudioData() {
    const { audioChunks } = this.state;
    
    if (audioChunks.length > 0) {
      // Create blob from audio chunks
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      
      this.setState({ audioBlob });
      
      // Send audio to server
      this.sendAudioToServer(audioBlob);
    }
  }
  
  /**
   * Send audio to server for processing
   * @param {Blob} audioBlob - Audio blob
   */
  async sendAudioToServer(audioBlob) {
    try {
      // Show processing state
      this.setState({ isProcessing: true });
      
      if (this.props.onProcessingStart) {
        this.props.onProcessingStart();
      }
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      // Add settings
      const { settings } = this.state;
      formData.append('language', settings.stt.language);
      formData.append('sttProvider', settings.stt.provider);
      formData.append('ttsProvider', settings.tts.provider);
      formData.append('voice', settings.tts.voice);
      
      // Add conversation ID if provided
      if (this.props.conversationId) {
        formData.append('conversationId', this.props.conversationId);
      }
      
      // Send to server
      const response = await fetch(`/api/voice/chatbots/${this.props.chatbotId}/conversation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to process voice input');
      }
      
      const data = await response.json();
      
      // Update state with response
      this.setState({
        transcript: data.input.text,
        responseText: data.response.text,
        responseAudioUrl: data.response.audioUrl,
        isProcessing: false
      });
      
      // Play response
      this.playResponse(data.response.audioUrl);
      
      // Call callback with response
      if (this.props.onResponse) {
        this.props.onResponse(data);
      }
      
      // Update conversation ID if provided
      if (data.conversationId && this.props.onConversationIdChange) {
        this.props.onConversationIdChange(data.conversationId);
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      this.setState({
        isProcessing: false,
        errorMessage: 'Failed to process voice input'
      });
      
      if (this.props.onError) {
        this.props.onError(error);
      }
    }
  }
  
  /**
   * Play audio response
   * @param {string} audioUrl - URL of audio response
   */
  playResponse(audioUrl) {
    if (!audioUrl) return;
    
    this.setState({ isSpeaking: true });
    
    if (this.props.onSpeakingStart) {
      this.props.onSpeakingStart();
    }
    
    // Play audio
    const audioPlayer = this.audioPlayer.current;
    audioPlayer.src = audioUrl;
    audioPlayer.play();
    
    // Handle audio end
    audioPlayer.onended = () => {
      this.setState({ isSpeaking: false });
      
      if (this.props.onSpeakingEnd) {
        this.props.onSpeakingEnd();
      }
    };
  }
  
  render() {
    const {
      isListening,
      isSpeaking,
      isProcessing,
      transcript,
      responseText,
      errorMessage
    } = this.state;
    
    const buttonSize = this.props.buttonSize || 'medium';
    const buttonClass = `voice-button ${buttonSize} ${isListening ? 'listening' : ''} ${isProcessing ? 'processing' : ''} ${isSpeaking ? 'speaking' : ''}`;
    
    return (
      <div className="voice-interface">
        <button
          className={buttonClass}
          onClick={isListening ? this.stopListening : this.startListening}
          disabled={isProcessing || isSpeaking}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
        </button>
        
        {this.props.showTranscript && transcript && (
          <div className="voice-transcript">
            <p>{transcript}</p>
          </div>
        )}
        
        {this.props.showResponse && responseText && (
          <div className="voice-response">
            <p>{responseText}</p>
          </div>
        )}
        
        {errorMessage && (
          <div className="voice-error">
            <p>{errorMessage}</p>
          </div>
        )}
        
        <audio ref={this.audioPlayer} style={{ display: 'none' }}></audio>
      </div>
    );
  }
}

// PropTypes
VoiceInterface.propTypes = {
  chatbotId: PropTypes.string.isRequired,
  conversationId: PropTypes.string,
  buttonSize: PropTypes.oneOf(['small', 'medium', 'large']),
  showTranscript: PropTypes.bool,
  showResponse: PropTypes.bool,
  onListeningStart: PropTypes.func,
  onListeningStop: PropTypes.func,
  onProcessingStart: PropTypes.func,
  onResponse: PropTypes.func,
  onSpeakingStart: PropTypes.func,
  onSpeakingEnd: PropTypes.func,
  onConversationIdChange: PropTypes.func,
  onError: PropTypes.func
};

VoiceInterface.defaultProps = {
  buttonSize: 'medium',
  showTranscript: false,
  showResponse: false
};
