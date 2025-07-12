# Open-Source Dependencies

This document lists all dependencies used in the chatbot platform and confirms their open-source compatibility.

## Core Dependencies

| Dependency | License | Purpose | Open-Source Compatible |
|------------|---------|---------|------------------------|
| Express | MIT | Web framework | ✅ |
| Mongoose | MIT | MongoDB ODM | ✅ |
| Socket.io | MIT | Real-time communication | ✅ |
| Axios | MIT | HTTP client | ✅ |
| Winston | MIT | Logging | ✅ |
| Joi | BSD-3-Clause | Validation | ✅ |
| Bcrypt | MIT | Password hashing | ✅ |
| JWT | MIT | Authentication | ✅ |
| Dotenv | BSD-2-Clause | Environment configuration | ✅ |
| Cors | MIT | CORS support | ✅ |
| Helmet | MIT | Security headers | ✅ |
| Morgan | MIT | HTTP request logging | ✅ |

## NLP Dependencies

| Dependency | License | Purpose | Open-Source Compatible |
|------------|---------|---------|------------------------|
| Natural | MIT | NLP utilities | ✅ |
| SpaCy | MIT | NLP processing | ✅ |
| NLTK | Apache 2.0 | NLP toolkit | ✅ |
| TensorFlow.js | Apache 2.0 | Machine learning | ✅ |
| Compromise | MIT | NLP parsing | ✅ |
| Sentiment | MIT | Sentiment analysis | ✅ |
| Franc | MIT | Language detection | ✅ |

## Voice Interface Dependencies

| Dependency | License | Purpose | Open-Source Compatible |
|------------|---------|---------|------------------------|
| Mozilla DeepSpeech | MPL 2.0 | Speech-to-text | ✅ |
| Coqui TTS | MPL 2.0 | Text-to-speech | ✅ |
| Vosk | Apache 2.0 | Offline speech recognition | ✅ |
| Kaldi | Apache 2.0 | Speech recognition | ✅ |
| Node-AudioRecorder | MIT | Audio recording | ✅ |
| Wav | MIT | Audio processing | ✅ |
| Node-Speaker | MIT | Audio output | ✅ |

## Testing Dependencies

| Dependency | License | Purpose | Open-Source Compatible |
|------------|---------|---------|------------------------|
| Jest | MIT | Testing framework | ✅ |
| Supertest | MIT | API testing | ✅ |
| Mocha | MIT | Testing framework | ✅ |
| Chai | MIT | Assertions | ✅ |
| Sinon | BSD-3-Clause | Mocking | ✅ |
| Playwright | Apache 2.0 | End-to-end testing | ✅ |
| Artillery | MPL 2.0 | Load testing | ✅ |
| MongoDB Memory Server | Apache 2.0 | In-memory MongoDB for testing | ✅ |
| Cross-env | MIT | Cross-platform environment variables | ✅ |
| Module-alias | MIT | Import path aliases | ✅ |

## Development Dependencies

| Dependency | License | Purpose | Open-Source Compatible |
|------------|---------|---------|------------------------|
| Nodemon | MIT | Development server | ✅ |
| ESLint | MIT | Code linting | ✅ |
| Prettier | MIT | Code formatting | ✅ |
| Husky | MIT | Git hooks | ✅ |
| Swagger-jsdoc | MIT | API documentation | ✅ |
| Swagger-ui-express | MIT | API documentation UI | ✅ |
| TypeScript | Apache 2.0 | Type checking | ✅ |

## Deployment Dependencies

| Dependency | License | Purpose | Open-Source Compatible |
|------------|---------|---------|------------------------|
| Docker | Apache 2.0 | Containerization | ✅ |
| PM2 | AGPL-3.0 | Process management | ✅ |
| Nginx | BSD-2-Clause | Web server | ✅ |
| Prometheus | Apache 2.0 | Monitoring | ✅ |
| Grafana | AGPL-3.0 | Monitoring UI | ✅ |

## Replaced Commercial Dependencies

The following commercial dependencies have been replaced with open-source alternatives:

| Commercial Dependency | Open-Source Replacement | License | Purpose |
|-----------------------|-------------------------|---------|---------|
| Google Speech-to-Text | Mozilla DeepSpeech | MPL 2.0 | Speech recognition |
| Amazon Polly | Coqui TTS | MPL 2.0 | Text-to-speech |
| Microsoft LUIS | Rasa NLU | Apache 2.0 | Intent recognition |
| Google Dialogflow | DeepPavlov | Apache 2.0 | Conversation management |
| AWS Comprehend | spaCy + NLTK | MIT/Apache 2.0 | NLP processing |

## Proxy Configuration

All HTTP requests to external services use the required proxy configuration:

```javascript
const axiosConfig = {
  proxy: {
    host: '104.129.196.38',
    port: 10563
  }
};
```

## Compliance Verification

All dependencies have been verified to ensure they:

1. Have compatible open-source licenses (MIT, Apache 2.0, BSD, MPL, etc.)
2. Do not require commercial licenses for production use
3. Can be freely distributed with the platform
4. Have active maintenance and community support

This verification ensures that the chatbot platform remains fully open-source and free to use, modify, and distribute.
