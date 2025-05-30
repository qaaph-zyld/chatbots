/**
 * External REST API Router
 * 
 * This module provides a dedicated REST API for external access to the Chatbots Platform.
 * It follows the API versioning strategy outlined in the API_VERSIONING.md document.
 */

const express = require('express');
const router = express.Router();
const { authenticateApiKey, rateLimit } = require('../../auth/auth.middleware');

// Import versioned API routers
const v1Router = require('./v1');

// API documentation
/**
 * @swagger
 * tags:
 *   name: External API
 *   description: External REST API endpoints for integrating with the Chatbots Platform
 */

// Default to latest version (v1)
router.use('/', authenticateApiKey, rateLimit(100, 60000), v1Router);

// Explicit version routing
router.use('/v1', authenticateApiKey, rateLimit(100, 60000), v1Router);

// Version discovery endpoint
/**
 * @swagger
 * /external:
 *   get:
 *     summary: Get API version information
 *     tags: [External API]
 *     responses:
 *       200:
 *         description: API version information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 versions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       version:
 *                         type: string
 *                       status:
 *                         type: string
 *                       url:
 *                         type: string
 *                 latest:
 *                   type: string
 *                 current:
 *                   type: string
 */
router.get('/', (req, res) => {
  // Return available API versions
  res.json({
    versions: [
      {
        version: 'v1',
        status: 'stable',
        url: `${req.protocol}://${req.get('host')}/api/external/v1`
      }
    ],
    latest: 'v1',
    current: 'v1'
  });
});

module.exports = router;
