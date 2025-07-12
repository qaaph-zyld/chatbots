/**
 * Analytics Data Exporter
 * 
 * Utility for exporting analytics data in various formats (CSV, JSON, Excel)
 * Supports filtering and formatting options for customized exports
 */

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
const logger = require('../../utils/logger');
const analyticsService = require('../services/analytics.service');

/**
 * Format date for file naming
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
const formatDateForFilename = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Ensure export directory exists
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    logger.error(`Error creating directory: ${error.message}`, { error, dirPath });
    throw error;
  }
};

/**
 * Export analytics events to CSV
 * @param {Object} options - Export options
 * @param {string} options.tenantId - Tenant ID
 * @param {Date} options.startDate - Start date for data
 * @param {Date} options.endDate - End date for data
 * @param {string} options.eventType - Optional event type filter
 * @param {string} options.outputDir - Output directory
 * @returns {Promise<string>} Path to the exported file
 */
const exportEventsToCSV = async (options) => {
  const {
    tenantId,
    startDate,
    endDate,
    eventType,
    outputDir = path.join(process.cwd(), 'exports')
  } = options;
  
  try {
    // Ensure directory exists
    await ensureDirectoryExists(outputDir);
    
    // Get events
    const events = await analyticsService.getEventsByTenant(
      tenantId,
      startDate,
      endDate,
      eventType
    );
    
    if (events.length === 0) {
      logger.warn('No events found for export', { tenantId, startDate, endDate, eventType });
      return null;
    }
    
    // Format events for CSV
    const formattedEvents = events.map(event => ({
      eventId: event._id.toString(),
      tenantId: event.tenantId.toString(),
      userId: event.userId.toString(),
      sessionId: event.sessionId.toString(),
      eventType: event.eventType,
      timestamp: event.timestamp.toISOString(),
      eventData: JSON.stringify(event.eventData)
    }));
    
    // Generate CSV
    const fields = ['eventId', 'tenantId', 'userId', 'sessionId', 'eventType', 'timestamp', 'eventData'];
    const parser = new Parser({ fields });
    const csv = parser.parse(formattedEvents);
    
    // Generate filename
    const startDateStr = formatDateForFilename(startDate || new Date(0));
    const endDateStr = formatDateForFilename(endDate || new Date());
    const eventTypeStr = eventType ? `-${eventType}` : '';
    const filename = `events-${tenantId}${eventTypeStr}-${startDateStr}-to-${endDateStr}.csv`;
    const filePath = path.join(outputDir, filename);
    
    // Write file
    await fs.promises.writeFile(filePath, csv);
    
    logger.info(`Exported ${events.length} events to CSV`, { tenantId, filePath });
    
    return filePath;
  } catch (error) {
    logger.error(`Error exporting events to CSV: ${error.message}`, { error, tenantId });
    throw error;
  }
};

/**
 * Export analytics events to JSON
 * @param {Object} options - Export options
 * @param {string} options.tenantId - Tenant ID
 * @param {Date} options.startDate - Start date for data
 * @param {Date} options.endDate - End date for data
 * @param {string} options.eventType - Optional event type filter
 * @param {string} options.outputDir - Output directory
 * @returns {Promise<string>} Path to the exported file
 */
const exportEventsToJSON = async (options) => {
  const {
    tenantId,
    startDate,
    endDate,
    eventType,
    outputDir = path.join(process.cwd(), 'exports')
  } = options;
  
  try {
    // Ensure directory exists
    await ensureDirectoryExists(outputDir);
    
    // Get events
    const events = await analyticsService.getEventsByTenant(
      tenantId,
      startDate,
      endDate,
      eventType
    );
    
    if (events.length === 0) {
      logger.warn('No events found for export', { tenantId, startDate, endDate, eventType });
      return null;
    }
    
    // Format events for JSON
    const formattedEvents = events.map(event => ({
      eventId: event._id.toString(),
      tenantId: event.tenantId.toString(),
      userId: event.userId.toString(),
      sessionId: event.sessionId.toString(),
      eventType: event.eventType,
      timestamp: event.timestamp.toISOString(),
      eventData: event.eventData
    }));
    
    // Generate filename
    const startDateStr = formatDateForFilename(startDate || new Date(0));
    const endDateStr = formatDateForFilename(endDate || new Date());
    const eventTypeStr = eventType ? `-${eventType}` : '';
    const filename = `events-${tenantId}${eventTypeStr}-${startDateStr}-to-${endDateStr}.json`;
    const filePath = path.join(outputDir, filename);
    
    // Write file
    await fs.promises.writeFile(filePath, JSON.stringify(formattedEvents, null, 2));
    
    logger.info(`Exported ${events.length} events to JSON`, { tenantId, filePath });
    
    return filePath;
  } catch (error) {
    logger.error(`Error exporting events to JSON: ${error.message}`, { error, tenantId });
    throw error;
  }
};

