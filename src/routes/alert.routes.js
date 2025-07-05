/**
 * Alert Routes
 * 
 * API routes for system alerts
 */

const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');

/**
 * @route GET /alerts
 * @description Get recent system alerts
 * @access Private
 */
router.get('/', alertController.getAlerts.bind(alertController));

/**
 * @route POST /alerts
 * @description Create a new alert
 * @access Private
 */
router.post('/', alertController.createAlert.bind(alertController));

/**
 * @route PUT /alerts/:alertId/acknowledge
 * @description Acknowledge an alert
 * @access Private
 */
router.put('/:alertId/acknowledge', alertController.acknowledgeAlert.bind(alertController));

/**
 * @route PUT /alerts/:alertId/resolve
 * @description Resolve an alert
 * @access Private
 */
router.put('/:alertId/resolve', alertController.resolveAlert.bind(alertController));

/**
 * @route GET /alerts/stats
 * @description Get alert statistics
 * @access Private
 */
router.get('/stats', alertController.getAlertStats.bind(alertController));

module.exports = router;
