/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check and monitoring endpoints
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     description: Returns a simple health status to verify the API is running
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-05-21T15:30:00.000Z
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 3600
 *                 version:
 *                   type: string
 *                   description: API version
 *                   example: 1.0.0
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /health/status:
 *   get:
 *     summary: Detailed system status
 *     tags: [Health]
 *     description: Returns detailed information about the system status (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-05-21T15:30:00.000Z
 *                 environment:
 *                   type: string
 *                   example: production
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: connected
 *                     name:
 *                       type: string
 *                       example: chatbots_production
 *                 system:
 *                   type: object
 *                   properties:
 *                     platform:
 *                       type: string
 *                       example: linux
 *                     arch:
 *                       type: string
 *                       example: x64
 *                     cpus:
 *                       type: integer
 *                       example: 4
 *                     memory:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: string
 *                           example: 16 GB
 *                         free:
 *                           type: string
 *                           example: 8 GB
 *                         usage:
 *                           type: string
 *                           example: 50%
 *                     uptime:
 *                       type: string
 *                       example: 24 hours
 *                 process:
 *                   type: object
 *                   properties:
 *                     pid:
 *                       type: integer
 *                       example: 1234
 *                     memory:
 *                       type: object
 *                       properties:
 *                         rss:
 *                           type: integer
 *                           example: 50000000
 *                         heapTotal:
 *                           type: integer
 *                           example: 30000000
 *                         heapUsed:
 *                           type: integer
 *                           example: 25000000
 *                         external:
 *                           type: integer
 *                           example: 1000000
 *                     uptime:
 *                       type: string
 *                       example: 120 minutes
 *                     nodeVersion:
 *                       type: string
 *                       example: v18.15.0
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Prometheus metrics
 *     tags: [Health]
 *     description: Returns metrics in Prometheus format for monitoring (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP chatbots_info Information about the Chatbots application
 *                 # TYPE chatbots_info gauge
 *                 chatbots_info{version="1.0.0",environment="production"} 1
 *                 
 *                 # HELP chatbots_uptime_seconds The uptime of the Chatbots application in seconds
 *                 # TYPE chatbots_uptime_seconds gauge
 *                 chatbots_uptime_seconds 3600
 *                 
 *                 # HELP chatbots_memory_usage_bytes Memory usage of the Chatbots application in bytes
 *                 # TYPE chatbots_memory_usage_bytes gauge
 *                 chatbots_memory_usage_bytes{type="rss"} 50000000
 *                 chatbots_memory_usage_bytes{type="heapTotal"} 30000000
 *                 chatbots_memory_usage_bytes{type="heapUsed"} 25000000
 *                 chatbots_memory_usage_bytes{type="external"} 1000000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
