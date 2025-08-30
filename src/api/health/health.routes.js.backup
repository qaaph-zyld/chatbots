/**
 * Health check routes for the Chatbots Platform
 * These endpoints are used by Kubernetes to monitor application health
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('@src/config\redis');

/**
 * @swagger
 * /health/liveness:
 *   get:
 *     summary: Liveness probe
 *     description: Checks if the application is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: UP
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: chatbots-platform
 */
router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'chatbots-platform'
  });
});

/**
 * @swagger
 * /health/readiness:
 *   get:
 *     summary: Readiness probe
 *     description: Checks if the application is ready to accept traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is ready to accept traffic
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 *       503:
 *         description: Application is not ready to accept traffic
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthStatus'
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
    
    // Check Redis connection
    let redisStatus = 'DOWN';
    try {
      const redisClient = await redis.getClient();
      await redisClient.ping();
      redisStatus = 'UP';
    } catch (error) {
      console.error('Redis health check failed:', error);
    }
    
    // Overall status is UP only if all dependencies are UP
    const overallStatus = mongoStatus === 'UP' && redisStatus === 'UP' ? 'UP' : 'DOWN';
    
    const statusCode = overallStatus === 'UP' ? 200 : 503;
    
    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'chatbots-platform',
      dependencies: {
        mongodb: {
          status: mongoStatus
        },
        redis: {
          status: redisStatus
        }
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      service: 'chatbots-platform',
      error: 'Health check failed'
    });
  }
});

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     summary: Application metrics
 *     description: Returns application metrics for monitoring
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                   example: chatbots-platform
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       example: 3600
 *                     memory:
 *                       type: object
 *                     cpu:
 *                       type: object
 *                     requests:
 *                       type: object
 *                     response:
 *                       type: object
 *       500:
 *         description: Error collecting metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/metrics', async (req, res) => {
  try {
    // Basic system metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Application metrics
    // These would be replaced with actual application metrics in a production environment
    const metrics = {
      uptime: uptime,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      // Example application-specific metrics
      requests: {
        total: 0,
        success: 0,
        error: 0
      },
      response: {
        averageTime: 0
      }
    };
    
    res.status(200).json({
      timestamp: new Date().toISOString(),
      service: 'chatbots-platform',
      metrics: metrics
    });
  } catch (error) {
    console.error('Metrics collection failed:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'chatbots-platform',
      error: 'Metrics collection failed'
    });
  }
});

module.exports = router;
