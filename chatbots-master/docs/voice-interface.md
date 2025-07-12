# Voice Interface Integration

This document provides a comprehensive guide to integrating voice capabilities into your chatbots using our Voice Interface feature.

## Overview

The Voice Interface integration allows your chatbots to:

- Accept voice input from users (Speech-to-Text)
- Respond with voice output (Text-to-Speech)
- Recognize speakers (optional)
- Support multiple languages
- Customize voice characteristics

## Getting Started

### Prerequisites

To use the Voice Interface, ensure you have:

1. A registered chatbot on the platform
2. API credentials (token or API key)
3. Access to a supported speech service (Google, Azure, or AWS)

### Configuration

Configure the voice interface by setting the following environment variables or updating the `config/voice.config.js` file:

```javascript
// Speech-to-Text configuration
VOICE_STT_PROVIDER=google  // Options: google, azure, aws
GOOGLE_SPEECH_API_KEY=your_api_key
AZURE_SPEECH_KEY=your_azure_key
AWS_ACCESS_KEY_ID=your_aws_key
VOICE_STT_LANGUAGE=en-US

// Text-to-Speech configuration
VOICE_TTS_PROVIDER=google  // Options: google, azure, aws
VOICE_TTS_VOICE=en-US-Neural2-F
VOICE_TTS_SPEAKING_RATE=1.0
VOICE_TTS_PITCH=0.0
```

## API Endpoints

### Process Voice Input

Convert audio to text and get a chatbot response with voice output.

```
POST /api/voice/chatbots/:chatbotId/conversation
```

**Parameters:**
- `audio` (file): Audio file containing speech
- `conversationId` (optional): Ongoing conversation ID
- `language` (optional): Language code (e.g., "en-US")
- `sttProvider` (optional): Speech-to-text provider
- `ttsProvider` (optional): Text-to-speech provider
- `voice` (optional): Voice ID to use for response

**Response:**
```json
{
  "success": true,
  "input": {
    "text": "What's the weather like today?",
    "audioUrl": "/api/voice/audio/input-123.webm"
  },
  "response": {
    "text": "The weather is sunny with a high of 75°F.",
    "audioUrl": "/api/voice/audio/response-456.mp3"
  },
  "conversationId": "conv-789"
}
```

### Text to Speech

Convert text to speech.

```
POST /api/voice/tts
```

**Parameters:**
- `text` (required): Text to convert to speech
- `voice` (optional): Voice ID to use
- `language` (optional): Language code
- `provider` (optional): TTS provider
- `speakingRate` (optional): Speaking rate (0.5 to 2.0)
- `pitch` (optional): Voice pitch (-20.0 to 20.0)

**Response:**
```json
{
  "success": true,
  "text": "Hello, how can I help you?",
  "audioUrl": "/api/voice/audio/tts-123.mp3",
  "voice": "en-US-Neural2-F",
  "language": "en-US"
}
```

### Speech to Text

Convert speech to text.

```
POST /api/voice/stt
```

**Parameters:**
- `audio` (file): Audio file containing speech
- `language` (optional): Language code
- `provider` (optional): STT provider

**Response:**
```json
{
  "success": true,
  "text": "Hello, I'd like to book a flight.",
  "confidence": 0.95,
  "alternatives": [
    {
      "text": "Hello, I'd like to book a flight.",
      "confidence": 0.95
    },
    {
      "text": "Hello, I like to book a flight.",
      "confidence": 0.82
    }
  ],
  "language": "en-US"
}
```

### Get Available Voices

Get a list of available voices.

```
GET /api/voice/voices
```

**Parameters:**
- `provider` (optional): TTS provider
- `language` (optional): Filter voices by language

**Response:**
```json
{
  "success": true,
  "provider": "google",
  "voices": [
    {
      "id": "en-US-Neural2-A",
      "name": "Male (A)",
      "language": "en-US",
      "gender": "MALE"
    },
    {
      "id": "en-US-Neural2-F",
      "name": "Female (F)",
      "language": "en-US",
      "gender": "FEMALE"
    }
  ]
}
```

### Get Voice Settings

Get voice settings for a chatbot.

```
GET /api/voice/chatbots/:chatbotId/settings
```

