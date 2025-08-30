/**
 * Model Routes
 * 
 * API routes for model management
 */

const express = require('express');
const router = express.Router();
require('@src/api\controllers\model.controller');
require('@src/api\middleware\auth');

// Get available models
router.get('/available', authenticate, modelController.getAvailableModels);

// Get downloaded models
router.get('/downloaded', authenticate, modelController.getDownloadedModels);

// Download a model
router.post('/download/:modelId', authenticate, modelController.downloadModel);

// Delete a model
router.delete('/delete/:modelId', authenticate, modelController.deleteModel);

// Get storage usage
router.get('/storage', authenticate, modelController.getStorageUsage);

// Get model info
router.get('/info/:modelId', authenticate, modelController.getModelInfo);

module.exports = router;
