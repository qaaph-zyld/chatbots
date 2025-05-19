# Customizable Chatbots Platform

A modern, flexible platform for creating and deploying customizable chatbots with advanced AI capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

## Project Overview

This project aims to create a comprehensive framework for developing customizable chatbots that can be tailored to specific use cases and domains. The platform leverages modern AI technologies to provide intelligent, context-aware conversational experiences.

The Customizable Chatbots Platform allows developers and businesses to:

- Create chatbots with different AI engines (Botpress, Hugging Face, etc.)
- Define custom conversation templates and flows
- Deploy chatbots across multiple channels (web, mobile, messaging platforms)
- Analyze conversation data and improve chatbot performance
- Extend functionality through a modular architecture

## Features

### Core Features
- **Multiple Engine Support**: Seamlessly switch between different AI engines (Botpress, Hugging Face)
- **Conversation Templates**: Create and manage reusable conversation flows
- **NLP Processing**: Built-in natural language processing capabilities
- **Multi-channel Integration**: Deploy chatbots across web, mobile, and messaging platforms
- **Extensible Architecture**: Modular design for easy customization and extension

### Advanced Features
- **Context Management**: Maintain conversation context across multiple interactions
- **Knowledge Base Integration**: Connect to external knowledge sources
- **Analytics Dashboard**: Monitor chatbot performance and user interactions
- **Training Interface**: Improve chatbot responses through training
- **Role-based Access Control**: Secure administration and management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Git
- MongoDB (v4.4 or higher) for database storage
- Internet connection for external AI services (if using remote engines)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/Pavleee23/chatbots.git
   cd chatbots
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server
   ```
   npm run dev
   ```

## Project Structure

```
chatbots/
├── src/                      # Source code
│   ├── api/                  # API endpoints and controllers
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Data models
│   │   └── routes/           # API route definitions
│   ├── bot/                  # Chatbot core functionality
│   │   ├── engines/          # Engine implementations
│   │   │   ├── processors/   # Engine-specific processors
│   │   │   ├── base.engine.js      # Base engine class
│   │   │   ├── botpress.engine.js  # Botpress implementation
│   │   │   ├── huggingface.engine.js # Hugging Face implementation
│   │   │   └── engine.factory.js   # Engine factory pattern
│   │   ├── nlp/              # NLP components
│   │   │   ├── processors/   # NLP processors
│   │   │   └── base.processor.js # Base NLP processor
│   │   └── templates/        # Conversation templates
│   │       ├── base.template.js # Base template class
│   │       └── simple.template.js # Simple template implementation
│   ├── config/               # Configuration files
│   │   └── index.js          # Centralized configuration
│   ├── database/             # Database models and connections
│   │   ├── connection.js     # Database connection logic
│   │   └── schemas/          # Mongoose schemas
│   ├── integrations/         # Third-party integrations
│   │   ├── channels/         # Channel implementations
│   │   │   └── web.channel.js # Web channel integration
│   │   └── base.channel.js   # Base channel class
│   ├── middleware/           # Express middleware
│   │   ├── auth.middleware.js # Authentication middleware
│   │   ├── error.middleware.js # Error handling middleware
│   │   └── logger.middleware.js # Request logging middleware
│   ├── public/               # Static assets
│   │   ├── css/              # Stylesheets
│   │   ├── js/               # Client-side scripts
│   │   └── images/           # Images and icons
│   ├── services/             # Business logic layer
│   │   └── chatbot.service.js # Chatbot service implementation
│   ├── tests/                # Test files
│   │   ├── integration/      # Integration tests
│   │   ├── manual/           # Manual test scripts
│   │   └── unit/             # Unit tests
│   └── utils/                # Utility functions
│       ├── errors.js         # Error handling utilities
│       ├── logger.js         # Logging utilities
│       └── validation.js     # Validation utilities
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore file
├── package.json              # Project dependencies
└── README.md                 # Project overview
```

## Development Roadmap

### Phase 1: Core Architecture (Completed)
- ✅ Project structure and organization
- ✅ Base engine abstractions
- ✅ NLP processing components
- ✅ Template system
- ✅ API endpoints

### Phase 2: Basic Functionality (Current)
- ✅ Engine implementations (Botpress, Hugging Face)
- ✅ Message processing flow
- ✅ Basic web interface
- ✅ Error handling and logging
- ⬜ Database integration

### Phase 3: Advanced Features (Upcoming)
- ⬜ User authentication and authorization
- ⬜ Conversation history and context management
- ⬜ Knowledge base integration
- ⬜ Analytics and reporting
- ⬜ Training interface

### Phase 4: Deployment and Scaling (Future)
- ⬜ Containerization
- ⬜ Cloud deployment
- ⬜ Performance optimization
- ⬜ Monitoring and alerting
- ⬜ Documentation and tutorials

## Best Practices

This project follows these development best practices:

### Code Quality
- Consistent coding style with ESLint and Prettier
- TypeScript for type safety
- Documentation for all public APIs and complex functions
- Comprehensive error handling

### Architecture
- Modular design with clear separation of concerns
- Dependency injection for testability
- Factory patterns for extensibility
- Configuration management with environment variables

### Testing
- Unit tests for core functionality
- Integration tests for API endpoints
- Manual test scripts for quick validation
- Continuous integration

## API Documentation

### Chatbot Endpoints

#### Create a Chatbot
```
POST /api/chatbots
```
Request body:
```json
{
  "name": "My Chatbot",
  "description": "A helpful assistant",
  "engine": "botpress",
  "engineConfig": {
    "botId": "my-bot"
  }
}
```

#### Process a Message
```
POST /api/chatbots/:id/message
```
Request body:
```json
{
  "message": "Hello, how can you help me?",
  "sessionId": "user-session-123"
}
```

#### Get Conversation History
```
GET /api/chatbots/:id/conversations?sessionId=user-session-123
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|--------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `DATABASE_URL` | MongoDB connection string | `mongodb://localhost:27017/chatbots` |
| `JWT_SECRET` | Secret for JWT tokens | `development-secret-key` |
| `DEFAULT_ENGINE` | Default chatbot engine | `botpress` |
| `BOTPRESS_API_URL` | Botpress API URL | `http://localhost:3000` |
| `HUGGINGFACE_API_URL` | Hugging Face API URL | `https://api-inference.huggingface.co/models` |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
