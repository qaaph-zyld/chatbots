/**
 * Knowledge Base Controller
 * 
 * Handles HTTP requests related to knowledge base management and vector search
 */

const express = require('express');
const router = express.Router();
const vectorDBService = require('../services/vector-db.service');
const { authenticate, authorize } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processDocument } = require('../utils/document-processor');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'text/html'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

/**
 * @swagger
 * /api/knowledge-base/search:
 *   get:
 *     summary: Semantic search in knowledge base
 *     description: Search documents using semantic vector search
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query text
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Optional category filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.get('/search', authenticate, async (req, res) => {
  try {
    const { query, category, limit } = req.query;
    const tenantId = req.user.tenantId;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const results = await vectorDBService.semanticSearch({
      query,
      tenantId,
      category,
      limit: limit ? parseInt(limit) : 10
    });
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error(`Error in knowledge base search: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to perform search'
    });
  }
});

/**
 * @swagger
 * /api/knowledge-base/documents:
 *   get:
 *     summary: List knowledge base documents
 *     description: Get a paginated list of documents in the knowledge base
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: List of documents
 *       500:
 *         description: Server error
 */
router.get('/documents', authenticate, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const tenantId = req.user.tenantId;
    
    const documents = await vectorDBService.listDocuments(
      tenantId,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0
    );
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    logger.error(`Error listing knowledge base documents: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list documents'
    });
  }
});

/**
 * @swagger
 * /api/knowledge-base/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     description: Retrieve a specific document from the knowledge base
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document data
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.get('/documents/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const document = await vectorDBService.getDocument(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    // Check if document belongs to the user's tenant
    if (document.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error(`Error getting knowledge base document: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get document'
    });
  }
});

/**
 * @swagger
 * /api/knowledge-base/documents:
 *   post:
 *     summary: Add document to knowledge base
 *     description: Add a new document to the knowledge base
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Document created
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/documents', authenticate, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { title, content, category, metadata } = req.body;
    const tenantId = req.user.tenantId;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }
    
    const id = await vectorDBService.addDocument({
      title,
      content,
      category,
      tenantId,
      metadata
    });
    
    res.status(201).json({
      success: true,
      data: { id }
    });
  } catch (error) {
    logger.error(`Error adding knowledge base document: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to add document'
    });
  }
});

/**
 * @swagger
 * /api/knowledge-base/documents/upload:
 *   post:
 *     summary: Upload document file
 *     description: Upload and process a document file for the knowledge base
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *               metadata:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded and processed
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/documents/upload', authenticate, authorize(['admin', 'editor']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const tenantId = req.user.tenantId;
    const category = req.body.category || 'general';
    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    
    // Process the uploaded document
    const { title, content, chunks } = await processDocument(req.file.path);
    
    // Add the document to the vector database
    const documentIds = [];
    
    // If document was chunked, add each chunk
    if (chunks && chunks.length > 0) {
      const batchDocuments = chunks.map((chunk, index) => ({
        title: `${title} - Part ${index + 1}`,
        content: chunk,
        category,
        tenantId,
        metadata: {
          ...metadata,
          originalFile: req.file.originalname,
          chunkIndex: index,
          totalChunks: chunks.length
        }
      }));
      
      const ids = await vectorDBService.addDocumentBatch(batchDocuments);
      documentIds.push(...ids);
    } else {
      // Add as a single document
      const id = await vectorDBService.addDocument({
        title,
        content,
        category,
        tenantId,
        metadata: {
          ...metadata,
          originalFile: req.file.originalname
        }
      });
      documentIds.push(id);
    }
    
    // Clean up the temporary file
    fs.unlinkSync(req.file.path);
    
    res.status(201).json({
      success: true,
      data: {
        documentIds,
        title,
        category,
        chunked: chunks && chunks.length > 0,
        chunkCount: chunks ? chunks.length : 0
      }
    });
  } catch (error) {
    logger.error(`Error uploading document: ${error.message}`, { error });
    
    // Clean up the temporary file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process document'
    });
  }
});

/**
 * @swagger
 * /api/knowledge-base/documents/{id}:
 *   put:
 *     summary: Update document
 *     description: Update an existing document in the knowledge base
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Document updated
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.put('/documents/:id', authenticate, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, metadata } = req.body;
    
    // Check if document exists and belongs to the user's tenant
    const document = await vectorDBService.getDocument(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    if (document.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    await vectorDBService.updateDocument(id, {
      title,
      content,
      category,
      metadata
    });
    
    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    logger.error(`Error updating knowledge base document: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update document'
    });
  }
});

/**
 * @swagger
 * /api/knowledge-base/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     description: Delete a document from the knowledge base
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.delete('/documents/:id', authenticate, authorize(['admin', 'editor']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if document exists and belongs to the user's tenant
    const document = await vectorDBService.getDocument(id);
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    if (document.tenantId !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    
    await vectorDBService.deleteDocument(id);
    
    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    logger.error(`Error deleting knowledge base document: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

/**
 * @swagger
 * /api/knowledge-base/documents:
 *   delete:
 *     summary: Delete all tenant documents
 *     description: Delete all documents for the current tenant
 *     tags: [Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents deleted
 *       500:
 *         description: Server error
 */
router.delete('/documents', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    await vectorDBService.deleteAllTenantDocuments(tenantId);
    
    res.json({
      success: true,
      message: 'All documents deleted'
    });
  } catch (error) {
    logger.error(`Error deleting all tenant documents: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete documents'
    });
  }
});

module.exports = router;
