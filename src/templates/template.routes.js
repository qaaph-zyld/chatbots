/**
 * Template Routes
 * 
 * API routes for template management
 */

const express = require('express');
require('@src/templates\template.controller');
require('@src/middleware\auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Get all templates
 *     description: Retrieve a list of all available templates with optional filtering and pagination
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter templates by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search templates by name or description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field and order (e.g., name:asc, created_at:desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of templates to return (default 20)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of templates to skip (default 0)
 *     responses:
 *       200:
 *         description: A list of templates
 *       500:
 *         description: Server error
 */
router.get('/', templateController.getAllTemplates);

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     description: Retrieve a single template by its ID
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template details
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.get('/:id', templateController.getTemplateById);

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: Create a new template
 *     description: Create a new chatbot template
 *     tags: [Templates]
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
 *               - description
 *               - category
 *               - config
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               description:
 *                 type: string
 *                 description: Template description
 *               category:
 *                 type: string
 *                 description: Template category
 *               icon:
 *                 type: string
 *                 description: Template icon
 *               config:
 *                 type: object
 *                 description: Template configuration
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, templateController.createTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: Update a template
 *     description: Update an existing template by ID
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               description:
 *                 type: string
 *                 description: Template description
 *               category:
 *                 type: string
 *                 description: Template category
 *               icon:
 *                 type: string
 *                 description: Template icon
 *               config:
 *                 type: object
 *                 description: Template configuration
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, templateController.updateTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: Delete a template
 *     description: Delete a template by ID
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authMiddleware, templateController.deleteTemplate);

/**
 * @swagger
 * /api/templates/{templateId}/apply/{botId}:
 *   post:
 *     summary: Apply a template to a bot
 *     description: Apply a template to an existing bot with optional customizations
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bot ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personality:
 *                 type: object
 *                 description: Custom personality overrides
 *               intents:
 *                 type: array
 *                 description: Custom intents overrides
 *               responses:
 *                 type: object
 *                 description: Custom responses overrides
 *               plugins:
 *                 type: array
 *                 description: Custom plugins overrides
 *               settings:
 *                 type: object
 *                 description: Custom settings overrides
 *     responses:
 *       200:
 *         description: Template applied successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template or bot not found
 *       500:
 *         description: Server error
 */
router.post('/:templateId/apply/:botId', authMiddleware, templateController.applyTemplate);

/**
 * @swagger
 * /api/templates/{templateId}/create-bot:
 *   post:
 *     summary: Create a bot from a template
 *     description: Create a new bot using a template with optional customizations
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bot
 *             properties:
 *               bot:
 *                 type: object
 *                 required:
 *                   - name
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Bot name
 *                   description:
 *                     type: string
 *                     description: Bot description
 *               customizations:
 *                 type: object
 *                 properties:
 *                   personality:
 *                     type: object
 *                     description: Custom personality overrides
 *                   intents:
 *                     type: array
 *                     description: Custom intents overrides
 *                   responses:
 *                     type: object
 *                     description: Custom responses overrides
 *                   plugins:
 *                     type: array
 *                     description: Custom plugins overrides
 *                   settings:
 *                     type: object
 *                     description: Custom settings overrides
 *     responses:
 *       201:
 *         description: Bot created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.post('/:templateId/create-bot', authMiddleware, templateController.createBotFromTemplate);

module.exports = router;
