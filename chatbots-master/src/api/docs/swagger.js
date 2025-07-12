/**
 * Swagger configuration for the Chatbots Platform API
 * This file configures the OpenAPI/Swagger documentation
 */
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Chatbots Platform API',
    version: '1.0.0',
    description: 'API documentation for the Open-Source Chatbots Platform',
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    contact: {
      name: 'Chatbots Platform Team',
      url: 'https://github.com/example/chatbots-platform',
      email: 'support@example.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Development server',
    },
    {
      url: 'https://api.chatbots-platform.example.com/api',
      description: 'Production server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'API endpoints for user authentication and authorization',
    },
    {
      name: 'Chatbots',
      description: 'API endpoints for chatbot management and interactions',
    },
    {
      name: 'Templates',
      description: 'API endpoints for chatbot templates',
    },
    {
      name: 'Training',
      description: 'API endpoints for training chatbot models',
    },
    {
      name: 'Voice',
      description: 'API endpoints for voice processing and recognition',
    },
    {
      name: 'Health',
      description: 'API endpoints for system health monitoring',
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
        name: 'X-API-KEY',
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
          code: {
            type: 'integer',
            example: 400,
          },
          message: {
            type: 'string',
            example: 'Invalid request parameters',
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
            example: 'john.doe',
          },
          email: {
            type: 'string',
            example: 'john.doe@example.com',
          },
          fullName: {
            type: 'string',
            example: 'John Doe',
          },
          roles: {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['user', 'admin'],
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
          type: {
            type: 'string',
            enum: ['rule-based', 'ai', 'hybrid'],
            example: 'hybrid',
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'training'],
            example: 'active',
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
      HealthStatus: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['UP', 'DOWN'],
            example: 'UP',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
          service: {
            type: 'string',
            example: 'chatbots-platform',
          },
          dependencies: {
            type: 'object',
            properties: {
              mongodb: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['UP', 'DOWN'],
                    example: 'UP',
                  },
                },
              },
              redis: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['UP', 'DOWN'],
                    example: 'UP',
                  },
                },
              },
            },
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
          },
        },
      },
      BadRequestError: {
        description: 'Invalid request parameters',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
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
          },
        },
      },
    },
  },
};

// Options for the swagger docs
const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './src/api/routes/*.js',
    './src/api/health/*.js',
    './src/routes/*.js',
    './src/enterprise/security/*.js',
    './src/templates/*.js',
    './src/training/*.js',
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(options);

// Function to setup our docs
const swaggerDocs = (app, port) => {
  // Route for swagger docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Route to get swagger.json
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📝 API Documentation available at /api/docs`);
};

module.exports = { swaggerDocs };
