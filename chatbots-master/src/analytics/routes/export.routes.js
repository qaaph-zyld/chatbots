/**
 * Analytics Export Routes
 * 
 * API routes for exporting analytics data
 */

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const authMiddleware = require('../../auth/middleware/auth.middleware');

/**
 * @route GET /analytics/export/formats
 * @desc Get available export formats
 * @access Private
 */
router.get('/formats', authMiddleware.authenticate, exportController.getExportFormats);

/**
 * @route POST /analytics/export/usage
 * @desc Export usage analytics data
 * @access Private
 */
router.post('/usage', authMiddleware.authenticate, exportController.exportUsageData);

/**
 * @route POST /analytics/export/users
 * @desc Export user analytics data
 * @access Private
 */
router.post('/users', authMiddleware.authenticate, exportController.exportUserData);

/**
 * @route POST /analytics/export/conversations
 * @desc Export conversation analytics data
 * @access Private
 */
router.post('/conversations', authMiddleware.authenticate, exportController.exportConversationData);

/**
 * @route GET /analytics/export/status/:jobId
 * @desc Check status of an export job
 * @access Private
 */
router.get('/status/:jobId', authMiddleware.authenticate, exportController.getExportStatus);

/**
 * @route GET /analytics/export/download/:jobId
 * @desc Download a completed export
 * @access Private
 */
router.get('/download/:jobId', authMiddleware.authenticate, exportController.downloadExport);

module.exports = router;
