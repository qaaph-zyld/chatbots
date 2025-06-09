/**
 * Model Manager Routes
 * 
 * API routes for managing voice models.
 */

const express = require('express');
const router = express.Router();
require('@src/controllers\model-manager.controller');

/**
 * @route GET /api/model-manager/status
 * @desc Get model status
 * @access Private
 */
router.get('/status', modelManagerController.getModelStatus);

/**
 * @route GET /api/model-manager/available
 * @desc Get available models
 * @access Private
 */
router.get('/available', modelManagerController.getAvailableModels);

/**
 * @route GET /api/model-manager/installed
 * @desc Get installed models
 * @access Private
 */
router.get('/installed', modelManagerController.getInstalledModels);

/**
 * @route POST /api/model-manager/download
 * @desc Download model
 * @access Private
 */
router.post('/download', modelManagerController.downloadModel);

/**
 * @route DELETE /api/model-manager/:type/:modelId
 * @desc Delete model
 * @access Private
 */
router.delete('/:type/:modelId', modelManagerController.deleteModel);

/**
 * @route GET /api/model-manager/progress/:type/:modelId
 * @desc Get model download progress
 * @access Private
 */
router.get('/progress/:type/:modelId', modelManagerController.getModelDownloadProgress);

/**
 * @route POST /api/model-manager/dependencies
 * @desc Install dependencies
 * @access Private
 */
router.post('/dependencies', modelManagerController.installDependencies);

/**
 * @route GET /api/model-manager/disk-usage
 * @desc Get model disk usage
 * @access Private
 */
router.get('/disk-usage', modelManagerController.getModelDiskUsage);

module.exports = router;
