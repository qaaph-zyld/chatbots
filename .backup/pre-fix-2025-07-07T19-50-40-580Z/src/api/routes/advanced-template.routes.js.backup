/**
 * Advanced Template Routes
 * 
 * API routes for advanced template operations
 */

const express = require('express');
const router = express.Router();
require('@src/api\controllers\advanced-template.controller');
require('@src/api\middlewares\auth.middleware');
require('@src/api\middlewares\validation.middleware');
const Joi = require('joi');

// Validation schemas
const createWithInheritanceSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().max(500),
  category: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  configuration: Joi.object(),
  previewImage: Joi.string().uri().allow(null),
  isPublic: Joi.boolean(),
  status: Joi.string().valid('draft', 'published', 'archived'),
  metadata: Joi.object()
});

const createCompositeSchema = Joi.object({
  sourceTemplateIds: Joi.array().items(Joi.string()).min(2).required(),
  templateData: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().max(500),
    category: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    previewImage: Joi.string().uri().allow(null),
    isPublic: Joi.boolean(),
    status: Joi.string().valid('draft', 'published', 'archived'),
    metadata: Joi.object()
  }).required(),
  compositionRules: Joi.object({
    strategy: Joi.string().valid('first-wins', 'last-wins', 'custom'),
    arrayMergeStrategy: Joi.string().valid('concat', 'unique', 'replace'),
    customResolvers: Joi.object()
  })
});

const createVersionSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  description: Joi.string().max(500),
  category: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  configuration: Joi.object(),
  previewImage: Joi.string().uri().allow(null),
  isPublic: Joi.boolean(),
  status: Joi.string().valid('draft', 'published', 'archived'),
  forkedVersion: Joi.boolean(),
  changeLog: Joi.string().max(500),
  metadata: Joi.object()
});

const applyVariablesSchema = Joi.object({
  variables: Joi.object().required()
});

const setStylingSchema = Joi.object({
  colors: Joi.object({
    primary: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    secondary: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    accent: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    background: Joi.string().regex(/^#[0-9A-F]{6}$/i),
    text: Joi.string().regex(/^#[0-9A-F]{6}$/i)
  }),
  fonts: Joi.object({
    primary: Joi.string(),
    secondary: Joi.string(),
    sizes: Joi.object({
      small: Joi.string(),
      medium: Joi.string(),
      large: Joi.string()
    })
  }),
  spacing: Joi.object({
    small: Joi.string(),
    medium: Joi.string(),
    large: Joi.string()
  }),
  borderRadius: Joi.string(),
  shadows: Joi.object({
    small: Joi.string(),
    medium: Joi.string(),
    large: Joi.string()
  }),
  animations: Joi.object({
    transition: Joi.string(),
    duration: Joi.string()
  }),
  customCSS: Joi.string().max(10000),
  layout: Joi.object({
    width: Joi.string(),
    height: Joi.string(),
    position: Joi.string()
  })
}).min(1);

// Routes
/**
 * @swagger
 * /api/advanced-templates/inherit/{parentTemplateId}:
 *   post:
 *     summary: Create a template that inherits from a parent template
 *     tags: [Advanced Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentTemplateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the parent template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTemplateWithInheritanceRequest'
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Parent template not found
 *       500:
 *         description: Server error
 */
router.post(
  '/inherit/:parentTemplateId',
  authenticate,
  validateRequest(createWithInheritanceSchema),
  advancedTemplateController.createTemplateWithInheritance
);

/**
 * @swagger
 * /api/advanced-templates/composite:
 *   post:
 *     summary: Create a composite template from multiple source templates
 *     tags: [Advanced Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompositeTemplateRequest'
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: One or more source templates not found
 *       500:
 *         description: Server error
 */
router.post(
  '/composite',
  authenticate,
  validateRequest(createCompositeSchema),
  advancedTemplateController.createCompositeTemplate
);

/**
 * @swagger
 * /api/advanced-templates/{templateId}/version:
 *   post:
 *     summary: Create a new version of a template
 *     tags: [Advanced Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTemplateVersionRequest'
 *     responses:
 *       201:
 *         description: Template version created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:templateId/version',
  authenticate,
  validateRequest(createVersionSchema),
  advancedTemplateController.createTemplateVersion
);

/**
 * @swagger
 * /api/advanced-templates/{templateId}/variables:
 *   post:
 *     summary: Apply variables to a template
 *     tags: [Advanced Templates]
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApplyTemplateVariablesRequest'
 *     responses:
 *       200:
 *         description: Variables applied successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:templateId/variables',
  validateRequest(applyVariablesSchema),
  advancedTemplateController.applyTemplateVariables
);

/**
 * @swagger
 * /api/advanced-templates/{templateId}/variables/schema:
 *   get:
 *     summary: Get template variables schema
 *     tags: [Advanced Templates]
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the template
 *     responses:
 *       200:
 *         description: Variables schema retrieved successfully
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:templateId/variables/schema',
  advancedTemplateController.getTemplateVariablesSchema
);

/**
 * @swagger
 * /api/advanced-templates/{templateId}/styling:
 *   put:
 *     summary: Set template styling
 *     tags: [Advanced Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the template
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetTemplateStylingRequest'
 *     responses:
 *       200:
 *         description: Styling set successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:templateId/styling',
  authenticate,
  validateRequest(setStylingSchema),
  advancedTemplateController.setTemplateStyling
);

/**
 * @swagger
 * /api/advanced-templates:
 *   get:
 *     summary: Get templates with advanced filtering
 *     tags: [Advanced Templates]
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
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated list of categories
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags
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
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: official
 *         schema:
 *           type: boolean
 *         description: Filter by official status
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: hasVariables
 *         schema:
 *           type: boolean
 *         description: Filter templates with variables
 *       - in: query
 *         name: hasStyling
 *         schema:
 *           type: boolean
 *         description: Filter templates with styling
 *       - in: query
 *         name: isComposite
 *         schema:
 *           type: boolean
 *         description: Filter composite templates
 *       - in: query
 *         name: isInherited
 *         schema:
 *           type: boolean
 *         description: Filter inherited templates
 *       - in: query
 *         name: minVersion
 *         schema:
 *           type: integer
 *         description: Minimum version number
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  advancedTemplateController.getTemplatesAdvanced
);

module.exports = router;
