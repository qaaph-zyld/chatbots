/**
 * Example API endpoint implementation with Swagger documentation
 * This file serves as a template for implementing and documenting API endpoints
 */
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Examples
 *   description: Example API endpoints for demonstration purposes
 */

/**
 * @swagger
 * /examples:
 *   get:
 *     summary: Get all examples
 *     description: Retrieve a list of all examples with pagination support
 *     tags: [Examples]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: A paginated list of examples
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
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: 60d21b4667d0d8992e610c85
 *                           name:
 *                             type: string
 *                             example: Example Item
 *                           description:
 *                             type: string
 *                             example: This is an example item
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         pageSize:
 *                           type: integer
 *                           example: 10
 *                         pages:
 *                           type: integer
 *                           example: 10
 *                         next:
 *                           type: string
 *                           example: /api/examples?page=2&pageSize=10
 *                         prev:
 *                           type: string
 *                           example: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Example implementation (in a real app, this would query a database)
    const examples = Array.from({ length: 10 }, (_, i) => ({
      id: `60d21b4667d0d8992e610c${i + 10}`,
      name: `Example Item ${i + 1}`,
      description: `This is example item ${i + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    // Return paginated response
    res.status(200).json({
      status: 'success',
      data: {
        items: examples,
        pagination: {
          total: 100,
          page,
          pageSize,
          pages: Math.ceil(100 / pageSize),
          next: page < Math.ceil(100 / pageSize) ? `/api/examples?page=${page + 1}&pageSize=${pageSize}` : null,
          prev: page > 1 ? `/api/examples?page=${page - 1}&pageSize=${pageSize}` : null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching examples:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * @swagger
 * /examples/{id}:
 *   get:
 *     summary: Get example by ID
 *     description: Retrieve a specific example by its ID
 *     tags: [Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Example ID
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Example details
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
 *                     id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     name:
 *                       type: string
 *                       example: Example Item
 *                     description:
 *                       type: string
 *                       example: This is an example item
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Example implementation (in a real app, this would query a database)
    if (id === '60d21b4667d0d8992e610c85') {
      res.status(200).json({
        status: 'success',
        data: {
          id,
          name: 'Example Item',
          description: 'This is an example item',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(404).json({
        status: 'error',
        error: {
          code: 404,
          message: 'Example not found'
        }
      });
    }
  } catch (error) {
    console.error('Error fetching example:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * @swagger
 * /examples:
 *   post:
 *     summary: Create a new example
 *     description: Create a new example item
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: New Example
 *               description:
 *                 type: string
 *                 example: This is a new example item
 *     responses:
 *       201:
 *         description: Example created successfully
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
 *                     id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     name:
 *                       type: string
 *                       example: New Example
 *                     description:
 *                       type: string
 *                       example: This is a new example item
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Validate request
    if (!name) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 400,
          message: 'Name is required'
        }
      });
    }
    
    // Example implementation (in a real app, this would create a record in a database)
    res.status(201).json({
      status: 'success',
      data: {
        id: '60d21b4667d0d8992e610c99',
        name,
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating example:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * @swagger
 * /examples/{id}:
 *   put:
 *     summary: Update an example
 *     description: Update an existing example by its ID
 *     tags: [Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Example ID
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Example
 *               description:
 *                 type: string
 *                 example: This is an updated example item
 *     responses:
 *       200:
 *         description: Example updated successfully
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
 *                     id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     name:
 *                       type: string
 *                       example: Updated Example
 *                     description:
 *                       type: string
 *                       example: This is an updated example item
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Example implementation (in a real app, this would update a record in a database)
    if (id === '60d21b4667d0d8992e610c85') {
      res.status(200).json({
        status: 'success',
        data: {
          id,
          name: name || 'Example Item',
          description: description || 'This is an example item',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updatedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(404).json({
        status: 'error',
        error: {
          code: 404,
          message: 'Example not found'
        }
      });
    }
  } catch (error) {
    console.error('Error updating example:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

/**
 * @swagger
 * /examples/{id}:
 *   delete:
 *     summary: Delete an example
 *     description: Delete an example by its ID
 *     tags: [Examples]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Example ID
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       204:
 *         description: Example deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Example implementation (in a real app, this would delete a record from a database)
    if (id === '60d21b4667d0d8992e610c85') {
      res.status(204).send();
    } else {
      res.status(404).json({
        status: 'error',
        error: {
          code: 404,
          message: 'Example not found'
        }
      });
    }
  } catch (error) {
    console.error('Error deleting example:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 500,
        message: 'Internal server error'
      }
    });
  }
});

module.exports = router;
