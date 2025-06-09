/**
 * Swagger UI Setup
 * 
 * This file sets up the Swagger UI for API documentation
 */

// Import Swagger documentation files
require('@src/api\swagger\auth');
require('@src/api\swagger\health');
require('@src/api\swagger\usage');
require('@src/api\swagger\scaling');

const express = require('express');
const swaggerUi = require('swagger-ui-express');
require('@src/config\swagger');

const router = express.Router();

// Serve Swagger documentation
router.use('/api-docs', swaggerUi.serve);
router.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Chatbots Platform API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha',
  },
}));

// Serve Swagger spec as JSON
router.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

module.exports = router;
