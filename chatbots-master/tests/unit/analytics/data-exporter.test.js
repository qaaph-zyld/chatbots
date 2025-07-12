/**
 * Data Exporter Unit Tests
 */

const fs = require('fs');
const path = require('path');
const dataExporter = require('../../../src/analytics/utils/data-exporter');
const analyticsService = require('../../../src/analytics/services/analytics.service');
const ExcelJS = require('exceljs');

// Mock dependencies
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/analytics/services/analytics.service', () => ({
  getEventsByTenant: jest.fn(),
  getAnalyticsByTenant: jest.fn()
}));

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
  }
}));

describe('Data Exporter', () => {
  const mockEvents = [
    {
      _id: '60d21b4667d0d8992e610c85',
      tenantId: '60d21b4667d0d8992e610c80',
      userId: '60d21b4667d0d8992e610c81',
      sessionId: '60d21b4667d0d8992e610c82',
      eventType: 'conversation_start',
      timestamp: new Date('2023-01-01T12:00:00Z'),
      eventData: { chatId: '123', source: 'web' }
    },
    {
      _id: '60d21b4667d0d8992e610c86',
      tenantId: '60d21b4667d0d8992e610c80',
      userId: '60d21b4667d0d8992e610c81',
      sessionId: '60d21b4667d0d8992e610c82',
      eventType: 'message_sent',
      timestamp: new Date('2023-01-01T12:01:00Z'),
      eventData: { chatId: '123', messageId: '456', content: 'Hello' }
    }
  ];

  const mockAnalytics = {
    summary: {
      totalConversations: 100,
      totalMessages: 500,
      activeUsers: 50,
      averageConversationLength: 5
    },
    userActivity: [
      { date: '2023-01-01', activeUsers: 20 },
      { date: '2023-01-02', activeUsers: 25 }
    ],
    conversationMetrics: [
      { date: '2023-01-01', count: 40, avgLength: 4.5 },
      { date: '2023-01-02', count: 60, avgLength: 5.2 }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock analytics service responses
    analyticsService.getEventsByTenant.mockResolvedValue(mockEvents);
    analyticsService.getAnalyticsByTenant.mockResolvedValue(mockAnalytics);
  });

  describe('exportEventsToCSV', () => {
    it('should export events to CSV file', async () => {
      const options = {
        tenantId: '60d21b4667d0d8992e610c80',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z'),
        outputDir: '/tmp/exports'
      };

      const result = await dataExporter.exportEventsToCSV(options);

      // Check that the directory was created
      expect(fs.promises.mkdir).toHaveBeenCalledWith(options.outputDir, { recursive: true });

      // Check that analytics service was called with correct parameters
      expect(analyticsService.getEventsByTenant).toHaveBeenCalledWith(
        options.tenantId,
        options.startDate,
        options.endDate,
        undefined
      );

      // Check that file was written
      expect(fs.promises.writeFile).toHaveBeenCalled();

      // Check that the result is a file path
      expect(result).toMatch(/^\/tmp\/exports\/events-/);
    });

    it('should return null if no events found', async () => {
      analyticsService.getEventsByTenant.mockResolvedValueOnce([]);

      const options = {
        tenantId: '60d21b4667d0d8992e610c80',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z')
      };

      const result = await dataExporter.exportEventsToCSV(options);

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      fs.promises.mkdir.mockRejectedValueOnce(new Error('Directory creation failed'));

      const options = {
        tenantId: '60d21b4667d0d8992e610c80',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z')
      };

      await expect(dataExporter.exportEventsToCSV(options)).rejects.toThrow('Directory creation failed');
    });
  });

  describe('exportEventsToJSON', () => {
    it('should export events to JSON file', async () => {
      const options = {
        tenantId: '60d21b4667d0d8992e610c80',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z'),
        outputDir: '/tmp/exports'
      };

      const result = await dataExporter.exportEventsToJSON(options);

      // Check that the directory was created
      expect(fs.promises.mkdir).toHaveBeenCalledWith(options.outputDir, { recursive: true });

      // Check that analytics service was called with correct parameters
      expect(analyticsService.getEventsByTenant).toHaveBeenCalledWith(
        options.tenantId,
        options.startDate,
        options.endDate,
        undefined
      );

      // Check that file was written
      expect(fs.promises.writeFile).toHaveBeenCalled();
      
      // Verify JSON content was properly stringified
      const writeFileCall = fs.promises.writeFile.mock.calls[0];
      const jsonContent = writeFileCall[1];
      expect(() => JSON.parse(jsonContent)).not.toThrow();
      
      // Check that the result is a file path
      expect(result).toMatch(/^\/tmp\/exports\/events-/);
    });
  });

  describe('exportEventsToExcel', () => {
    it('should export events to Excel file', async () => {
      // Mock ExcelJS workbook
      const mockWorkbook = {
        addWorksheet: jest.fn().mockReturnValue({
          columns: [],
          addRows: jest.fn()
        }),
        xlsx: {
          writeFile: jest.fn().mockResolvedValue(undefined)
        }
      };
      
      // Mock ExcelJS constructor
      jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook);

      const options = {
        tenantId: '60d21b4667d0d8992e610c80',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z'),
        outputDir: '/tmp/exports'
      };

      const result = await dataExporter.exportEventsToExcel(options);

      // Check that the directory was created
      expect(fs.promises.mkdir).toHaveBeenCalledWith(options.outputDir, { recursive: true });

      // Check that analytics service was called with correct parameters
      expect(analyticsService.getEventsByTenant).toHaveBeenCalledWith(
        options.tenantId,
        options.startDate,
        options.endDate,
        undefined
      );

      // Check that Excel file was created
      expect(mockWorkbook.addWorksheet).toHaveBeenCalled();
      expect(mockWorkbook.xlsx.writeFile).toHaveBeenCalled();
      
      // Check that the result is a file path
      expect(result).toMatch(/^\/tmp\/exports\/events-/);
    });
  });

  describe('exportAnalyticsReport', () => {
    it('should export analytics report in CSV format', async () => {
      const options = {
        tenantId: '60d21b4667d0d8992e610c80',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z'),
        format: 'csv',
        outputDir: '/tmp/exports'
      };

      const result = await dataExporter.exportAnalyticsReport(options);

      // Check that the directory was created
      expect(fs.promises.mkdir).toHaveBeenCalledWith(options.outputDir, { recursive: true });

      // Check that analytics service was called with correct parameters
      expect(analyticsService.getAnalyticsByTenant).toHaveBeenCalledWith(
        options.tenantId,
        options.startDate,
        options.endDate
      );

      // Check that file was written
      expect(fs.promises.writeFile).toHaveBeenCalled();
      
      // Check that the result is a file path
      expect(result).toMatch(/^\/tmp\/exports\/analytics-report-/);
    });

    it('should export analytics report in JSON format', async () => {
      const options = {
        tenantId: '60d21b4667d0d8992e610c80',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z'),
        format: 'json',
        outputDir: '/tmp/exports'
      };

      const result = await dataExporter.exportAnalyticsReport(options);

      // Check that file was written with JSON content
      expect(fs.promises.writeFile).toHaveBeenCalled();
      
      // Verify JSON content was properly stringified
      const writeFileCall = fs.promises.writeFile.mock.calls[0];
      const jsonContent = writeFileCall[1];
      expect(() => JSON.parse(jsonContent)).not.toThrow();
      
      // Check that the result is a file path
      expect(result).toMatch(/^\/tmp\/exports\/analytics-report-/);
    });

    it('should export analytics report in Excel format', async () => {
      // Mock ExcelJS workbook
      const mockWorkbook = {
        addWorksheet: jest.fn().mockReturnValue({
          columns: [],
          addRows: jest.fn()
        }),
        xlsx: {
          writeFile: jest.fn().mockResolvedValue(undefined)
        }
      };
      
      // Mock ExcelJS constructor
      jest.spyOn(ExcelJS, 'Workbook').mockImplementation(() => mockWorkbook);

      const options = {
        tenantId: '60d21b4667d0d8992e610c80',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z'),
        format: 'excel',
        outputDir: '/tmp/exports'
      };

      const result = await dataExporter.exportAnalyticsReport(options);

      // Check that Excel file was created
      expect(mockWorkbook.addWorksheet).toHaveBeenCalled();
      expect(mockWorkbook.xlsx.writeFile).toHaveBeenCalled();
      
      // Check that the result is a file path
      expect(result).toMatch(/^\/tmp\/exports\/analytics-report-/);
    });

    it('should throw error for unsupported format', async () => {
      const options = {
        tenantId: '60d21b4667d0d8992e610c80',
        startDate: new Date('2023-01-01T00:00:00Z'),
        endDate: new Date('2023-01-02T00:00:00Z'),
        format: 'pdf', // Unsupported format
        outputDir: '/tmp/exports'
      };

      await expect(dataExporter.exportAnalyticsReport(options)).rejects.toThrow('Unsupported format: pdf');
    });
  });
});
