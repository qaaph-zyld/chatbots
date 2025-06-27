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
- **Rate Limiting**: Protect API endpoints from abuse with configurable rate limits
- **Response Caching**: Improve performance with Redis-based response caching
  - **Cache Monitoring**: Track cache hit/miss metrics for performance insights
  - **Cache Warming**: Pre-populate cache with frequently accessed resources
  - **Adaptive TTL**: Dynamically adjust cache expiration times based on usage patterns
- **Sentiment Analysis**: Analyze message sentiment to enhance conversation flow
- **AI-Enhanced Test Automation**: Robust test framework with intelligent failure recovery
  - **Automatic Fix Generation**: AI-powered analysis and fix suggestions
  - **Network Error Handling**: Detection and recovery from network-related issues
  - **Comprehensive Logging**: Structured logging with different log levels
  - [Learn more about the Test Automation Framework](./docs/test-automation-framework.md)

## Documentation

> [!IMPORTANT]
> The project documentation has been reorganized to align with the `dev_framework` principles, providing a structured approach to documenting all aspects of the project. Always refer to the documentation when developing new features or making changes to existing ones.

### Documentation Structure

The documentation is organized into four main categories:

- **[01_Testing_Strategies](./docs/01_Testing_Strategies/README.md)**: Documentation related to testing methodologies and best practices
  - Unit Testing Approach
  - Integration Testing
  - End-to-End Testing
  - Test Automation

- **[02_Security_and_DevOps](./docs/02_Security_and_DevOps/README.md)**: Documentation related to security practices and operational considerations
  - Security Practices
  - CI/CD Pipeline
  - Deployment Strategy
  - Monitoring

- **[03_Development_Methodologies](./docs/03_Development_Methodologies/README.md)**: Documentation related to coding standards and architectural patterns
  - Code Standards
  - Architecture Patterns
  - API Design
  - Component Structure

- **[04_Project_Specifics](./docs/04_Project_Specifics/README.md)**: Documentation for project-specific aspects
  - Custom Components
  - Prompt Engineering
  - Community Features

### Contributing to Documentation

When adding new documentation:

1. Identify the appropriate category for your documentation
2. Create a new Markdown file in the corresponding directory
3. Follow the naming convention: `XX_Descriptive_Name.md` where `XX` is the next available number in the directory
4. Update the README.md file in the directory to include a reference to your new file
5. Update the CHANGELOG.md in the project root to reflect your documentation changes

### Documentation Maintenance

To ensure documentation remains accurate and valuable:

- **Regular Reviews**: Documentation should be reviewed quarterly to ensure it remains accurate
- **Feature Documentation**: All new features must include corresponding documentation updates
- **Validation**: Run `node scripts/validate-docs.js` to verify documentation integrity
- **CI/CD Integration**: Documentation validation is part of the CI pipeline

### Documentation Tools

- **Validation Script**: `scripts/validate-docs.js` checks for broken links and structural issues
- **Markdown Linting**: Use `.markdownlint.json` configuration for consistent formatting
- **Cross-References**: Use relative links to reference other documentation files

For more information, see the [Documentation README](./docs/README.md) and [Documentation Contributing Guide](./docs/DOCUMENTATION_CONTRIBUTING.md).

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
├── configs/                # Configuration files
│   ├── eslint/              # ESLint configuration
│   ├── jest/                # Jest configuration
│   └── webpack/             # Webpack configuration
├── docs/                   # Documentation files
│   ├── mongodb-connection-guide.md
│   └── workspace_structure.md
├── src/                    # Source code
│   ├── api/                  # API endpoints
│   │   ├── controllers/       # API controllers
│   │   └── routes/            # API routes
│   ├── core/                 # Core functionality
│   │   ├── engine/            # Engine abstractions
│   │   └── interfaces/        # Core interfaces
│   ├── data/                 # Data access layer
│   │   └── repositories/      # Data repositories
│   ├── domain/               # Domain models
│   │   ├── analytics.model.js # Analytics model
│   │   ├── chatbot.model.js   # Chatbot model
│   │   └── topic.model.js     # Topic model
│   ├── middleware/           # Middleware components
│   │   ├── auth/              # Authentication middleware
│   │   ├── cache/             # Response caching middleware
│   │   ├── error/             # Error handling middleware
│   │   ├── logging/           # Request logging middleware
│   │   └── rate-limit/        # Rate limiting middleware
│   ├── modules/              # Feature modules
│   │   ├── analytics/         # Analytics module
│   │   ├── chatbot/           # Chatbot module
│   │   ├── conversation/      # Conversation module
│   │   ├── entity/            # Entity module
│   │   ├── preference/        # Preference module
│   │   ├── sentiment/         # Sentiment analysis module
│   │   └── topic/             # Topic module
│   └── utils/                # Utility functions
│       ├── errors.js          # Error handling utilities
│       ├── logger.js          # Logging utilities
│       └── validation.js      # Validation utilities
├── tests/                  # Test files
│   ├── e2e/                  # End-to-end tests
│   ├── integration/          # Integration tests
│   └── unit/                 # Unit tests
│       └── setup/              # Test setup files
├── .eslintrc.js            # ESLint configuration
├── .github/                # GitHub configuration
│   └── workflows/            # GitHub Actions workflows
├── .gitignore              # Git ignore file
├── jest.config.js          # Jest configuration
├── package.json            # Project dependencies
├── README.md               # Project overview
└── webpack.config.js       # Webpack configuration
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
- ✅ Rate limiting middleware
- ✅ Response caching middleware
- ⬜ Database integration

### Phase 3: Advanced Features (Upcoming)
- ✅ User authentication and authorization
- ✅ Sentiment analysis integration
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
