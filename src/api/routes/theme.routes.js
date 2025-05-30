/**
 * Theme Routes
 * 
 * API routes for theme operations
 */

const express = require('express');
const router = express.Router();
const themeController = require('../controllers/theme.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const Joi = require('joi');

// Validation schemas
const createThemeSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500),
  isPublic: Joi.boolean(),
  colors: Joi.object({
    primary: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    secondary: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    accent: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    background: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    text: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    error: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    success: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    warning: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    info: Joi.string().regex(/^#[0-9A-F]{6}$/i)
  }),
  typography: Joi.object({
    fontFamily: Joi.string(),
    headingFontFamily: Joi.string(),
    fontSize: Joi.string(),
    headingSizes: Joi.object({
      h1: Joi.string(),
      h2: Joi.string(),
      h3: Joi.string(),
      h4: Joi.string(),
      h5: Joi.string(),
      h6: Joi.string()
    }),
    fontWeights: Joi.object({
      normal: Joi.number(),
      bold: Joi.number(),
      light: Joi.number()
    }),
    lineHeight: Joi.string()
  }),
  spacing: Joi.object({
    unit: Joi.string(),
    small: Joi.string(),
    medium: Joi.string(),
    large: Joi.string(),
    extraLarge: Joi.string()
  }),
  borders: Joi.object({
    radius: Joi.string(),
    width: Joi.string(),
    style: Joi.string(),
    color: Joi.string().regex(/^#[0-9A-F]{6}$/i)
  }),
  shadows: Joi.object({
    small: Joi.string(),
    medium: Joi.string(),
    large: Joi.string()
  }),
  animations: Joi.object({
    transition: Joi.string(),
    duration: Joi.string(),
    timing: Joi.string()
  }),
  layout: Joi.object({
    containerWidth: Joi.string(),
    chatWidth: Joi.string(),
    chatHeight: Joi.string(),
    chatPosition: Joi.string().valid('left', 'right', 'center')
  }),
  customCSS: Joi.string().max(10000),
  previewImage: Joi.string().uri().allow(null)
});

const updateThemeSchema = createThemeSchema.fork(['name'], schema => schema.optional());

// Routes
/**
 * @swagger
 * /api/themes:
 *   post:
 *     summary: Create a new theme
 *     tags: [Themes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateThemeRequest'
 *     responses:
 *       201:
 *         description: Theme created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  authenticate,
  validateRequest(createThemeSchema),
  themeController.createTheme
);

/**
 * @swagger
 * /api/themes/{themeId}:
 *   get:
 *     summary: Get theme by ID
 *     tags: [Themes]
 *     parameters:
 *       - in: path
 *         name: themeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the theme
 *     responses:
 *       200:
 *         description: Theme retrieved successfully
 *       404:
 *         description: Theme not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:themeId',
  themeController.getThemeById
);

/**
 * @swagger
 * /api/themes/{themeId}:
 *   put:
 *     summary: Update theme
 *     tags: [Themes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: themeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the theme
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateThemeRequest'
 *     responses:
 *       200:
 *         description: Theme updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Theme not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:themeId',
  authenticate,
  validateRequest(updateThemeSchema),
  themeController.updateTheme
);

/**
 * @swagger
 * /api/themes/{themeId}:
 *   delete:
 *     summary: Delete theme
 *     tags: [Themes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: themeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the theme
 *     responses:
 *       200:
 *         description: Theme deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Theme not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:themeId',
  authenticate,
  themeController.deleteTheme
);

/**
 * @swagger
 * /api/themes:
 *   get:
 *     summary: Get all themes
 *     tags: [Themes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: creator
 *         schema:
 *           type: string
 *         description: Creator ID
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public status
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Themes retrieved successfully
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  themeController.getThemes
);

/**
 * @swagger
 * /api/themes/chatbots/{chatbotId}/apply/{themeId}:
 *   post:
 *     summary: Apply theme to chatbot
 *     tags: [Themes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatbotId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chatbot
 *       - in: path
 *         name: themeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the theme
 *     responses:
 *       200:
 *         description: Theme applied successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Chatbot or theme not found
 *       500:
 *         description: Server error
 */
router.post(
  '/chatbots/:chatbotId/apply/:themeId',
  authenticate,
  themeController.applyThemeToChatbot
);

/**
 * @swagger
 * /api/themes/{themeId}/css:
 *   get:
 *     summary: Generate CSS from theme
 *     tags: [Themes]
 *     parameters:
 *       - in: path
 *         name: themeId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the theme
 *     responses:
 *       200:
 *         description: CSS generated successfully
 *         content:
 *           text/css:
 *             schema:
 *               type: string
 *       404:
 *         description: Theme not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:themeId/css',
  themeController.generateCSSFromTheme
);

/**
 * @swagger
 * /api/themes/defaults/create:
 *   post:
 *     summary: Create default themes
 *     tags: [Themes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default themes created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  '/defaults/create',
  authenticate,
  themeController.createDefaultThemes
);

module.exports = router;
