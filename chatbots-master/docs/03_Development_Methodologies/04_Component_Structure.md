# Component Structure

This document outlines the component structure and organization for the Chatbots project, aligned with the `dev_framework` principles.

## Overview

The Chatbots platform is built using a modular component architecture that promotes reusability, maintainability, and testability. This document describes the structure and organization of components across the frontend and backend systems.

## Component Design Principles

### 1. Single Responsibility

Each component should have a single responsibility and reason to change. This promotes:
- Focused, maintainable code
- Easier testing
- Better reusability

### 2. Encapsulation

Components should encapsulate their implementation details and expose a clear interface:
- Hide internal state and implementation
- Provide well-defined APIs
- Minimize dependencies between components

### 3. Composability

Components should be designed to work together through composition:
- Small, focused components that can be combined
- Clear parent-child relationships
- Props/configuration passed down, events bubbled up

### 4. Reusability

Components should be designed for reuse across the application:
- Parameterized through props/configuration
- Minimal coupling to specific contexts
- Well-documented usage patterns

## Frontend Component Structure

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      App Container                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
┌───────────▼───────┐ ┌─────▼─────┐ ┌───────▼───────┐
│     Layouts       │ │  Pages    │ │  Navigation   │
└───────────┬───────┘ └─────┬─────┘ └───────┬───────┘
            │               │               │
┌───────────▼───────┐ ┌─────▼─────┐ ┌───────▼───────┐
│   UI Components   │ │ Features  │ │   Services    │
└───────────────────┘ └───────────┘ └───────────────┘
```

### Component Types

#### 1. UI Components

Basic, presentational components with minimal business logic:

- **Atoms**: Smallest UI elements (buttons, inputs, icons)
- **Molecules**: Simple combinations of atoms (form fields, cards)
- **Organisms**: Complex UI sections (headers, forms, chat windows)

#### 2. Container Components

Components that manage state and business logic:

- **Feature Containers**: Implement specific features
- **Page Containers**: Manage page-level state and layout
- **App Container**: Top-level application state and routing

#### 3. HOCs and Hooks

Reusable logic that can be shared across components:

- **Higher-Order Components**: Enhance components with additional functionality
- **Custom Hooks**: Encapsulate and reuse stateful logic

### Directory Structure

```
/src
├── components/
│   ├── ui/
│   │   ├── atoms/
│   │   │   ├── Button/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Button.test.jsx
│   │   │   │   └── Button.module.css
│   │   │   ├── Input/
│   │   │   └── Icon/
│   │   ├── molecules/
│   │   │   ├── FormField/
│   │   │   ├── Card/
│   │   │   └── ChatBubble/
│   │   └── organisms/
│   │       ├── Header/
│   │       ├── ChatWindow/
│   │       └── SettingsPanel/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   ├── chat/
│   │   └── admin/
│   ├── layouts/
│   │   ├── MainLayout/
│   │   ├── AdminLayout/
│   │   └── AuthLayout/
│   └── pages/
│       ├── Home/
│       ├── Login/
│       └── Dashboard/
├── hooks/
│   ├── useApi.js
│   ├── useForm.js
│   └── useLocalStorage.js
├── services/
│   ├── api.js
│   ├── auth.js
│   └── chatbot.js
└── utils/
    ├── formatting.js
    ├── validation.js
    └── helpers.js
```

### Component File Structure

Each component should be organized as follows:

```
/ComponentName
├── ComponentName.jsx       # Component implementation
├── ComponentName.test.jsx  # Component tests
├── ComponentName.module.css # Component styles
├── index.js                # Re-export for easier imports
└── README.md               # Component documentation
```

## Backend Component Structure

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
┌───────────▼───────┐ ┌─────▼─────┐ ┌───────▼───────┐
│  Auth Service     │ │ Chat Svc  │ │  Admin Svc    │
└───────────────────┘ └───────────┘ └───────────────┘
```

### Component Types

#### 1. Controllers

Handle HTTP requests and responses:

- Route definition and parameter validation
- Request parsing and response formatting
- Delegating business logic to services

#### 2. Services

Implement business logic:

- Core application functionality
- Orchestration of multiple repositories/models
- Transaction management

#### 3. Repositories

Handle data access:

- Database operations
- Data mapping and transformation
- Query optimization

#### 4. Models

Define data structures:

- Schema definition
- Validation rules
- Business rules tied to data

#### 5. Middleware

Cross-cutting concerns:

