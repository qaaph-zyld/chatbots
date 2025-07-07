/**
 * Export Controller Unit Tests
 */

const exportController = require('../../../src/analytics/controllers/export.controller');
const dataExporter = require('../../../src/analytics/utils/data-exporter');
const path = require('path');

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/analytics/utils/data-exporter', () => ({
  exportEventsToCSV: jest.fn(),
  exportEventsToJSON: jest.fn(),
  exportEventsToExcel: jest.fn(),
  exportAnalyticsReport: jest.fn()
}));

describe('Export Controller', () => {
  let req, res;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request object
    req = {
      tenantId: 'tenant123',
      query: {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
        eventType: 'conversation_start'
      }
    };
    
    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      download: jest.fn(),
      headersSent: false
    };
  });
  
  describe('exportEventsToCSV', () => {
    it('should return 401 if tenant ID is missing', async () => {
      // Remove tenant ID
      req.tenantId = undefined;
      
      await exportController.exportEventsToCSV(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access'
      });
    });
    
    it('should return 404 if no data found', async () => {
      // Mock data exporter to return null (no data)
      dataExporter.exportEventsToCSV.mockResolvedValueOnce(null);
      
      await exportController.exportEventsToCSV(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No data found for the specified criteria'
      });
    });
    
    it('should download CSV file if export is successful', async () => {
      // Mock successful export
      const filePath = '/tmp/exports/events-tenant123-2023-01-01-to-2023-01-31.csv';
      dataExporter.exportEventsToCSV.mockResolvedValueOnce(filePath);
      
      await exportController.exportEventsToCSV(req, res);
      
      // Check that data exporter was called with correct parameters
      expect(dataExporter.exportEventsToCSV).toHaveBeenCalledWith({
        tenantId: 'tenant123',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        eventType: 'conversation_start',
        outputDir: expect.stringContaining(path.join('exports', 'tenant123'))
      });
      
      // Check that download was initiated
      expect(res.download).toHaveBeenCalledWith(
        filePath,
        path.basename(filePath),
        expect.any(Function)
      );
    });
    
    it('should handle export errors', async () => {
      // Mock export error
      dataExporter.exportEventsToCSV.mockRejectedValueOnce(new Error('Export failed'));
      
      await exportController.exportEventsToCSV(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to export events to CSV'
      });
    });
  });
  
  describe('exportEventsToJSON', () => {
    it('should return 401 if tenant ID is missing', async () => {
      // Remove tenant ID
      req.tenantId = undefined;
      
      await exportController.exportEventsToJSON(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access'
      });
    });
    
    it('should return 404 if no data found', async () => {
      // Mock data exporter to return null (no data)
      dataExporter.exportEventsToJSON.mockResolvedValueOnce(null);
      
      await exportController.exportEventsToJSON(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No data found for the specified criteria'
      });
    });
    
    it('should download JSON file if export is successful', async () => {
      // Mock successful export
      const filePath = '/tmp/exports/events-tenant123-2023-01-01-to-2023-01-31.json';
      dataExporter.exportEventsToJSON.mockResolvedValueOnce(filePath);
      
      await exportController.exportEventsToJSON(req, res);
      
      // Check that data exporter was called with correct parameters
      expect(dataExporter.exportEventsToJSON).toHaveBeenCalledWith({
        tenantId: 'tenant123',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        eventType: 'conversation_start',
        outputDir: expect.stringContaining(path.join('exports', 'tenant123'))
      });
      
      // Check that download was initiated
      expect(res.download).toHaveBeenCalledWith(
        filePath,
        path.basename(filePath),
        expect.any(Function)
      );
    });
  });
  
  describe('exportEventsToExcel', () => {
    it('should return 401 if tenant ID is missing', async () => {
      // Remove tenant ID
      req.tenantId = undefined;
      
      await exportController.exportEventsToExcel(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access'
      });
    });
    
    it('should return 404 if no data found', async () => {
      // Mock data exporter to return null (no data)
      dataExporter.exportEventsToExcel.mockResolvedValueOnce(null);
      
      await exportController.exportEventsToExcel(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No data found for the specified criteria'
      });
    });
    
    it('should download Excel file if export is successful', async () => {
      // Mock successful export
      const filePath = '/tmp/exports/events-tenant123-2023-01-01-to-2023-01-31.xlsx';
      dataExporter.exportEventsToExcel.mockResolvedValueOnce(filePath);
      
      await exportController.exportEventsToExcel(req, res);
      
      // Check that data exporter was called with correct parameters
      expect(dataExporter.exportEventsToExcel).toHaveBeenCalledWith({
        tenantId: 'tenant123',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        eventType: 'conversation_start',
        outputDir: expect.stringContaining(path.join('exports', 'tenant123'))
      });
      
      // Check that download was initiated
      expect(res.download).toHaveBeenCalledWith(
        filePath,
        path.basename(filePath),
        expect.any(Function)
      );
    });
  });
  
  describe('exportAnalyticsReport', () => {
    it('should return 401 if tenant ID is missing', async () => {
      // Remove tenant ID
      req.tenantId = undefined;
      
      await exportController.exportAnalyticsReport(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized access'
      });
    });
    
    it('should return 400 if format is invalid', async () => {
      // Set invalid format
      req.query.format = 'pdf'; // Unsupported format
      
      await exportController.exportAnalyticsReport(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid format. Supported formats: csv, json, excel'
      });
    });
    
    it('should return 404 if no data found', async () => {
      // Set valid format
      req.query.format = 'csv';
      
      // Mock data exporter to return null (no data)
      dataExporter.exportAnalyticsReport.mockResolvedValueOnce(null);
      
      await exportController.exportAnalyticsReport(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'No data found for the specified criteria'
      });
    });
    
    it('should download report file if export is successful', async () => {
      // Set valid format
      req.query.format = 'excel';
      
      // Mock successful export
      const filePath = '/tmp/exports/analytics-report-tenant123-2023-01-01-to-2023-01-31.xlsx';
      dataExporter.exportAnalyticsReport.mockResolvedValueOnce(filePath);
      
      await exportController.exportAnalyticsReport(req, res);
      
      // Check that data exporter was called with correct parameters
      expect(dataExporter.exportAnalyticsReport).toHaveBeenCalledWith({
        tenantId: 'tenant123',
        startDate: expect.any(Date),
        endDate: expect.any(Date),
        format: 'excel',
        outputDir: expect.stringContaining(path.join('exports', 'tenant123'))
      });
      
      // Check that download was initiated
      expect(res.download).toHaveBeenCalledWith(
        filePath,
        path.basename(filePath),
        expect.any(Function)
      );
    });
    
    it('should handle export errors', async () => {
      // Set valid format
      req.query.format = 'json';
      
      // Mock export error
      dataExporter.exportAnalyticsReport.mockRejectedValueOnce(new Error('Export failed'));
      
      await exportController.exportAnalyticsReport(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to export analytics report'
      });
    });
  });
});
