/**
 * Training Routes
 * 
 * API routes for domain-specific training
 */

const express = require('express');
const multer = require('multer');
const trainingController = require('./training.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * @swagger
 * /api/training/domains:
 *   get:
 *     summary: Get all training domains
 *     description: Retrieve a list of all available training domains with optional filtering and pagination
 *     tags: [Training]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter domains by language
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search domains by name or description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field and order (e.g., name:asc, created_at:desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of domains to return (default 20)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of domains to skip (default 0)
 *     responses:
 *       200:
 *         description: A list of domains
 *       500:
 *         description: Server error
 */
router.get('/domains', trainingController.getAllDomains);

/**
 * @swagger
 * /api/training/domains/{id}:
 *   get:
 *     summary: Get domain by ID
 *     description: Retrieve a single training domain by its ID
 *     tags: [Training]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain ID
 *     responses:
 *       200:
 *         description: Domain details
 *       404:
 *         description: Domain not found
 *       500:
 *         description: Server error
 */
router.get('/domains/:id', trainingController.getDomainById);

/**
 * @swagger
 * /api/training/domains:
 *   post:
 *     summary: Create a new training domain
 *     description: Create a new domain for training chatbots
 *     tags: [Training]
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
 *               - language
 *             properties:
 *               name:
 *                 type: string
 *                 description: Domain name
 *               description:
 *                 type: string
 *                 description: Domain description
 *               language:
 *                 type: string
 *                 description: Domain language (e.g., en, fr, es)
 *     responses:
 *       201:
 *         description: Domain created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/domains', authMiddleware, trainingController.createDomain);

/**
 * @swagger
 * /api/training/domains/{id}:
 *   put:
 *     summary: Update a training domain
 *     description: Update an existing training domain by ID
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Domain name
 *               description:
 *                 type: string
 *                 description: Domain description
 *               language:
 *                 type: string
 *                 description: Domain language (e.g., en, fr, es)
 *     responses:
 *       200:
 *         description: Domain updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Domain not found
 *       500:
 *         description: Server error
 */
router.put('/domains/:id', authMiddleware, trainingController.updateDomain);

/**
 * @swagger
 * /api/training/domains/{id}:
 *   delete:
 *     summary: Delete a training domain
 *     description: Delete a training domain by ID
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain ID
 *     responses:
 *       200:
 *         description: Domain deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Domain not found
 *       500:
 *         description: Server error
 */
router.delete('/domains/:id', authMiddleware, trainingController.deleteDomain);

/**
 * @swagger
 * /api/training/datasets:
 *   get:
 *     summary: Get all training datasets
 *     description: Retrieve a list of all available training datasets with optional filtering and pagination
 *     tags: [Training]
 *     parameters:
 *       - in: query
 *         name: domain_id
 *         schema:
 *           type: string
 *         description: Filter datasets by domain ID
 *       - in: query
 *         name: framework
 *         schema:
 *           type: string
 *         description: Filter datasets by framework (e.g., rasa, deeppavlov, botpress)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search datasets by name or description
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field and order (e.g., name:asc, created_at:desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of datasets to return (default 20)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of datasets to skip (default 0)
 *     responses:
 *       200:
 *         description: A list of datasets
 *       500:
 *         description: Server error
 */
router.get('/datasets', trainingController.getAllDatasets);

/**
 * @swagger
 * /api/training/datasets/{id}:
 *   get:
 *     summary: Get dataset by ID
 *     description: Retrieve a single training dataset by its ID
 *     tags: [Training]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     responses:
 *       200:
 *         description: Dataset details
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.get('/datasets/:id', trainingController.getDatasetById);

/**
 * @swagger
 * /api/training/datasets:
 *   post:
 *     summary: Create a new training dataset
 *     description: Create a new dataset for training chatbots
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - domain_id
 *               - framework
 *             properties:
 *               name:
 *                 type: string
 *                 description: Dataset name
 *               description:
 *                 type: string
 *                 description: Dataset description
 *               domain_id:
 *                 type: string
 *                 description: Domain ID
 *               framework:
 *                 type: string
 *                 description: Training framework (e.g., rasa, deeppavlov, botpress)
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Dataset file
 *     responses:
 *       201:
 *         description: Dataset created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/datasets', authMiddleware, upload.single('file'), trainingController.createDataset);

/**
 * @swagger
 * /api/training/datasets/{id}:
 *   put:
 *     summary: Update a training dataset
 *     description: Update an existing training dataset by ID
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Dataset name
 *               description:
 *                 type: string
 *                 description: Dataset description
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Dataset file
 *     responses:
 *       200:
 *         description: Dataset updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.put('/datasets/:id', authMiddleware, upload.single('file'), trainingController.updateDataset);

/**
 * @swagger
 * /api/training/datasets/{id}:
 *   delete:
 *     summary: Delete a training dataset
 *     description: Delete a training dataset by ID
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     responses:
 *       200:
 *         description: Dataset deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dataset not found
 *       500:
 *         description: Server error
 */
router.delete('/datasets/:id', authMiddleware, trainingController.deleteDataset);

/**
 * @swagger
 * /api/training/datasets/{id}/files/{fileName}:
 *   get:
 *     summary: Get dataset file
 *     description: Retrieve a file from a training dataset
 *     tags: [Training]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: File name
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get('/datasets/:id/files/:fileName', trainingController.getDatasetFile);

/**
 * @swagger
 * /api/training/bots/{botId}/train/{datasetId}:
 *   post:
 *     summary: Train a bot using a dataset
 *     description: Start a training job for a bot using a specific dataset
 *     tags: [Training]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *         description: Bot ID
 *       - in: path
 *         name: datasetId
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset ID
 *     responses:
 *       200:
 *         description: Training started successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bot or dataset not found
 *       500:
 *         description: Server error
 */
router.post('/bots/:botId/train/:datasetId', authMiddleware, trainingController.trainBot);

/**
 * @swagger
 * /api/training/jobs:
 *   get:
 *     summary: Get all training jobs
 *     description: Retrieve a list of all training jobs with optional filtering and pagination
 *     tags: [Training]
 *     parameters:
 *       - in: query
 *         name: bot_id
 *         schema:
 *           type: string
 *         description: Filter jobs by bot ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter jobs by status (e.g., pending, running, completed, failed)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field and order (e.g., created_at:desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Maximum number of jobs to return (default 20)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of jobs to skip (default 0)
 *     responses:
 *       200:
 *         description: A list of training jobs
 *       500:
 *         description: Server error
 */
router.get('/jobs', trainingController.getAllTrainingJobs);

/**
 * @swagger
 * /api/training/jobs/{id}:
 *   get:
 *     summary: Get training job by ID
 *     description: Retrieve a single training job by its ID
 *     tags: [Training]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Training job ID
 *     responses:
 *       200:
 *         description: Training job details
 *       404:
 *         description: Training job not found
 *       500:
 *         description: Server error
 */
router.get('/jobs/:id', trainingController.getTrainingJobById);

/**
 * @swagger
 * /api/training/frameworks:
 *   get:
 *     summary: Get available training frameworks
 *     description: Retrieve a list of all available training frameworks
 *     tags: [Training]
 *     responses:
 *       200:
 *         description: A list of training frameworks
 *       500:
 *         description: Server error
 */
router.get('/frameworks', trainingController.getFrameworks);

module.exports = router;
