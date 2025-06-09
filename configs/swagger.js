/**
 * Swagger Configuration
 * 
 * This file configures the Swagger/OpenAPI documentation for the API
 */

const swaggerJSDoc = require('swagger-jsdoc');
const config = require('../../config');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Chatbots Platform API',
    version: config.common.version,
    description: 'API documentation for the Customizable Chatbots Platform',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'API Support',
      url: 'https://chatbots-platform.com/support',
      email: 'support@chatbots-platform.com',
    },
  },
  servers: [
    {
      url: config.common.baseUrl + config.api.prefix,
      description: `${config.env.charAt(0).toUpperCase() + config.env.slice(1)} Server`,
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'error',
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '60d21b4667d0d8992e610c85',
          },
          username: {
            type: 'string',
            example: 'johndoe',
          },
          email: {
            type: 'string',
            example: 'john.doe@example.com',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          role: {
            type: 'string',
            enum: ['user', 'admin'],
            example: 'user',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Chatbot: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '60d21b4667d0d8992e610c86',
          },
          name: {
            type: 'string',
            example: 'Customer Support Bot',
          },
          description: {
            type: 'string',
            example: 'A chatbot for handling customer support inquiries',
          },
          engine: {
            type: 'string',
            enum: ['botpress', 'huggingface', 'openai'],
            example: 'openai',
          },
          defaultPersonalityId: {
            type: 'string',
            example: '60d21b4667d0d8992e610c87',
          },
          createdBy: {
            type: 'string',
            example: '60d21b4667d0d8992e610c85',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Personality: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '60d21b4667d0d8992e610c87',
          },
          name: {
            type: 'string',
            example: 'Friendly Assistant',
          },
          description: {
            type: 'string',
            example: 'A friendly and helpful assistant personality',
          },
          traits: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['friendly', 'helpful', 'patient'],
          },
          tone: {
            type: 'string',
            example: 'casual',
          },
          languageStyle: {
            type: 'string',
            example: 'conversational',
          },
          chatbotId: {
            type: 'string',
            example: '60d21b4667d0d8992e610c86',
          },
          isDefault: {
            type: 'boolean',
            example: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      KnowledgeBase: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '60d21b4667d0d8992e610c88',
          },
          name: {
            type: 'string',
            example: 'Product Knowledge',
          },
          description: {
            type: 'string',
            example: 'Knowledge base for product information',
          },
          chatbotId: {
            type: 'string',
            example: '60d21b4667d0d8992e610c86',
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  example: '60d21b4667d0d8992e610c89',
                },
                title: {
                  type: 'string',
                  example: 'Product Features',
                },
                content: {
                  type: 'string',
                  example: 'Our product offers the following features...',
                },
                tags: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['features', 'product'],
                },
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Plugin: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '60d21b4667d0d8992e610c90',
          },
          name: {
            type: 'string',
            example: 'Sentiment Analysis',
          },
          description: {
            type: 'string',
            example: 'Analyzes sentiment in user messages',
          },
          version: {
            type: 'string',
            example: '1.0.0',
          },
          author: {
            type: 'string',
            example: 'Chatbots Platform',
          },
          hooks: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['pre-process', 'post-process'],
          },
          config: {
            type: 'object',
            example: {
              enabled: true,
              threshold: 0.5,
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: '60d21b4667d0d8992e610c91',
          },
          conversationId: {
            type: 'string',
            example: '60d21b4667d0d8992e610c92',
          },
          role: {
            type: 'string',
            enum: ['user', 'assistant'],
            example: 'user',
          },
          content: {
            type: 'string',
            example: 'Hello, how can you help me today?',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          metadata: {
            type: 'object',
            example: {
              sentiment: 'positive',
              intent: 'greeting',
            },
          },
        },
      },
      Context: {
        type: 'object',
        properties: {
          chatbotId: {
            type: 'string',
            example: '60d21b4667d0d8992e610c86',
          },
          userId: {
            type: 'string',
            example: '60d21b4667d0d8992e610c85',
          },
          conversationId: {
            type: 'string',
            example: '60d21b4667d0d8992e610c92',
          },
          entities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'product',
                },
                value: {
                  type: 'string',
                  example: 'Chatbot Builder Pro',
                },
                messageId: {
                  type: 'string',
                  example: '60d21b4667d0d8992e610c91',
                },
              },
            },
          },
          topics: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  example: 'product features',
                },
                confidence: {
                  type: 'number',
                  example: 0.85,
                },
                active: {
                  type: 'boolean',
                  example: true,
                },
              },
            },
          },
          references: {
            type: 'object',
            example: {
              'it': 'Chatbot Builder Pro',
              'they': 'features',
            },
          },
          lastUpdated: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Unauthorized',
              code: 'UNAUTHORIZED',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'User does not have permission to access this resource',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Forbidden',
              code: 'FORBIDDEN',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Resource not found',
              code: 'NOT_FOUND',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Validation error',
              code: 'VALIDATION_ERROR',
              errors: [
                {
                  field: 'name',
                  message: 'Name is required',
                },
              ],
            },
          },
        },
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              status: 'error',
              message: 'Internal server error',
              code: 'SERVER_ERROR',
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
    {
      apiKeyAuth: [],
    },
  ],
  tags: [
    {
      name: 'Auth',
      description: 'Authentication and user management endpoints',
    },
    {
      name: 'Chatbots',
      description: 'Chatbot management endpoints',
    },
    {
      name: 'Conversations',
      description: 'Conversation and messaging endpoints',
    },
    {
      name: 'Personalities',
      description: 'Personality management endpoints',
    },
    {
      name: 'Knowledge Bases',
      description: 'Knowledge base management endpoints',
    },
    {
      name: 'Plugins',
      description: 'Plugin management endpoints',
    },
    {
      name: 'Training',
      description: 'Training management endpoints',
    },
    {
      name: 'Analytics',
      description: 'Analytics and insights endpoints',
    },
    {
      name: 'Context',
      description: 'Context management endpoints',
    },
    {
      name: 'Health',
      description: 'Health check and monitoring endpoints',
    },
  ],
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Path to the API docs
  apis: [
    './src/api/controllers/*.js',
    './src/api/routes.js',
    './src/api/swagger/*.js',
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