**Response:**
```json
{
  "success": true,
  "chatbotId": "chatbot-123",
  "settings": {
    "enabled": true,
    "stt": {
      "provider": "google",
      "language": "en-US"
    },
    "tts": {
      "provider": "google",
      "voice": "en-US-Neural2-F",
      "language": "en-US",
      "speakingRate": 1.0,
      "pitch": 0
    }
  }
}
```

### Update Voice Settings

Update voice settings for a chatbot.

```
PUT /api/voice/chatbots/:chatbotId/settings
```

**Parameters:**
- `settings` (object): Voice settings object

**Response:**
```json
{
  "success": true,
  "chatbotId": "chatbot-123",
  "settings": {
    "enabled": true,
    "stt": {
      "provider": "azure",
      "language": "en-GB"
    },
    "tts": {
      "provider": "azure",
      "voice": "en-GB-LibbyNeural",
      "language": "en-GB",
      "speakingRate": 1.1,
      "pitch": 2
    }
  },
  "message": "Voice settings updated successfully"
}
```

## Frontend Integration

### React Component

We provide a React component for easy integration:

```javascript
import { VoiceInterface } from '@chatbots/voice-interface';

function ChatApp() {
  const [conversationId, setConversationId] = useState(null);
  
  return (
    <div className="chat-container">
      <div className="messages">
        {/* Your chat messages here */}
      </div>
      
      <VoiceInterface
        chatbotId="your-chatbot-id"
        conversationId={conversationId}
        buttonSize="medium"
        onResponse={(data) => {
          // Handle the response
          setConversationId(data.conversationId);
          // Add messages to your UI
        }}
        onError={(error) => {
          console.error('Voice error:', error);
        }}
      />
    </div>
  );
}
```

### HTML/JavaScript Integration

For non-React applications:

```html
<!-- Include the Voice Interface component -->
<script src="/js/components/VoiceInterface.js"></script>
<link rel="stylesheet" href="/css/voice-interface.css">

<!-- Add a container for the voice interface -->
<div id="voice-interface-container"></div>

<script>
  // Create voice interface props
  const voiceProps = {
    chatbotId: 'your-chatbot-id',
    buttonSize: 'medium',
    onResponse: (data) => {
      // Handle the response
      console.log(data);
    }
  };
  
  // Create voice interface element
  const voiceInterfaceElement = React.createElement(VoiceInterface, voiceProps);
  
  // Render voice interface
  ReactDOM.render(
    voiceInterfaceElement,
    document.getElementById('voice-interface-container')
  );
</script>
```

## Demo

A complete demo is available at `/voice-demo.html` that showcases all the voice interface capabilities.

## Supported Voice Providers

### Google Cloud Speech

- **Features**: High-quality neural voices, 40+ languages, SSML support
- **Configuration**: Requires Google Cloud API key
- **Documentation**: [Google Cloud Speech-to-Text](https://cloud.google.com/speech-to-text) and [Text-to-Speech](https://cloud.google.com/text-to-speech)

### Microsoft Azure Speech

- **Features**: Neural voices, 75+ languages, speaker recognition
- **Configuration**: Requires Azure subscription key and region
- **Documentation**: [Azure Speech Service](https://azure.microsoft.com/en-us/services/cognitive-services/speech-services/)

### Amazon AWS

- **Features**: Neural voices, 30+ languages, SSML support
- **Configuration**: Requires AWS credentials
- **Documentation**: [Amazon Transcribe](https://aws.amazon.com/transcribe/) and [Amazon Polly](https://aws.amazon.com/polly/)

## Best Practices

1. **Provide Visual Feedback**: Always indicate when the system is listening, processing, or speaking
2. **Handle Errors Gracefully**: Implement fallbacks for when voice recognition fails
3. **Optimize Audio Quality**: Use appropriate audio formats and compression
4. **Consider Privacy**: Inform users when audio is being recorded and processed
5. **Test Across Devices**: Voice capabilities can vary across browsers and devices

## Troubleshooting

### Common Issues

1. **Microphone Access Denied**: Ensure your site is using HTTPS and users have granted microphone permissions
2. **Audio Not Playing**: Check if autoplay is blocked by the browser
3. **Recognition Errors**: Try adjusting the language settings or improving audio quality
4. **API Key Issues**: Verify your API keys are correctly configured

### Debugging

Enable debug logging by setting:

```javascript
localStorage.setItem('voiceDebug', 'true');
```

## Support

For additional help, contact our support team at support@chatbotsplatform.com or visit our developer forum at https://forum.chatbotsplatform.com.