/**
 * Export analytics events to Excel
 * @param {Object} options - Export options
 * @param {string} options.tenantId - Tenant ID
 * @param {Date} options.startDate - Start date for data
 * @param {Date} options.endDate - End date for data
 * @param {string} options.eventType - Optional event type filter
 * @param {string} options.outputDir - Output directory
 * @returns {Promise<string>} Path to the exported file
 */
const exportEventsToExcel = async (options) => {
  const {
    tenantId,
    startDate,
    endDate,
    eventType,
    outputDir = path.join(process.cwd(), 'exports')
  } = options;
  
  try {
    // Ensure directory exists
    await ensureDirectoryExists(outputDir);
    
    // Get events
    const events = await analyticsService.getEventsByTenant(
      tenantId,
      startDate,
      endDate,
      eventType
    );
    
    if (events.length === 0) {
      logger.warn('No events found for export', { tenantId, startDate, endDate, eventType });
      return null;
    }
    
    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Events');
    
    // Define columns
    worksheet.columns = [
      { header: 'Event ID', key: 'eventId', width: 24 },
      { header: 'Tenant ID', key: 'tenantId', width: 24 },
      { header: 'User ID', key: 'userId', width: 24 },
      { header: 'Session ID', key: 'sessionId', width: 24 },
      { header: 'Event Type', key: 'eventType', width: 20 },
      { header: 'Timestamp', key: 'timestamp', width: 20 },
      { header: 'Event Data', key: 'eventData', width: 50 }
    ];
    
    // Add rows
    events.forEach(event => {
      worksheet.addRow({
        eventId: event._id.toString(),
        tenantId: event.tenantId.toString(),
        userId: event.userId.toString(),
        sessionId: event.sessionId.toString(),
        eventType: event.eventType,
        timestamp: event.timestamp.toISOString(),
        eventData: JSON.stringify(event.eventData)
      });
    });
    
    // Format header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Generate filename
    const startDateStr = formatDateForFilename(startDate || new Date(0));
    const endDateStr = formatDateForFilename(endDate || new Date());
    const eventTypeStr = eventType ? `-${eventType}` : '';
    const filename = `events-${tenantId}${eventTypeStr}-${startDateStr}-to-${endDateStr}.xlsx`;
    const filePath = path.join(outputDir, filename);
    
    // Write file
    await workbook.xlsx.writeFile(filePath);
    
    logger.info(`Exported ${events.length} events to Excel`, { tenantId, filePath });
    
    return filePath;
  } catch (error) {
    logger.error(`Error exporting events to Excel: ${error.message}`, { error, tenantId });
    throw error;
  }
};

/**
 * Export analytics report to various formats
 * @param {Object} options - Export options
 * @param {string} options.tenantId - Tenant ID
 * @param {Date} options.startDate - Start date for data
 * @param {Date} options.endDate - End date for data
 * @param {string} options.format - Export format ('csv', 'json', 'excel')
 * @param {string} options.outputDir - Output directory
 * @returns {Promise<string>} Path to the exported file
 */
