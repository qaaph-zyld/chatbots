# Chatbot Platform

A modern, flexible platform for creating and deploying customizable chatbots with advanced AI capabilities.

## 🚀 Features

- **Modular Architecture**: Clean, maintainable codebase with feature-based organization
- **Multiple Engines**: Support for different chatbot engines (OpenAI, Hugging Face, etc.)
- **RESTful API**: Comprehensive API for chatbot management
- **Authentication**: JWT-based authentication and authorization
- **Analytics**: Built-in analytics and reporting
- **Scalable**: Designed for horizontal scaling
- **Terminal Timeout System**: Prevents hanging commands in development

## 📁 Project Structure

```
src_new/
├── core/                    # Core platform functionality
│   ├── engine/             # Chatbot engine abstractions
│   ├── interfaces/         # Type definitions and interfaces
│   └── services/           # Core services (logger, config)
├── features/               # Feature-based modules
│   ├── chatbot/           # Chatbot management
│   ├── conversation/      # Conversation handling
│   ├── analytics/         # Analytics and reporting
│   └── sentiment/         # Sentiment analysis
├── infrastructure/        # Infrastructure concerns
│   ├── database/          # Database connections
│   ├── middleware/        # Express middleware
│   └── utils/            # Shared utilities
└── api/                  # API layer
    ├── routes/           # Route definitions
    └── app.js           # Main application entry point
```

## 🛠️ Installation

### Prerequisites
- Node.js 16+ and npm 8+
- MongoDB database
- Redis cache (optional but recommended)

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd chatbots

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment variables
# Edit .env file with your database URLs, API keys, etc.

# Start development server
npm run dev
```

## 🔧 Configuration

Create a `.env` file with the following variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/chatbots
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
```

## 📚 API Documentation

The API provides endpoints for:
- Chatbot management (CRUD operations)
- Message processing
- Conversation handling
- Analytics and reporting

See [API.md](docs_new/API.md) for detailed endpoint documentation.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
docker build -t chatbot-platform .
docker run -p 3000:3000 chatbot-platform
```

See [DEPLOYMENT.md](docs_new/DEPLOYMENT.md) for detailed deployment instructions.

## 🏗️ Architecture

The platform follows a clean, layered architecture:
- **API Layer**: HTTP request handling
- **Feature Layer**: Business logic
- **Core Layer**: Shared services
- **Infrastructure Layer**: External concerns

See [ARCHITECTURE.md](docs_new/ARCHITECTURE.md) for detailed architecture documentation.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs_new/CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

For security issues, please email [security@example.com] instead of creating public issues.

## 📞 Support

- Documentation: [docs_new/](docs_new/)
- Issues: [GitHub Issues](https://github.com/Pavleee23/chatbots/issues)
- Discussions: [GitHub Discussions](https://github.com/Pavleee23/chatbots/discussions)
