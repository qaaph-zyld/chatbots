/**
 * Webhook routes for the Chatbots Platform
 * Handles webhook management API endpoints
 */
const express = require('express');
const router = express.Router();
require('@src/api\webhooks\webhook.service');
require('@src/api\webhooks\webhook.model');
require('@src/middleware\auth');
require('@src/middleware\validation');
require('@src/utils\logger');

const logger = createLogger('webhook-routes');

/**
 * @swagger
 * tags:
 *   name: Webhooks
 *   description: Webhook management endpoints
 */

/**
 * @swagger
 * /webhooks:
 *   get:
 *     summary: Get all webhooks
 *     description: Retrieve all webhooks for the authenticated user
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: event
 *         schema:
 *           type: string
 *           enum: [conversation.created, conversation.updated, conversation.deleted, message.created, message.updated, message.deleted, chatbot.created, chatbot.updated, chatbot.deleted, chatbot.trained, chatbot.deployed, user.created, user.updated, user.deleted, user.login, user.logout]
 *         description: Filter by event type
 *     responses:
 *       200:
 *         description: A list of webhooks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Webhook'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const filters = {};
    
    if (req.query.active !== undefined) {
      filters.active = req.query.active === 'true';
    }
    
    if (req.query.event) {
      filters.event = req.query.event;
    }
    
    const webhooks = await webhookService.getWebhooks(req.user.id, filters);
    
    res.status(200).json({
      status: 'success',
      data: webhooks
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /webhooks/{id}:
 *   get:
 *     summary: Get webhook by ID
 *     description: Retrieve a specific webhook by its ID
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID
 *     responses:
 *       200:
 *         description: Webhook details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const webhook = await webhookService.getWebhookById(req.params.id, req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: webhook
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Create a new webhook
 *     description: Create a new webhook configuration
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Webhook
 *               url:
 *                 type: string
 *                 example: https://example.com/webhook
 *               description:
 *                 type: string
 *                 example: Webhook for conversation events
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [conversation.created, conversation.updated, conversation.deleted, message.created, message.updated, message.deleted, chatbot.created, chatbot.updated, chatbot.deleted, chatbot.trained, chatbot.deployed, user.created, user.updated, user.deleted, user.login, user.logout]
 *                 example: [conversation.created, message.created]
 *               headers:
 *                 type: object
 *                 example: { "X-Custom-Header": "custom-value" }
 *               active:
 *                 type: boolean
 *                 example: true
 *               retryConfig:
 *                 type: object
 *                 properties:
 *                   maxRetries:
 *                     type: number
 *                     example: 3
 *                   retryInterval:
 *                     type: number
 *                     example: 60000
 *               filterConfig:
 *                 type: object
 *                 properties:
 *                   conditions:
 *                     type: object
 *                     example: { "data.userId": "123456" }
 *     responses:
 *       201:
 *         description: Webhook created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', authenticate, validateRequest({
  body: {
    name: { type: 'string', required: true },
    url: { type: 'string', required: true },
    description: { type: 'string', optional: true },
    events: { 
      type: 'array', 
      required: true,
      items: { 
        type: 'string',
        enum: EVENT_TYPES
      }
    },
    headers: { type: 'object', optional: true },
    active: { type: 'boolean', optional: true },
    retryConfig: {
      type: 'object',
      optional: true,
      properties: {
        maxRetries: { type: 'number', optional: true },
        retryInterval: { type: 'number', optional: true }
      }
    },
    filterConfig: {
      type: 'object',
      optional: true,
      properties: {
        conditions: { type: 'object', optional: true }
      }
    }
  }
}), async (req, res, next) => {
  try {
    // Convert headers object to Map if provided
    if (req.body.headers) {
      const headersMap = new Map();
      Object.entries(req.body.headers).forEach(([key, value]) => {
        headersMap.set(key, value);
      });
      req.body.headers = headersMap;
    }
    
    const webhook = await webhookService.createWebhook(req.body, req.user.id);
    
    res.status(201).json({
      status: 'success',
      data: webhook
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /webhooks/{id}:
 *   put:
 *     summary: Update a webhook
 *     description: Update an existing webhook configuration
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Webhook
 *               url:
 *                 type: string
 *                 example: https://example.com/updated-webhook
 *               description:
 *                 type: string
 *                 example: Updated webhook description
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [conversation.created, conversation.updated, conversation.deleted, message.created, message.updated, message.deleted, chatbot.created, chatbot.updated, chatbot.deleted, chatbot.trained, chatbot.deployed, user.created, user.updated, user.deleted, user.login, user.logout]
 *                 example: [conversation.created, message.created, message.updated]
 *               headers:
 *                 type: object
 *                 example: { "X-Custom-Header": "updated-value" }
 *               active:
 *                 type: boolean
 *                 example: true
 *               retryConfig:
 *                 type: object
 *                 properties:
 *                   maxRetries:
 *                     type: number
 *                     example: 5
 *                   retryInterval:
 *                     type: number
 *                     example: 30000
 *               filterConfig:
 *                 type: object
 *                 properties:
 *                   conditions:
 *                     type: object
 *                     example: { "data.type": "important" }
 *     responses:
 *       200:
 *         description: Webhook updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Webhook'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', authenticate, validateRequest({
  body: {
    name: { type: 'string', optional: true },
    url: { type: 'string', optional: true },
    description: { type: 'string', optional: true },
    events: { 
      type: 'array', 
      optional: true,
      items: { 
        type: 'string',
        enum: EVENT_TYPES
      }
    },
    headers: { type: 'object', optional: true },
    active: { type: 'boolean', optional: true },
    retryConfig: {
      type: 'object',
      optional: true,
      properties: {
        maxRetries: { type: 'number', optional: true },
        retryInterval: { type: 'number', optional: true }
      }
    },
    filterConfig: {
      type: 'object',
      optional: true,
      properties: {
        conditions: { type: 'object', optional: true }
      }
    }
  }
}), async (req, res, next) => {
  try {
    // Convert headers object to Map if provided
    if (req.body.headers) {
      const headersMap = new Map();
      Object.entries(req.body.headers).forEach(([key, value]) => {
        headersMap.set(key, value);
      });
      req.body.headers = headersMap;
    }
    
    const webhook = await webhookService.updateWebhook(req.params.id, req.body, req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: webhook
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     description: Delete an existing webhook configuration
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID
 *     responses:
 *       204:
 *         description: Webhook deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await webhookService.deleteWebhook(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /webhooks/{id}/regenerate-secret:
 *   post:
 *     summary: Regenerate webhook secret
 *     description: Generate a new secret for the webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID
 *     responses:
 *       200:
 *         description: Secret regenerated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     secret:
 *                       type: string
 *                       example: 5f8d7a3c9b2e1d6f4a7c8b9d0e3f2a1
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/regenerate-secret', authenticate, async (req, res, next) => {
  try {
    const webhook = await webhookService.regenerateSecret(req.params.id, req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        secret: webhook.secret
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /webhooks/{id}/test:
 *   post:
 *     summary: Test a webhook
 *     description: Send a test event to the webhook
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook ID
 *     responses:
 *       200:
 *         description: Test result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     delivery:
 *                       type: object
 *                       properties:
 *                         success:
 *                           type: boolean
 *                           example: true
 *                         statusCode:
 *                           type: number
 *                           example: 200
 *                         duration:
 *                           type: number
 *                           example: 123
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/test', authenticate, async (req, res, next) => {
  try {
    const result = await webhookService.testWebhook(req.params.id, req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /webhooks/events:
 *   get:
 *     summary: Get available event types
 *     description: Retrieve a list of all available webhook event types
 *     tags: [Webhooks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of event types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [conversation.created, message.created]
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/events', authenticate, (req, res) => {
  res.status(200).json({
    status: 'success',
    data: EVENT_TYPES
  });
});

// Add Swagger schema for Webhook
/**
 * @swagger
 * components:
 *   schemas:
 *     Webhook:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 60d21b4667d0d8992e610c85
 *         name:
 *           type: string
 *           example: My Webhook
 *         url:
 *           type: string
 *           example: https://example.com/webhook
 *         description:
 *           type: string
 *           example: Webhook for conversation events
 *         events:
 *           type: array
 *           items:
 *             type: string
 *           example: [conversation.created, message.created]
 *         secret:
 *           type: string
 *           example: 5f8d7a3c9b2e1d6f4a7c8b9d0e3f2a1
 *         active:
 *           type: boolean
 *           example: true
 *         createdBy:
 *           type: string
 *           example: 60d21b4667d0d8992e610c85
 *         retryConfig:
 *           type: object
 *           properties:
 *             maxRetries:
 *               type: number
 *               example: 3
 *             retryInterval:
 *               type: number
 *               example: 60000
 *         filterConfig:
 *           type: object
 *           properties:
 *             conditions:
 *               type: object
 *               example: { "data.userId": "123456" }
 *         stats:
 *           type: object
 *           properties:
 *             totalDeliveries:
 *               type: number
 *               example: 10
 *             successfulDeliveries:
 *               type: number
 *               example: 8
 *             failedDeliveries:
 *               type: number
 *               example: 2
 *             lastDeliveryAttempt:
 *               type: string
 *               format: date-time
 *             lastSuccessfulDelivery:
 *               type: string
 *               format: date-time
 *             lastFailedDelivery:
 *               type: string
 *               format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

module.exports = router;
