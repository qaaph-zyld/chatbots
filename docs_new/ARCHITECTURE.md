# Architecture Documentation

## Overview
The Chatbot Platform follows a clean, modular architecture with clear separation of concerns.

## Directory Structure
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

## Architecture Principles

### 1. Layered Architecture
- **API Layer**: HTTP request handling and routing
- **Feature Layer**: Business logic and domain models
- **Core Layer**: Shared services and abstractions
- **Infrastructure Layer**: External concerns (database, middleware)

### 2. Dependency Injection
Services are injected rather than directly instantiated, enabling better testing and flexibility.

### 3. Single Responsibility
Each module has a single, well-defined responsibility.

### 4. Interface Segregation
Clear interfaces define contracts between components.

## Core Components

### Engine System
The engine system provides pluggable chatbot engines:
- `BaseChatbotEngine`: Abstract base class
- Engine implementations extend the base class
- Engines are registered and managed by the ChatbotService

### Service Layer
Core services provide shared functionality:
- `LoggerService`: Centralized logging
- `ConfigService`: Configuration management
- `CacheService`: Caching abstraction

### Middleware Stack
- Authentication middleware for JWT validation
- Error handling middleware for consistent error responses
- Rate limiting and security middleware

## Data Flow

1. **Request** → API Routes → Controller
2. **Controller** → Service Layer → Business Logic
3. **Service** → Engine/Database → External Systems
4. **Response** ← Middleware ← Controller ← Service

## Configuration Management
- Environment-specific configurations
- Centralized configuration service
- Environment variable overrides
- Secure secret management

## Error Handling
- Centralized error handling middleware
- Structured error responses
- Comprehensive logging
- Graceful degradation

## Security
- JWT-based authentication
- Role-based authorization
- Input validation and sanitization
- Security headers via Helmet
- Rate limiting protection

## Scalability Considerations
- Stateless design for horizontal scaling
- Caching layer for performance
- Database connection pooling
- Graceful shutdown handling
