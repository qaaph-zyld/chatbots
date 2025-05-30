/**
 * Report Builder Service
 * 
 * This service provides functionality for creating customized analytics reports
 * from various data sources in the chatbot platform.
 */

// Use mock utilities for testing
const { logger, generateUuid } = require('./test-utils');

/**
 * Report Builder Service class
 */
class ReportBuilderService {
  /**
   * Initialize the report builder service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      maxReportItems: parseInt(process.env.MAX_REPORT_ITEMS || '1000'),
      defaultDateFormat: process.env.DEFAULT_DATE_FORMAT || 'YYYY-MM-DD',
      enabledExportFormats: (process.env.ENABLED_EXPORT_FORMATS || 'json,csv,html,pdf').split(','),
      ...options
    };

    // Report templates and generated reports storage
    this.templates = new Map();
    this.reports = new Map();
    this.dataSources = new Map();

    logger.info('Report Builder Service initialized with options:', {
      maxReportItems: this.options.maxReportItems,
      defaultDateFormat: this.options.defaultDateFormat,
      enabledExportFormats: this.options.enabledExportFormats
    });
  }

  /**
   * Register a data source for reports
   * @param {Object} dataSourceConfig - Data source configuration
   * @returns {Object} - Registration result
   */
  registerDataSource(dataSourceConfig) {
    try {
      const {
        id,
        name,
        description = '',
        fetchFunction,
        schema = {},
        defaultFilters = {},
        tags = []
      } = dataSourceConfig;

      if (!id) {
        throw new Error('Data source ID is required');
      }

      if (!name) {
        throw new Error('Data source name is required');
      }

      if (!fetchFunction || typeof fetchFunction !== 'function') {
        throw new Error('Fetch function is required and must be a function');
      }

      // Create data source object
      const dataSource = {
        id,
        name,
        description,
        fetchFunction,
        schema,
        defaultFilters,
        tags,
        registeredAt: new Date().toISOString()
      };

      // Store data source
      this.dataSources.set(id, dataSource);

      logger.info('Registered data source:', { id, name });
      return {
        success: true,
        dataSource: {
          id: dataSource.id,
          name: dataSource.name,
          description: dataSource.description,
          schema: dataSource.schema,
          defaultFilters: dataSource.defaultFilters,
          tags: dataSource.tags,
          registeredAt: dataSource.registeredAt
        }
      };
    } catch (error) {
      logger.error('Error registering data source:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a report template
   * @param {Object} templateConfig - Template configuration
   * @returns {Object} - Template details
   */
  createTemplate(templateConfig) {
    try {
      const {
        name,
        description = '',
        sections = [],
        parameters = [],
        defaultParameters = {},
        schedule = null,
        tags = []
      } = templateConfig;

      if (!name) {
        throw new Error('Template name is required');
      }

      // Validate sections
      if (!sections || sections.length === 0) {
        throw new Error('At least one section is required');
      }

      for (const section of sections) {
        if (!section.dataSourceId) {
          throw new Error('Data source ID is required for each section');
        }

        if (!this.dataSources.has(section.dataSourceId)) {
          throw new Error(`Data source with ID ${section.dataSourceId} not found`);
        }
      }

      // Generate template ID
      const templateId = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

      // Create template object
      const template = {
        id: templateId,
        name,
        description,
        sections,
        parameters,
        defaultParameters,
        schedule,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store template
      this.templates.set(templateId, template);

      logger.info('Created report template:', { templateId, name });
      return {
        success: true,
        template: {
          ...template
        }
      };
    } catch (error) {
      logger.error('Error creating template:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate a report from a template
   * @param {string} templateId - Template ID
   * @param {Object} parameters - Report parameters
   * @returns {Promise<Object>} - Generated report
   */
  async generateReport(templateId, parameters = {}) {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template with ID ${templateId} not found`);
      }

      logger.info(`Generating report from template: ${template.name}`, {
        templateId,
        parameters
      });

      // Merge default parameters with provided parameters
      const mergedParameters = {
        ...template.defaultParameters,
        ...parameters
      };

      // Initialize report
      const reportId = `report-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const report = {
        id: reportId,
        templateId,
        name: template.name,
        description: template.description,
        parameters: mergedParameters,
        sections: [],
        createdAt: new Date().toISOString(),
        status: 'generating',
        error: null
      };

      // Generate each section
      for (const sectionTemplate of template.sections) {
        try {
          const dataSource = this.dataSources.get(sectionTemplate.dataSourceId);
          
          // Prepare filters for this section
          const sectionFilters = {
            ...dataSource.defaultFilters,
            ...mergedParameters,
            ...sectionTemplate.filters
          };
          
          // Fetch data
          const data = await dataSource.fetchFunction(sectionFilters);
          
          // Apply transformations if specified
          let transformedData = data;
          if (sectionTemplate.transformations && sectionTemplate.transformations.length > 0) {
            transformedData = this._applyTransformations(data, sectionTemplate.transformations);
          }
          
          // Limit data size if needed
          const limitedData = this._limitDataSize(transformedData);
          
          // Create section
          const section = {
            title: sectionTemplate.title || dataSource.name,
            description: sectionTemplate.description || '',
            dataSourceId: dataSource.id,
            filters: sectionFilters,
            data: limitedData,
            metadata: {
              count: Array.isArray(limitedData) ? limitedData.length : 1,
              truncated: Array.isArray(data) && data.length > this.options.maxReportItems
            }
          };
          
          report.sections.push(section);
        } catch (error) {
          // Add error information to the section
          report.sections.push({
            title: sectionTemplate.title || 'Error Section',
            description: sectionTemplate.description || '',
            dataSourceId: sectionTemplate.dataSourceId,
            error: error.message,
            data: []
          });
          
          logger.error(`Error generating section: ${sectionTemplate.title}`, error.message);
        }
      }

      // Update report status
      report.status = 'completed';
      report.completedAt = new Date().toISOString();

      // Store report
      this.reports.set(reportId, report);

      logger.info(`Report generated: ${report.name}`, { reportId });
      return {
        success: true,
        report: {
          id: report.id,
          name: report.name,
          description: report.description,
          parameters: report.parameters,
          sections: report.sections.map(section => ({
            title: section.title,
            description: section.description,
            dataSourceId: section.dataSourceId,
            metadata: section.metadata,
            error: section.error
          })),
          createdAt: report.createdAt,
          completedAt: report.completedAt,
          status: report.status
        }
      };
    } catch (error) {
      logger.error('Error generating report:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export a report in the specified format
   * @param {string} reportId - Report ID
   * @param {string} format - Export format (json, csv, html, pdf)
   * @returns {Promise<Object>} - Exported report
   */
  async exportReport(reportId, format = 'json') {
    try {
      const report = this.reports.get(reportId);
      if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
      }

      // Check if format is enabled
      if (!this.options.enabledExportFormats.includes(format)) {
        throw new Error(`Export format ${format} is not enabled`);
      }

      logger.info(`Exporting report in ${format} format: ${report.name}`, { reportId });

      let exportedData;
      switch (format.toLowerCase()) {
        case 'json':
          exportedData = this._exportAsJson(report);
          break;
        case 'csv':
          exportedData = this._exportAsCsv(report);
          break;
        case 'html':
          exportedData = this._exportAsHtml(report);
          break;
        case 'pdf':
          exportedData = await this._exportAsPdf(report);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return {
        success: true,
        data: exportedData,
        format,
        reportId,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error exporting report:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a list of available data sources
   * @returns {Array} - List of data sources
   */
  getDataSources() {
    const sources = [];
    for (const [id, dataSource] of this.dataSources.entries()) {
      sources.push({
        id: dataSource.id,
        name: dataSource.name,
        description: dataSource.description,
        schema: dataSource.schema,
        tags: dataSource.tags
      });
    }
    return sources;
  }

  /**
   * Get a list of available templates
   * @returns {Array} - List of templates
   */
  getTemplates() {
    const templateList = [];
    for (const [id, template] of this.templates.entries()) {
      templateList.push({
        id: template.id,
        name: template.name,
        description: template.description,
        parameters: template.parameters,
        sections: template.sections.map(section => ({
          title: section.title,
          dataSourceId: section.dataSourceId
        })),
        tags: template.tags,
        createdAt: template.createdAt
      });
    }
    return templateList;
  }

  /**
   * Get a list of generated reports
   * @returns {Array} - List of reports
   */
  getReports() {
    const reportList = [];
    for (const [id, report] of this.reports.entries()) {
      reportList.push({
        id: report.id,
        name: report.name,
        description: report.description,
        templateId: report.templateId,
        status: report.status,
        createdAt: report.createdAt,
        completedAt: report.completedAt
      });
    }
    return reportList;
  }

  /**
   * Apply transformations to data
   * @param {Array|Object} data - Data to transform
   * @param {Array} transformations - Transformations to apply
   * @returns {Array|Object} - Transformed data
   * @private
   */
  _applyTransformations(data, transformations) {
    let result = data;
    
    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'filter':
          if (Array.isArray(result)) {
            result = result.filter(item => {
              try {
                // Simple evaluation of filter condition
                const { field, operator, value } = transformation.condition;
                
                switch (operator) {
                  case 'eq': return item[field] === value;
                  case 'neq': return item[field] !== value;
                  case 'gt': return item[field] > value;
                  case 'gte': return item[field] >= value;
                  case 'lt': return item[field] < value;
                  case 'lte': return item[field] <= value;
                  case 'contains': return String(item[field]).includes(value);
                  case 'startsWith': return String(item[field]).startsWith(value);
                  case 'endsWith': return String(item[field]).endsWith(value);
                  default: return true;
                }
              } catch (error) {
                logger.warn('Error applying filter transformation:', error.message);
                return true;
              }
            });
          }
          break;
          
        case 'sort':
          if (Array.isArray(result)) {
            const { field, direction = 'asc' } = transformation;
            result = [...result].sort((a, b) => {
              if (direction.toLowerCase() === 'asc') {
                return a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
              } else {
                return a[field] > b[field] ? -1 : a[field] < b[field] ? 1 : 0;
              }
            });
          }
          break;
          
        case 'group':
          if (Array.isArray(result)) {
            const { field, aggregations = [] } = transformation;
            const groups = {};
            
            // Group items
            for (const item of result) {
              const key = item[field];
              if (!groups[key]) {
                groups[key] = [];
              }
              groups[key].push(item);
            }
            
            // Apply aggregations
            const aggregatedResult = [];
            for (const [key, items] of Object.entries(groups)) {
              const group = { [field]: key };
              
              for (const agg of aggregations) {
                const { name, type, field: aggField } = agg;
                
                switch (type) {
                  case 'count':
                    group[name] = items.length;
                    break;
                  case 'sum':
                    group[name] = items.reduce((sum, item) => sum + (Number(item[aggField]) || 0), 0);
                    break;
                  case 'avg':
                    group[name] = items.reduce((sum, item) => sum + (Number(item[aggField]) || 0), 0) / items.length;
                    break;
                  case 'min':
                    group[name] = Math.min(...items.map(item => Number(item[aggField]) || 0));
                    break;
                  case 'max':
                    group[name] = Math.max(...items.map(item => Number(item[aggField]) || 0));
                    break;
                }
              }
              
              aggregatedResult.push(group);
            }
            
            result = aggregatedResult;
          }
          break;
          
        case 'select':
          if (Array.isArray(result)) {
            const { fields } = transformation;
            result = result.map(item => {
              const newItem = {};
              for (const field of fields) {
                newItem[field] = item[field];
              }
              return newItem;
            });
          }
          break;
          
        case 'limit':
          if (Array.isArray(result)) {
            const { count = 10, offset = 0 } = transformation;
            result = result.slice(offset, offset + count);
          }
          break;
      }
    }
    
    return result;
  }

  /**
   * Limit data size to prevent memory issues
   * @param {Array|Object} data - Data to limit
   * @returns {Array|Object} - Limited data
   * @private
   */
  _limitDataSize(data) {
    if (Array.isArray(data) && data.length > this.options.maxReportItems) {
      return data.slice(0, this.options.maxReportItems);
    }
    return data;
  }

  /**
   * Export report as JSON
   * @param {Object} report - Report to export
   * @returns {string} - JSON string
   * @private
   */
  _exportAsJson(report) {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as CSV
   * @param {Object} report - Report to export
   * @returns {string} - CSV string
   * @private
   */
  _exportAsCsv(report) {
    let csv = '';
    
    // Process each section
    for (const section of report.sections) {
      if (!section.data || section.error) continue;
      
      csv += `# ${section.title}\n`;
      
      if (Array.isArray(section.data) && section.data.length > 0) {
        // Get headers from first item
        const headers = Object.keys(section.data[0]);
        csv += headers.join(',') + '\n';
        
        // Add data rows
        for (const item of section.data) {
          const row = headers.map(header => {
            const value = item[header];
            // Handle values that need escaping
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value);
          });
          
          csv += row.join(',') + '\n';
        }
      }
      
      csv += '\n';
    }
    
    return csv;
  }

  /**
   * Export report as HTML
   * @param {Object} report - Report to export
   * @returns {string} - HTML string
   * @private
   */
  _exportAsHtml(report) {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${report.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          h2 { color: #666; margin-top: 30px; }
          table { border-collapse: collapse; width: 100%; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .report-info { margin-bottom: 30px; }
          .error { color: red; }
        </style>
      </head>
      <body>
        <h1>${report.name}</h1>
        <div class="report-info">
          <p>${report.description || ''}</p>
          <p><strong>Generated:</strong> ${report.createdAt}</p>
        </div>
    `;
    
    // Add parameters section if there are parameters
    if (Object.keys(report.parameters).length > 0) {
      html += `
        <h2>Parameters</h2>
        <table>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
          </tr>
      `;
      
      for (const [key, value] of Object.entries(report.parameters)) {
        html += `
          <tr>
            <td>${key}</td>
            <td>${value}</td>
          </tr>
        `;
      }
      
      html += '</table>';
    }
    
    // Process each section
    for (const section of report.sections) {
      html += `<h2>${section.title}</h2>`;
      html += `<p>${section.description || ''}</p>`;
      
      if (section.error) {
        html += `<p class="error">Error: ${section.error}</p>`;
        continue;
      }
      
      if (!section.data) continue;
      
      if (Array.isArray(section.data) && section.data.length > 0) {
        // Get headers from first item
        const headers = Object.keys(section.data[0]);
        
        html += '<table><tr>';
        for (const header of headers) {
          html += `<th>${header}</th>`;
        }
        html += '</tr>';
        
        // Add data rows
        for (const item of section.data) {
          html += '<tr>';
          for (const header of headers) {
            html += `<td>${item[header] !== undefined && item[header] !== null ? item[header] : ''}</td>`;
          }
          html += '</tr>';
        }
        
        html += '</table>';
        
        if (section.metadata && section.metadata.truncated) {
          html += `<p><em>Note: Data has been truncated to ${this.options.maxReportItems} items.</em></p>`;
        }
      } else if (typeof section.data === 'object') {
        // Display object as key-value pairs
        html += '<table>';
        for (const [key, value] of Object.entries(section.data)) {
          html += `
            <tr>
              <td><strong>${key}</strong></td>
              <td>${value !== undefined && value !== null ? value : ''}</td>
            </tr>
          `;
        }
        html += '</table>';
      }
    }
    
    html += `
      </body>
      </html>
    `;
    
    return html;
  }

  /**
   * Export report as PDF
   * @param {Object} report - Report to export
   * @returns {Promise<Buffer>} - PDF buffer
   * @private
   */
  async _exportAsPdf(report) {
    // In a real implementation, this would use a PDF generation library
    // For this example, we'll just return a message
    const html = this._exportAsHtml(report);
    return `PDF generation would convert the following HTML to PDF: ${html.length} characters`;
  }
}

// Create and export service instance
const reportBuilderService = new ReportBuilderService();

module.exports = {
  ReportBuilderService,
  reportBuilderService
};
