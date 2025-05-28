/**
 * Swagger UI Setup
 * 
 * This file sets up the Swagger UI for API documentation
 */

// Import Swagger documentation files
const authDocs = require('./auth');
const healthDocs = require('./health');
const usageDocs = require('./usage');
const scalingDocs = require('./scaling');

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../../config/swagger');

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
