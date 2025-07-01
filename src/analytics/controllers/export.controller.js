/**
 * Analytics Export Controller
 * 
 * API endpoints for exporting analytics data in various formats
 */

const dataExporter = require('../utils/data-exporter');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Export events to CSV
 * @route GET /api/analytics/export/events/csv
 */
const exportEventsToCSV = async (req, res) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate, eventType } = req.query;
    
    // Validate tenant access
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;
    
    // Set output directory
    const outputDir = path.join(process.cwd(), 'exports', tenantId);
    
    // Export data
    const filePath = await dataExporter.exportEventsToCSV({
      tenantId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      eventType,
      outputDir
    });
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: 'No data found for the specified criteria'
      });
    }
    
    // Send file
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        logger.error(`Error sending CSV file: ${err.message}`, { error: err, tenantId, filePath });
        
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            error: 'Error sending file'
          });
        }
      }
      
      // Clean up file after sending (optional)
      // fs.unlink(filePath, (unlinkErr) => {
      //   if (unlinkErr) {
      //     logger.error(`Error deleting temporary file: ${unlinkErr.message}`, { error: unlinkErr, filePath });
      //   }
      // });
    });
  } catch (error) {
    logger.error(`Error in exportEventsToCSV: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to export events to CSV'
    });
  }
};

/**
 * Export events to JSON
 * @route GET /api/analytics/export/events/json
 */
const exportEventsToJSON = async (req, res) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate, eventType } = req.query;
    
    // Validate tenant access
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;
    
    // Set output directory
    const outputDir = path.join(process.cwd(), 'exports', tenantId);
    
    // Export data
    const filePath = await dataExporter.exportEventsToJSON({
      tenantId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      eventType,
      outputDir
    });
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: 'No data found for the specified criteria'
      });
    }
    
    // Send file
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        logger.error(`Error sending JSON file: ${err.message}`, { error: err, tenantId, filePath });
        
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            error: 'Error sending file'
          });
        }
      }
    });
  } catch (error) {
    logger.error(`Error in exportEventsToJSON: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to export events to JSON'
    });
  }
};

/**
 * Export events to Excel
 * @route GET /api/analytics/export/events/excel
 */
const exportEventsToExcel = async (req, res) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate, eventType } = req.query;
    
    // Validate tenant access
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;
    
    // Set output directory
    const outputDir = path.join(process.cwd(), 'exports', tenantId);
    
    // Export data
    const filePath = await dataExporter.exportEventsToExcel({
      tenantId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      eventType,
      outputDir
    });
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        error: 'No data found for the specified criteria'
      });
    }
    
    // Send file
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        logger.error(`Error sending Excel file: ${err.message}`, { error: err, tenantId, filePath });
        
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            error: 'Error sending file'
          });
        }
      }
    });
  } catch (error) {
    logger.error(`Error in exportEventsToExcel: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to export events to Excel'
    });
  }
};

/**
 * Export analytics report
 * @route GET /api/analytics/export/report
 */
const exportAnalyticsReport = async (req, res) => {
  try {
    const { tenantId } = req;
    const { startDate, endDate, format = 'json' } = req.query;
    
    // Validate tenant access
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized access'
      });
    }
    
    // Validate format
    const validFormats = ['csv', 'json', 'excel'];
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}`
      });
    }
    
    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;
    
    // Set output directory
    const outputDir = path.join(process.cwd(), 'exports', tenantId);
    
    // Export data
    const filePath = await dataExporter.exportAnalyticsReport({
      tenantId,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      format,
      outputDir
    });
    
    // Send file
    res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        logger.error(`Error sending report file: ${err.message}`, { error: err, tenantId, filePath });
        
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            error: 'Error sending file'
          });
        }
      }
    });
  } catch (error) {
    logger.error(`Error in exportAnalyticsReport: ${error.message}`, { error });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to export analytics report'
    });
  }
};

module.exports = {
  exportEventsToCSV,
  exportEventsToJSON,
  exportEventsToExcel,
  exportAnalyticsReport
};
