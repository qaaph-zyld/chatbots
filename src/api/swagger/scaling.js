/**
 * @swagger
 * tags:
 *   name: Scaling
 *   description: Scaling configuration and metrics
 */

/**
 * @swagger
 * /api/scaling/metrics:
 *   get:
 *     summary: Get scaling metrics
 *     description: Retrieve current scaling metrics
 *     tags: [Scaling]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scaling metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     cpuUsage:
 *                       type: number
 *                       format: float
 *                       example: 45.2
 *                     memoryUsage:
 *                       type: number
 *                       format: float
 *                       example: 62.8
 *                     requestsPerMinute:
 *                       type: integer
 *                       example: 320
 *                     activeConnections:
 *                       type: integer
 *                       example: 42
 *                     responseTime:
 *                       type: number
 *                       format: float
 *                       example: 120.5
 *                     workers:
 *                       type: integer
 *                       example: 4
 *                     timestamp:
 *                       type: integer
 *                       example: 1621234567890
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/scaling/configuration:
 *   get:
 *     summary: Get scaling configuration
 *     description: Retrieve current scaling configuration
 *     tags: [Scaling]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scaling configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     autoScaling:
 *                       type: boolean
 *                       example: true
 *                     minInstances:
 *                       type: integer
 *                       example: 1
 *                     maxInstances:
 *                       type: integer
 *                       example: 8
 *                     metricsInterval:
 *                       type: integer
 *                       example: 60000
 *                     scalingInterval:
 *                       type: integer
 *                       example: 300000
 *                     scaleUpThreshold:
 *                       type: integer
 *                       example: 70
 *                     scaleDownThreshold:
 *                       type: integer
 *                       example: 30
 *                     cooldownPeriod:
 *                       type: integer
 *                       example: 600000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   put:
 *     summary: Update scaling configuration
 *     description: Update scaling configuration settings
 *     tags: [Scaling]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 example: true
 *               autoScaling:
 *                 type: boolean
 *                 example: true
 *               minInstances:
 *                 type: integer
 *                 example: 1
 *               maxInstances:
 *                 type: integer
 *                 example: 8
 *               metricsInterval:
 *                 type: integer
 *                 example: 60000
 *               scalingInterval:
 *                 type: integer
 *                 example: 300000
 *               scaleUpThreshold:
 *                 type: integer
 *                 example: 70
 *               scaleDownThreshold:
 *                 type: integer
 *                 example: 30
 *               cooldownPeriod:
 *                 type: integer
 *                 example: 600000
 *     responses:
 *       200:
 *         description: Scaling configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     autoScaling:
 *                       type: boolean
 *                       example: true
 *                     minInstances:
 *                       type: integer
 *                       example: 1
 *                     maxInstances:
 *                       type: integer
 *                       example: 8
 *                     metricsInterval:
 *                       type: integer
 *                       example: 60000
 *                     scalingInterval:
 *                       type: integer
 *                       example: 300000
 *                     scaleUpThreshold:
 *                       type: integer
 *                       example: 70
 *                     scaleDownThreshold:
 *                       type: integer
 *                       example: 30
 *                     cooldownPeriod:
 *                       type: integer
 *                       example: 600000
 *                 message:
 *                   type: string
 *                   example: Scaling configuration updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
