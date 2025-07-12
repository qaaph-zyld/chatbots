# Customizable Chatbots Platform

A modern, flexible platform for creating and deploying customizable chatbots with advanced AI capabilities.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2016.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![CI/CD](https://github.com/your-org/customizable-chatbots/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/customizable-chatbots/actions)
[![codecov](https://codecov.io/gh/your-org/customizable-chatbots/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/customizable-chatbots)
[![Documentation Status](https://readthedocs.org/projects/customizable-chatbots/badge/?version=latest)](https://docs.yourdomain.com)

## Project Overview

This project is a comprehensive framework for developing customizable chatbots that can be tailored to specific use cases and domains. Built with a modular architecture, it leverages modern AI technologies to provide intelligent, context-aware conversational experiences.

### Key Features

- **Modular Architecture**: Clean separation of concerns with distinct layers for API, services, and integrations
- **Multi-Engine Support**: Seamlessly switch between different AI/NLP engines
- **Scalable Design**: Built for high availability and horizontal scaling
- **Comprehensive Testing**: Full test coverage with unit, integration, and E2E tests
- **Developer Friendly**: Well-documented codebase with clear contribution guidelines

### Getting Started

#### Prerequisites

- Node.js 16+ and npm/yarn
- MongoDB 5.0+
- Redis 6.0+
- (Optional) Docker and Docker Compose

#### Quick Start

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/customizable-chatbots.git
   cd customizable-chatbots
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file and update with your configuration:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the API at `http://localhost:3000`

#### Project Structure

```
├── config/                 # Configuration files
├── src/
│   ├── api/                # API layer (routes, controllers, middleware)
│   │   └── v1/             # API versioning
│   ├── core/               # Core business logic
│   │   ├── models/         # Data models
│   │   └── services/       # Business logic services
│   ├── integrations/       # Third-party integrations
│   │   └── ai/             # AI/ML service integrations
│   ├── tests/              # Test suites
│   │   ├── unit/           # Unit tests
│   │   ├── integration/    # Integration tests
│   │   └── e2e/            # End-to-end tests
│   └── utils/              # Utility functions and helpers
├── docs/                   # Project documentation
└── scripts/                # Utility scripts
```

## Features

### Core Features
- **Multi-Engine Support**: Seamlessly integrate with various AI/NLP providers (OpenAI, Hugging Face, etc.)
- **Conversation Management**: Stateful conversations with context preservation
- **Natural Language Processing**: Intent recognition, entity extraction, and sentiment analysis
- **Multi-channel Deployment**: Deploy across web, mobile, and messaging platforms
- **Modular Architecture**: Extensible design for custom integrations and plugins

### API Capabilities
- **RESTful API**: Standardized endpoints for all operations
- **WebSocket Support**: Real-time communication for chat interfaces
- **Webhook Integration**: Connect with external services and workflows
- **Rate Limiting & Throttling**: Protect your API from abuse
- **Comprehensive Documentation**: Auto-generated API documentation with Swagger/OpenAPI

### Advanced Features
- **Context-Aware Conversations**: Maintain context across multiple interactions
- **Knowledge Graph Integration**: Connect to external knowledge bases and data sources
- **Analytics & Monitoring**: Track usage, performance, and user engagement
- **A/B Testing**: Test different conversation flows and responses
- **Role-Based Access Control**: Fine-grained permissions for teams and organizations
- **Multi-tenancy**: Support for multiple independent chatbot instances
- **Internationalization**: Built-in support for multiple languages

### Developer Experience
- **Comprehensive Testing**: Full test coverage with Jest and Supertest
- **Type Safety**: TypeScript support throughout the codebase
- **CI/CD Ready**: GitHub Actions workflows for testing and deployment
- **Containerized**: Docker support for easy development and deployment
- **Documentation**: Detailed API references and development guides

## Documentation

Our documentation is designed to help you understand, use, and contribute to the project effectively. The documentation follows the `dev_framework` principles for consistency and maintainability.

### Getting Started

- [Installation Guide](./docs/01_Getting_Started/01_Installation.md)
- [Configuration](./docs/01_Getting_Started/02_Configuration.md)
- [Quick Start](./docs/01_Getting_Started/03_Quick_Start.md)

### Development

#### Architecture
- [System Architecture](./docs/02_Development/01_Architecture/01_System_Architecture.md)
- [API Design](./docs/02_Development/01_Architecture/02_API_Design.md)
- [Data Flow](./docs/02_Development/01_Architecture/03_Data_Flow.md)

#### Development Guides
- [Setting Up Development Environment](./docs/02_Development/02_Guides/01_Development_Environment.md)
- [Creating a New Feature](./docs/02_Development/02_Guides/02_Creating_Features.md)
- [API Development](./docs/02_Development/02_Guides/03_API_Development.md)
- [Testing](./docs/02_Development/02_Guides/04_Testing.md)

### API Reference

- [REST API](./docs/03_API/01_REST_API.md)
- [WebSocket API](./docs/03_API/02_WebSocket_API.md)
- [Webhooks](./docs/03_API/03_Webhooks.md)
- [Authentication](./docs/03_API/04_Authentication.md)

### Deployment

- [Local Development](./docs/04_Deployment/01_Local_Development.md)
- [Docker Deployment](./docs/04_Deployment/02_Docker_Deployment.md)
- [Kubernetes Deployment](./docs/04_Deployment/03_Kubernetes_Deployment.md)
- [Cloud Providers](./docs/04_Deployment/04_Cloud_Providers.md)

### Contributing

We welcome contributions! Please read our [Contributing Guidelines](./CONTRIBUTING.md) to get started.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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