- Authentication and authorization
- Logging and monitoring
- Error handling
- Request/response transformation

### Directory Structure

```
/src
├── api/
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── chat.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── chat.controller.js
│   │   └── admin.controller.js
│   └── middleware/
│       ├── auth.middleware.js
│       ├── validation.middleware.js
│       └── error.middleware.js
├── services/
│   ├── auth.service.js
│   ├── chat.service.js
│   └── admin.service.js
├── repositories/
│   ├── user.repository.js
│   ├── conversation.repository.js
│   └── bot.repository.js
├── models/
│   ├── user.model.js
│   ├── conversation.model.js
│   └── bot.model.js
├── utils/
│   ├── logger.js
│   ├── errors.js
│   └── helpers.js
└── config/
    ├── database.js
    ├── auth.js
    └── app.js
```

## Shared Component Structure

### Common Code

Code shared between frontend and backend:

```
/shared
├── constants/
│   ├── errorCodes.js
│   ├── statusCodes.js
│   └── entityTypes.js
├── validation/
│   ├── schemas/
│   └── validators.js
└── utils/
    ├── formatting.js
    └── helpers.js
```

### API Contract

Shared API definitions:

```
/api-contract
├── schemas/
│   ├── user.schema.json
│   ├── conversation.schema.json
│   └── bot.schema.json
├── endpoints/
│   ├── auth.yaml
│   ├── chat.yaml
│   └── admin.yaml
└── openapi.yaml
```

## Component Communication Patterns

### Frontend Communication

- **Props**: Parent to child component communication
- **Context API**: Shared state without prop drilling
- **Events**: Child to parent communication
- **Redux/State Management**: Global state management
- **Custom Events**: Cross-component communication

### Backend Communication

- **REST APIs**: Synchronous service-to-service communication
- **Message Queue**: Asynchronous communication
- **Event Bus**: Publish-subscribe pattern
- **GraphQL**: Data fetching for complex queries
- **WebSockets**: Real-time bidirectional communication

## Component Documentation

### Documentation Requirements

Each component should include:

1. **Purpose**: What the component does
2. **Props/Parameters**: Input parameters with types and descriptions
3. **Returns/Renders**: What the component returns or renders
4. **Dependencies**: External dependencies and requirements
5. **Usage Examples**: How to use the component
6. **Edge Cases**: Known limitations or special considerations

### Example Component Documentation

```jsx
/**
 * ChatMessage Component
 * 
 * Displays a single message in the chat interface with appropriate styling
 * based on the sender type (user, bot, system).
 * 
 * @component
 * @example
 * <ChatMessage
 *   text="Hello, how can I help you today?"
 *   sender="bot"
 *   timestamp={new Date()}
 *   status="delivered"
 * />
 */
function ChatMessage({ text, sender, timestamp, status, attachments = [] }) {
  // Implementation
}

ChatMessage.propTypes = {
  /** The message text content */
  text: PropTypes.string.isRequired,
  /** Who sent the message: 'user', 'bot', or 'system' */
  sender: PropTypes.oneOf(['user', 'bot', 'system']).isRequired,
  /** When the message was sent */
  timestamp: PropTypes.instanceOf(Date).isRequired,
  /** Current status of the message */
  status: PropTypes.oneOf(['sending', 'delivered', 'read', 'failed']),
  /** Optional attachments for the message */
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    })
  ),
};

export default ChatMessage;
```

## Component Testing

### Testing Strategies

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **Snapshot Tests**: Verify UI components render correctly
- **Visual Regression Tests**: Ensure visual consistency

### Test Organization

Tests should be co-located with components:

```
/Button
├── Button.jsx
├── Button.test.jsx  # Unit tests
├── Button.stories.jsx  # Storybook stories
└── Button.module.css
```

## Component Versioning and Deprecation

### Versioning Strategy

- Follow semantic versioning for shared components
- Document breaking changes clearly
- Provide migration guides for major version changes

### Deprecation Process

1. Mark component as deprecated with `@deprecated` tag
2. Provide alternative component or approach
3. Maintain deprecated component for a grace period
4. Remove component after grace period

## Related Documentation

- [ARCHITECTURE_PATTERNS.md](./02_Architecture_Patterns.md) - Overall architectural patterns
- [CODE_STANDARDS.md](./01_Code_Standards.md) - Coding standards and style guidelines
- [API_DESIGN.md](./03_API_Design.md) - API design principles and standards