const exportAnalyticsReport = async (options) => {
  const {
    tenantId,
    startDate,
    endDate,
    format = 'json',
    outputDir = path.join(process.cwd(), 'exports')
  } = options;
  
  try {
    // Ensure directory exists
    await ensureDirectoryExists(outputDir);
    
    // Generate report
    const report = await analyticsService.generateAnalyticsReport(
      tenantId,
      startDate,
      endDate
    );
    
    // Generate filename
    const startDateStr = formatDateForFilename(startDate || new Date(0));
    const endDateStr = formatDateForFilename(endDate || new Date());
    const filename = `analytics-report-${tenantId}-${startDateStr}-to-${endDateStr}.${format === 'excel' ? 'xlsx' : format}`;
    const filePath = path.join(outputDir, filename);
    
    // Export based on format
    switch (format.toLowerCase()) {
      case 'csv':
        // Flatten report for CSV
        const flatReport = {
          tenantId,
          totalEvents: report.totalEvents,
          totalSessions: report.totalSessions,
          uniqueUsers: report.uniqueUsers,
          averageSessionDuration: report.sessionMetrics.averageDuration,
          startDate: startDate ? startDate.toISOString() : 'all',
          endDate: endDate ? endDate.toISOString() : 'all',
          eventBreakdown: JSON.stringify(report.eventBreakdown),
          deviceBreakdown: JSON.stringify(report.deviceBreakdown),
          browserBreakdown: JSON.stringify(report.browserBreakdown),
          locationBreakdown: JSON.stringify(report.locationBreakdown)
        };
        
        const fields = Object.keys(flatReport);
        const parser = new Parser({ fields });
        const csv = parser.parse([flatReport]);
        
        await fs.promises.writeFile(filePath, csv);
        break;
        
      case 'json':
        await fs.promises.writeFile(filePath, JSON.stringify({
          tenantId,
          dateRange: {
            start: startDate ? startDate.toISOString() : 'all',
            end: endDate ? endDate.toISOString() : 'all'
          },
          report
        }, null, 2));
        break;
        
      case 'excel':
        const workbook = new ExcelJS.Workbook();
        
        // Summary sheet
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
          { header: 'Metric', key: 'metric', width: 30 },
          { header: 'Value', key: 'value', width: 20 }
        ];
        
        summarySheet.addRow({ metric: 'Tenant ID', value: tenantId });
        summarySheet.addRow({ metric: 'Start Date', value: startDate ? startDate.toISOString() : 'all' });
        summarySheet.addRow({ metric: 'End Date', value: endDate ? endDate.toISOString() : 'all' });
        summarySheet.addRow({ metric: 'Total Events', value: report.totalEvents });
        summarySheet.addRow({ metric: 'Total Sessions', value: report.totalSessions });
        summarySheet.addRow({ metric: 'Unique Users', value: report.uniqueUsers });
        summarySheet.addRow({ metric: 'Average Session Duration (seconds)', value: report.sessionMetrics.averageDuration });
        
        // Format header row
        summarySheet.getRow(1).font = { bold: true };
        summarySheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Event breakdown sheet
        const eventSheet = workbook.addWorksheet('Event Breakdown');
        eventSheet.columns = [
          { header: 'Event Type', key: 'eventType', width: 30 },
          { header: 'Count', key: 'count', width: 20 }
        ];
        
        Object.entries(report.eventBreakdown).forEach(([eventType, count]) => {
          eventSheet.addRow({ eventType, count });
        });
        
        // Format header row
        eventSheet.getRow(1).font = { bold: true };
        eventSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        // Device breakdown sheet
        const deviceSheet = workbook.addWorksheet('Device Breakdown');
        deviceSheet.columns = [
          { header: 'Device', key: 'device', width: 30 },
          { header: 'Count', key: 'count', width: 20 }
        ];
        
        Object.entries(report.deviceBreakdown).forEach(([device, count]) => {
          deviceSheet.addRow({ device, count });
        });
        
        // Format header row
        deviceSheet.getRow(1).font = { bold: true };
        deviceSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        
        await workbook.xlsx.writeFile(filePath);
        break;
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    logger.info(`Exported analytics report to ${format.toUpperCase()}`, { tenantId, filePath });
    
    return filePath;
  } catch (error) {
    logger.error(`Error exporting analytics report: ${error.message}`, { error, tenantId });
    throw error;
  }
};

module.exports = {
  exportEventsToCSV,
  exportEventsToJSON,
  exportEventsToExcel,
  exportAnalyticsReport
};
