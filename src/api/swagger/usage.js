/**
 * @swagger
 * tags:
 *   name: Usage
 *   description: Usage monitoring and analytics
 */

/**
 * @swagger
 * /api/usage/statistics:
 *   get:
 *     summary: Get usage statistics
 *     description: Retrieve usage statistics for chatbots
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chatbotId
 *         schema:
 *           type: string
 *         description: Filter by chatbot ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *         description: Filter by platform (web, slack, etc.)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for the time range (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for the time range (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalMessages:
 *                           type: integer
 *                           example: 1250
 *                         totalSessions:
 *                           type: integer
 *                           example: 320
 *                         totalErrors:
 *                           type: integer
 *                           example: 15
 *                         totalFeedback:
 *                           type: integer
 *                           example: 85
 *                         totalIntegrations:
 *                           type: integer
 *                           example: 42
 *                         uniqueUsers:
 *                           type: integer
 *                           example: 150
 *                     timeline:
 *                       type: object
 *                       properties:
 *                         messages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date
 *                                 example: "2025-05-15"
 *                               count:
 *                                 type: integer
 *                                 example: 120
 *                               platform:
 *                                 type: string
 *                                 example: web
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/usage/active-users:
 *   get:
 *     summary: Get active users
 *     description: Retrieve active users statistics
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chatbotId
 *         schema:
 *           type: string
 *         description: Filter by chatbot ID
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *         description: Filter by platform (web, slack, etc.)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for the time range (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for the time range (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Active users statistics retrieved successfully
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
 *                     daily:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                             example: "2025-05-15"
 *                           count:
 *                             type: integer
 *                             example: 45
 *                     weekly:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                             example: 2025
 *                           week:
 *                             type: integer
 *                             example: 20
 *                           count:
 *                             type: integer
 *                             example: 120
 *                     monthly:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                             example: 2025
 *                           month:
 *                             type: integer
 *                             example: 5
 *                           count:
 *                             type: integer
 *                             example: 350
 *                     total:
 *                       type: integer
 *                       example: 450
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/usage/by-platform:
 *   get:
 *     summary: Get usage by platform
 *     description: Retrieve usage statistics by platform
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chatbotId
 *         schema:
 *           type: string
 *         description: Filter by chatbot ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for the time range (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for the time range (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Usage by platform statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       platform:
 *                         type: string
 *                         example: web
 *                       count:
 *                         type: integer
 *                         example: 850
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/usage/by-time:
 *   get:
 *     summary: Get usage by time of day
 *     description: Retrieve usage statistics by hour of day
 *     tags: [Usage]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: chatbotId
 *         schema:
 *           type: string
 *         description: Filter by chatbot ID
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *         description: Filter by platform (web, slack, etc.)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for the time range (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for the time range (ISO 8601 format)
 *     responses:
 *       200:
 *         description: Usage by time of day statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: integer
 *                         example: 14
 *                       count:
 *                         type: integer
 *                         example: 120
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/usage/track:
 *   post:
 *     summary: Track usage
 *     description: Track usage for a chatbot (internal use only)
 *     tags: [Usage]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - chatbotId
 *               - userId
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [message, session, error, feedback, integration]
 *                 example: message
 *               chatbotId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               userId:
 *                 type: string
 *                 example: user123
 *               platform:
 *                 type: string
 *                 example: web
 *               data:
 *                 type: object
 *                 example:
 *                   message:
 *                     content: "Hello, how can I help you?"
 *                     role: "assistant"
 *                     tokens: 8
 *     responses:
 *       200:
 *         description: Usage tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Usage tracked successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
