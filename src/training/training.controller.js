/**
 * Training Controller
 * 
 * Handles API requests for domain-specific training
 */

const trainingService = require('./training.service');
const { logger } = require('../utils');

/**
 * Get all training domains
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllDomains(req, res) {
  try {
    const { search, language, sort, limit, offset } = req.query;
    
    // Build query
    const query = {};
    if (language) {
      query.language = language;
    }
    
    if (search) {
      // Simple search implementation - in a real app, you'd use a proper search engine
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build options
    const options = {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    };
    
    if (sort) {
      const [field, order] = sort.split(':');
      options.sort = { [field]: order === 'desc' ? -1 : 1 };
    } else {
      options.sort = { name: 1 };
    }
    
    const domains = await trainingService.getAllDomains(query, options);
    
    res.json({
      success: true,
      data: domains,
      meta: {
        total: domains.length, // In a real app, you'd get the total count separately
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    logger.error('Error getting domains:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve domains',
      message: error.message
    });
  }
}

/**
 * Get domain by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDomainById(req, res) {
  try {
    const { id } = req.params;
    
    const domain = await trainingService.getDomainById(id);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found',
        message: `Domain with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: domain
    });
  } catch (error) {
    logger.error(`Error getting domain ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve domain',
      message: error.message
    });
  }
}

/**
 * Create a new training domain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createDomain(req, res) {
  try {
    const domainData = req.body;
    
    // Validate request
    if (!domainData || Object.keys(domainData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Domain data is required'
      });
    }
    
    const domain = await trainingService.createDomain(domainData);
    
    res.status(201).json({
      success: true,
      data: domain,
      message: 'Domain created successfully'
    });
  } catch (error) {
    logger.error('Error creating domain:', error.message);
    res.status(error.message.includes('required') ? 400 : 500).json({
      success: false,
      error: 'Failed to create domain',
      message: error.message
    });
  }
}

/**
 * Update an existing training domain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateDomain(req, res) {
  try {
    const { id } = req.params;
    const domainData = req.body;
    
    // Validate request
    if (!domainData || Object.keys(domainData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Domain data is required'
      });
    }
    
    const domain = await trainingService.updateDomain(id, domainData);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found',
        message: `Domain with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: domain,
      message: 'Domain updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating domain ${req.params.id}:`, error.message);
    res.status(error.message.includes('required') ? 400 : 500).json({
      success: false,
      error: 'Failed to update domain',
      message: error.message
    });
  }
}

/**
 * Delete a training domain
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteDomain(req, res) {
  try {
    const { id } = req.params;
    
    const result = await trainingService.deleteDomain(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found',
        message: `Domain with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      message: 'Domain deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting domain ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete domain',
      message: error.message
    });
  }
}

/**
 * Get all training datasets
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllDatasets(req, res) {
  try {
    const { domain_id, framework, search, sort, limit, offset } = req.query;
    
    // Build query
    const query = {};
    if (domain_id) {
      query.domain_id = domain_id;
    }
    
    if (framework) {
      query.framework = framework;
    }
    
    if (search) {
      // Simple search implementation
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build options
    const options = {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    };
    
    if (sort) {
      const [field, order] = sort.split(':');
      options.sort = { [field]: order === 'desc' ? -1 : 1 };
    } else {
      options.sort = { created_at: -1 };
    }
    
    const datasets = await trainingService.getAllDatasets(query, options);
    
    res.json({
      success: true,
      data: datasets,
      meta: {
        total: datasets.length,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    logger.error('Error getting datasets:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve datasets',
      message: error.message
    });
  }
}

/**
 * Get dataset by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDatasetById(req, res) {
  try {
    const { id } = req.params;
    
    const dataset = await trainingService.getDatasetById(id);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found',
        message: `Dataset with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: dataset
    });
  } catch (error) {
    logger.error(`Error getting dataset ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dataset',
      message: error.message
    });
  }
}

/**
 * Create a new training dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function createDataset(req, res) {
  try {
    const datasetData = req.body;
    
    // Validate request
    if (!datasetData || Object.keys(datasetData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Dataset data is required'
      });
    }
    
    // Check for file upload
    let fileData = null;
    let fileName = null;
    
    if (req.file) {
      fileData = req.file.buffer;
      fileName = req.file.originalname;
    }
    
    const dataset = await trainingService.createDataset(datasetData, fileData, fileName);
    
    res.status(201).json({
      success: true,
      data: dataset,
      message: 'Dataset created successfully'
    });
  } catch (error) {
    logger.error('Error creating dataset:', error.message);
    res.status(error.message.includes('required') || error.message.includes('not found') ? 400 : 500).json({
      success: false,
      error: 'Failed to create dataset',
      message: error.message
    });
  }
}

/**
 * Update an existing training dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function updateDataset(req, res) {
  try {
    const { id } = req.params;
    const datasetData = req.body;
    
    // Validate request
    if (!datasetData || Object.keys(datasetData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Dataset data is required'
      });
    }
    
    // Check for file upload
    let fileData = null;
    let fileName = null;
    
    if (req.file) {
      fileData = req.file.buffer;
      fileName = req.file.originalname;
    }
    
    const dataset = await trainingService.updateDataset(id, datasetData, fileData, fileName);
    
    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found',
        message: `Dataset with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: dataset,
      message: 'Dataset updated successfully'
    });
  } catch (error) {
    logger.error(`Error updating dataset ${req.params.id}:`, error.message);
    res.status(error.message.includes('required') ? 400 : 500).json({
      success: false,
      error: 'Failed to update dataset',
      message: error.message
    });
  }
}

/**
 * Delete a training dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function deleteDataset(req, res) {
  try {
    const { id } = req.params;
    
    const result = await trainingService.deleteDataset(id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Dataset not found',
        message: `Dataset with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      message: 'Dataset deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting dataset ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete dataset',
      message: error.message
    });
  }
}

/**
 * Get dataset file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getDatasetFile(req, res) {
  try {
    const { id, fileName } = req.params;
    
    const fileData = await trainingService.getDatasetFile(id, fileName);
    
    if (!fileData) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: `File ${fileName} not found in dataset ${id}`
      });
    }
    
    // Determine content type based on file extension
    const contentType = getContentType(fileName);
    
    res.set('Content-Type', contentType);
    res.send(fileData);
  } catch (error) {
    logger.error(`Error getting dataset file ${req.params.id}/${req.params.fileName}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dataset file',
      message: error.message
    });
  }
}

/**
 * Train a bot using a specific dataset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function trainBot(req, res) {
  try {
    const { botId, datasetId } = req.params;
    
    const result = await trainingService.trainBot(botId, datasetId);
    
    res.json({
      success: true,
      data: result,
      message: 'Bot trained successfully'
    });
  } catch (error) {
    logger.error(`Error training bot ${req.params.botId} with dataset ${req.params.datasetId}:`, error.message);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: 'Failed to train bot',
      message: error.message
    });
  }
}

/**
 * Get all training jobs
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAllTrainingJobs(req, res) {
  try {
    const { bot_id, status, sort, limit, offset } = req.query;
    
    // Build query
    const query = {};
    if (bot_id) {
      query.bot_id = bot_id;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Build options
    const options = {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    };
    
    if (sort) {
      const [field, order] = sort.split(':');
      options.sort = { [field]: order === 'desc' ? -1 : 1 };
    } else {
      options.sort = { created_at: -1 };
    }
    
    const jobs = await trainingService.getAllTrainingJobs(query, options);
    
    res.json({
      success: true,
      data: jobs,
      meta: {
        total: jobs.length,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    logger.error('Error getting training jobs:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve training jobs',
      message: error.message
    });
  }
}

/**
 * Get training job by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getTrainingJobById(req, res) {
  try {
    const { id } = req.params;
    
    const job = await trainingService.getTrainingJobById(id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Training job not found',
        message: `Training job with ID ${id} not found`
      });
    }
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error(`Error getting training job ${req.params.id}:`, error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve training job',
      message: error.message
    });
  }
}

/**
 * Get available training frameworks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getFrameworks(req, res) {
  try {
    const frameworks = trainingService.getFrameworks();
    
    res.json({
      success: true,
      data: frameworks
    });
  } catch (error) {
    logger.error('Error getting frameworks:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve frameworks',
      message: error.message
    });
  }
}

/**
 * Get content type based on file extension
 * @param {string} fileName - File name
 * @returns {string} - Content type
 * @private
 */
function getContentType(fileName) {
  const extension = fileName.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'json':
      return 'application/json';
    case 'yaml':
    case 'yml':
      return 'application/yaml';
    case 'txt':
      return 'text/plain';
    case 'md':
      return 'text/markdown';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

module.exports = {
  getAllDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
  getAllDatasets,
  getDatasetById,
  createDataset,
  updateDataset,
  deleteDataset,
  getDatasetFile,
  trainBot,
  getAllTrainingJobs,
  getTrainingJobById,
  getFrameworks
};
