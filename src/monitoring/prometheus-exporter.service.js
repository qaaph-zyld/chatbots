/**
 * Prometheus Exporter Service
 * 
 * This service exports metrics from the chatbot platform in Prometheus format
 * for integration with Prometheus monitoring system and Grafana dashboards.
 */

const { logger } = require('../utils');
const { resourceMonitorService } = require('./resource-monitor.service');
const { rateLimiterService } = require('./rate-limiter.service');

/**
 * Prometheus Exporter Service class
 */
class PrometheusExporterService {
  /**
   * Initialize the Prometheus exporter service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      prefix: process.env.PROMETHEUS_METRIC_PREFIX || 'chatbot_',
      includeResourceMetrics: process.env.INCLUDE_RESOURCE_METRICS === 'true' || true,
      includeRateLimitMetrics: process.env.INCLUDE_RATE_LIMIT_METRICS === 'true' || true,
      includeConversationMetrics: process.env.INCLUDE_CONVERSATION_METRICS === 'true' || true,
      ...options
    };

    // Custom metrics
    this.customMetrics = new Map();

    logger.info('Prometheus Exporter Service initialized with options:', {
      prefix: this.options.prefix,
      includeResourceMetrics: this.options.includeResourceMetrics,
      includeRateLimitMetrics: this.options.includeRateLimitMetrics,
      includeConversationMetrics: this.options.includeConversationMetrics
    });
  }

  /**
   * Register a custom metric
   * @param {Object} metric - Metric configuration
   * @returns {boolean} - Success status
   */
  registerMetric(metric) {
    try {
      const { name, help, type, labels = [] } = metric;
      
      if (!name || !help || !type) {
        throw new Error('Metric name, help, and type are required');
      }
      
      if (!['counter', 'gauge', 'histogram', 'summary'].includes(type)) {
        throw new Error('Invalid metric type. Must be counter, gauge, histogram, or summary');
      }
      
      // Create metric
      const metricKey = this.options.prefix + name;
      
      this.customMetrics.set(metricKey, {
        name: metricKey,
        help,
        type,
        labels,
        values: new Map()
      });
      
      logger.info(`Registered custom metric: ${metricKey}`);
      return true;
    } catch (error) {
      logger.error('Error registering metric:', error.message);
      return false;
    }
  }

  /**
   * Set a metric value
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} labelValues - Label values
   * @returns {boolean} - Success status
   */
  setMetric(name, value, labelValues = {}) {
    try {
      const metricKey = this.options.prefix + name;
      const metric = this.customMetrics.get(metricKey);
      
      if (!metric) {
        throw new Error(`Metric ${metricKey} not found`);
      }
      
      // Validate label values
      const labelKeys = Object.keys(labelValues);
      
      for (const label of labelKeys) {
        if (!metric.labels.includes(label)) {
          throw new Error(`Label ${label} not defined for metric ${metricKey}`);
        }
      }
      
      // Create label string
      const labelString = labelKeys.length > 0 ?
        labelKeys.map(key => `${key}="${labelValues[key]}"`).join(',') : '';
      
      // Set value
      metric.values.set(labelString, value);
      
      return true;
    } catch (error) {
      logger.error('Error setting metric:', error.message);
      return false;
    }
  }

  /**
   * Increment a counter metric
   * @param {string} name - Metric name
   * @param {number} increment - Increment value
   * @param {Object} labelValues - Label values
   * @returns {boolean} - Success status
   */
  incrementMetric(name, increment = 1, labelValues = {}) {
    try {
      const metricKey = this.options.prefix + name;
      const metric = this.customMetrics.get(metricKey);
      
      if (!metric) {
        throw new Error(`Metric ${metricKey} not found`);
      }
      
      if (metric.type !== 'counter') {
        throw new Error(`Metric ${metricKey} is not a counter`);
      }
      
      // Validate label values
      const labelKeys = Object.keys(labelValues);
      
      for (const label of labelKeys) {
        if (!metric.labels.includes(label)) {
          throw new Error(`Label ${label} not defined for metric ${metricKey}`);
        }
      }
      
      // Create label string
      const labelString = labelKeys.length > 0 ?
        labelKeys.map(key => `${key}="${labelValues[key]}"`).join(',') : '';
      
      // Get current value
      const currentValue = metric.values.get(labelString) || 0;
      
      // Set new value
      metric.values.set(labelString, currentValue + increment);
      
      return true;
    } catch (error) {
      logger.error('Error incrementing metric:', error.message);
      return false;
    }
  }

  /**
   * Generate Prometheus metrics
   * @returns {string} - Prometheus metrics
   */
  async generateMetrics() {
    try {
      let output = '# Chatbot Platform Metrics\n\n';
      
      // Add resource metrics
      if (this.options.includeResourceMetrics) {
        output += await this._generateResourceMetrics();
      }
      
      // Add rate limit metrics
      if (this.options.includeRateLimitMetrics) {
        output += this._generateRateLimitMetrics();
      }
      
      // Add conversation metrics
      if (this.options.includeConversationMetrics) {
        output += this._generateConversationMetrics();
      }
      
      // Add custom metrics
      output += this._generateCustomMetrics();
      
      return output;
    } catch (error) {
      logger.error('Error generating metrics:', error.message);
      return '# Error generating metrics: ' + error.message;
    }
  }

  /**
   * Generate resource metrics
   * @returns {Promise<string>} - Resource metrics
   * @private
   */
  async _generateResourceMetrics() {
    try {
      let output = '# HELP chatbot_cpu_usage CPU usage percentage\n';
      output += '# TYPE chatbot_cpu_usage gauge\n';
      
      // Get current metrics
      const metrics = await resourceMonitorService.getCurrentMetrics();
      
      // Add CPU metrics
      output += `chatbot_cpu_usage ${metrics.cpu.usage}\n`;
      
      // Add CPU core metrics
      output += '\n# HELP chatbot_cpu_core_usage CPU core usage percentage\n';
      output += '# TYPE chatbot_cpu_core_usage gauge\n';
      
      metrics.cpu.cores.forEach(core => {
        output += `chatbot_cpu_core_usage{core="${core.core}"} ${core.usage}\n`;
      });
      
      // Add memory metrics
      output += '\n# HELP chatbot_memory_usage Memory usage percentage\n';
      output += '# TYPE chatbot_memory_usage gauge\n';
      output += `chatbot_memory_usage ${metrics.memory.usage}\n`;
      
      output += '\n# HELP chatbot_memory_used Memory used in bytes\n';
      output += '# TYPE chatbot_memory_used gauge\n';
      output += `chatbot_memory_used ${metrics.memory.used}\n`;
      
      output += '\n# HELP chatbot_memory_total Total memory in bytes\n';
      output += '# TYPE chatbot_memory_total gauge\n';
      output += `chatbot_memory_total ${metrics.memory.total}\n`;
      
      // Add disk metrics
      output += '\n# HELP chatbot_disk_usage Disk usage percentage\n';
      output += '# TYPE chatbot_disk_usage gauge\n';
      output += `chatbot_disk_usage{path="${metrics.disk.path}"} ${metrics.disk.usage}\n`;
      
      return output;
    } catch (error) {
      logger.error('Error generating resource metrics:', error.message);
      return '# Error generating resource metrics: ' + error.message + '\n';
    }
  }

  /**
   * Generate rate limit metrics
   * @returns {string} - Rate limit metrics
   * @private
   */
  _generateRateLimitMetrics() {
    try {
      let output = '\n# HELP chatbot_rate_limit_remaining Remaining rate limit tokens\n';
      output += '# TYPE chatbot_rate_limit_remaining gauge\n';
      
      // Get all limiters
      const limiters = rateLimiterService.getAllLimiters();
      
      // Add rate limit metrics
      limiters.forEach(limiter => {
        output += `chatbot_rate_limit_remaining{identifier="${limiter.identifier}"} ${limiter.remaining}\n`;
      });
      
      output += '\n# HELP chatbot_rate_limit_max Maximum rate limit tokens\n';
      output += '# TYPE chatbot_rate_limit_max gauge\n';
      
      limiters.forEach(limiter => {
        output += `chatbot_rate_limit_max{identifier="${limiter.identifier}"} ${limiter.limit}\n`;
      });
      
      return output;
    } catch (error) {
      logger.error('Error generating rate limit metrics:', error.message);
      return '# Error generating rate limit metrics: ' + error.message + '\n';
    }
  }

  /**
   * Generate custom metrics
   * @returns {string} - Custom metrics
   * @private
   */
  _generateCustomMetrics() {
    try {
      let output = '\n';
      
      // Add custom metrics
      for (const [key, metric] of this.customMetrics.entries()) {
        output += `# HELP ${metric.name} ${metric.help}\n`;
        output += `# TYPE ${metric.name} ${metric.type}\n`;
        
        for (const [labels, value] of metric.values.entries()) {
          const labelStr = labels ? `{${labels}}` : '';
          output += `${metric.name}${labelStr} ${value}\n`;
        }
        
        output += '\n';
      }
      
      return output;
    } catch (error) {
      logger.error('Error generating custom metrics:', error.message);
      return '# Error generating custom metrics: ' + error.message + '\n';
    }
  }

  /**
   * Create a Grafana dashboard configuration
   * @returns {Object} - Grafana dashboard configuration
   */
  createGrafanaDashboard() {
    try {
      // Create a basic Grafana dashboard configuration
      const dashboard = {
        title: 'Chatbot Platform Dashboard',
        uid: 'chatbot-platform',
        timezone: 'browser',
        schemaVersion: 30,
        version: 1,
        refresh: '10s',
        panels: []
      };
      
      // Add CPU usage panel
      dashboard.panels.push({
        id: 1,
        title: 'CPU Usage',
        type: 'gauge',
        gridPos: {
          h: 8,
          w: 8,
          x: 0,
          y: 0
        },
        targets: [
          {
            expr: 'chatbot_cpu_usage',
            refId: 'A'
          }
        ],
        options: {
          reduceOptions: {
            values: false,
            calcs: ['lastNotNull'],
            fields: ''
          },
          orientation: 'auto',
          showThresholdLabels: false,
          showThresholdMarkers: true,
          thresholds: {
            mode: 'absolute',
            steps: [
              { value: 0, color: 'green' },
              { value: 70, color: 'yellow' },
              { value: 85, color: 'red' }
            ]
          }
        },
        fieldConfig: {
          defaults: {
            min: 0,
            max: 100,
            unit: 'percent'
          }
        }
      });
      
      // Add memory usage panel
      dashboard.panels.push({
        id: 2,
        title: 'Memory Usage',
        type: 'gauge',
        gridPos: {
          h: 8,
          w: 8,
          x: 8,
          y: 0
        },
        targets: [
          {
            expr: 'chatbot_memory_usage',
            refId: 'A'
          }
        ],
        options: {
          reduceOptions: {
            values: false,
            calcs: ['lastNotNull'],
            fields: ''
          },
          orientation: 'auto',
          showThresholdLabels: false,
          showThresholdMarkers: true,
          thresholds: {
            mode: 'absolute',
            steps: [
              { value: 0, color: 'green' },
              { value: 70, color: 'yellow' },
              { value: 85, color: 'red' }
            ]
          }
        },
        fieldConfig: {
          defaults: {
            min: 0,
            max: 100,
            unit: 'percent'
          }
        }
      });
      
      // Add disk usage panel
      dashboard.panels.push({
        id: 3,
        title: 'Disk Usage',
        type: 'gauge',
        gridPos: {
          h: 8,
          w: 8,
          x: 16,
          y: 0
        },
        targets: [
          {
            expr: 'chatbot_disk_usage',
            refId: 'A'
          }
        ],
        options: {
          reduceOptions: {
            values: false,
            calcs: ['lastNotNull'],
            fields: ''
          },
          orientation: 'auto',
          showThresholdLabels: false,
          showThresholdMarkers: true,
          thresholds: {
            mode: 'absolute',
            steps: [
              { value: 0, color: 'green' },
              { value: 70, color: 'yellow' },
              { value: 90, color: 'red' }
            ]
          }
        },
        fieldConfig: {
          defaults: {
            min: 0,
            max: 100,
            unit: 'percent'
          }
        }
      });
      
      // Add CPU usage history panel
      dashboard.panels.push({
        id: 4,
        title: 'CPU Usage History',
        type: 'graph',
        gridPos: {
          h: 8,
          w: 12,
          x: 0,
          y: 8
        },
        targets: [
          {
            expr: 'chatbot_cpu_usage',
            refId: 'A',
            legendFormat: 'CPU Usage'
          }
        ],
        options: {
          legend: {
            show: true
          }
        },
        fieldConfig: {
          defaults: {
            unit: 'percent'
          }
        }
      });
      
      // Add memory usage history panel
      dashboard.panels.push({
        id: 5,
        title: 'Memory Usage History',
        type: 'graph',
        gridPos: {
          h: 8,
          w: 12,
          x: 12,
          y: 8
        },
        targets: [
          {
            expr: 'chatbot_memory_usage',
            refId: 'A',
            legendFormat: 'Memory Usage'
          }
        ],
        options: {
          legend: {
            show: true
          }
        },
        fieldConfig: {
          defaults: {
            unit: 'percent'
          }
        }
      });
      
      // Add rate limit panel
      dashboard.panels.push({
        id: 6,
        title: 'Rate Limits',
        type: 'table',
        gridPos: {
          h: 8,
          w: 24,
          x: 0,
          y: 16
        },
        targets: [
          {
            expr: 'chatbot_rate_limit_remaining',
            refId: 'A',
            instant: true,
            format: 'table'
          },
          {
            expr: 'chatbot_rate_limit_max',
            refId: 'B',
            instant: true,
            format: 'table'
          }
        ],
        transformations: [
          {
            id: 'merge',
            options: {}
          }
        ],
        options: {
          showHeader: true
        },
        fieldConfig: {
          defaults: {
            custom: {
              align: 'auto'
            }
          },
          overrides: []
        }
      });
      
      return dashboard;
    } catch (error) {
      logger.error('Error creating Grafana dashboard:', error.message);
      return null;
    }
  }
  /**
   * Generate conversation metrics
   * @returns {string} - Conversation metrics
   * @private
   */
  _generateConversationMetrics() {
    try {
      let output = '# HELP chatbot_conversation_count Total number of conversations\n';
      output += '# TYPE chatbot_conversation_count counter\n';
      output += `chatbot_conversation_count ${Math.floor(Math.random() * 1000)}\n\n`; // Placeholder for demo
      
      output += '# HELP chatbot_message_count Total number of messages\n';
      output += '# TYPE chatbot_message_count counter\n';
      output += `chatbot_message_count ${Math.floor(Math.random() * 10000)}\n\n`; // Placeholder for demo
      
      output += '# HELP chatbot_avg_response_time Average response time in milliseconds\n';
      output += '# TYPE chatbot_avg_response_time gauge\n';
      output += `chatbot_avg_response_time ${Math.floor(Math.random() * 500)}\n\n`; // Placeholder for demo
      
      return output;
    } catch (error) {
      logger.error('Error generating conversation metrics:', error.message);
      return '# Error generating conversation metrics: ' + error.message + '\n';
    }
  }

  /**
   * Create a Grafana dashboard for the chatbot platform
   * @returns {Object} - Grafana dashboard JSON
   */
  createGrafanaDashboard() {
    try {
      // Create dashboard object
      const dashboard = {
        title: 'Chatbot Platform Dashboard',
        uid: 'chatbot-platform',
        tags: ['chatbot', 'monitoring', 'prometheus'],
        timezone: 'browser',
        schemaVersion: 30,
        version: 1,
        refresh: '10s',
        panels: []
      };
      
      // Add resource usage panels
      if (this.options.includeResourceMetrics) {
        // CPU Usage panel
        dashboard.panels.push({
          id: 1,
          gridPos: { h: 8, w: 12, x: 0, y: 0 },
          type: 'graph',
          title: 'CPU Usage',
          description: 'CPU usage percentage over time',
          datasource: 'Prometheus',
          targets: [
            {
              expr: 'chatbot_cpu_usage',
              legendFormat: 'CPU Usage %',
              refId: 'A'
            }
          ],
          yaxes: [
            { format: 'percent', min: 0, max: 100 },
            { format: 'short' }
          ]
        });
        
        // Memory Usage panel
        dashboard.panels.push({
          id: 2,
          gridPos: { h: 8, w: 12, x: 12, y: 0 },
          type: 'graph',
          title: 'Memory Usage',
          description: 'Memory usage percentage over time',
          datasource: 'Prometheus',
          targets: [
            {
              expr: 'chatbot_memory_usage',
              legendFormat: 'Memory Usage %',
              refId: 'A'
            }
          ],
          yaxes: [
            { format: 'percent', min: 0, max: 100 },
            { format: 'short' }
          ]
        });
        
        // Disk Usage panel
        dashboard.panels.push({
          id: 3,
          gridPos: { h: 8, w: 12, x: 0, y: 8 },
          type: 'gauge',
          title: 'Disk Usage',
          description: 'Current disk usage percentage',
          datasource: 'Prometheus',
          targets: [
            {
              expr: 'chatbot_disk_usage',
              refId: 'A'
            }
          ],
          options: {
            thresholds: [
              { color: 'green', value: 0 },
              { color: 'orange', value: 70 },
              { color: 'red', value: 90 }
            ]
          }
        });
      }
      
      // Add rate limit panels
      if (this.options.includeRateLimitMetrics) {
        // Rate limit usage panel
        dashboard.panels.push({
          id: 4,
          gridPos: { h: 8, w: 12, x: 12, y: 8 },
          type: 'graph',
          title: 'Rate Limit Usage',
          description: 'Rate limit usage percentage over time',
          datasource: 'Prometheus',
          targets: [
            {
              expr: 'chatbot_rate_limit_usage',
              legendFormat: 'Rate Limit Usage %',
              refId: 'A'
            }
          ],
          yaxes: [
            { format: 'percent', min: 0, max: 100 },
            { format: 'short' }
          ]
        });
        
        // Rate limit violations panel
        dashboard.panels.push({
          id: 5,
          gridPos: { h: 8, w: 24, x: 0, y: 16 },
          type: 'graph',
          title: 'Rate Limit Violations',
          description: 'Number of rate limit violations over time',
          datasource: 'Prometheus',
          targets: [
            {
              expr: 'chatbot_rate_limit_violations_total',
              legendFormat: 'Violations',
              refId: 'A'
            }
          ]
        });
      }
      
      // Add conversation metrics panels
      if (this.options.includeConversationMetrics) {
        // Conversation count panel
        dashboard.panels.push({
          id: 6,
          gridPos: { h: 8, w: 8, x: 0, y: 24 },
          type: 'stat',
          title: 'Total Conversations',
          description: 'Total number of conversations',
          datasource: 'Prometheus',
          targets: [
            {
              expr: 'chatbot_conversation_count',
              refId: 'A'
            }
          ],
          options: {
            colorMode: 'value',
            graphMode: 'area',
            justifyMode: 'auto'
          }
        });
        
        // Message count panel
        dashboard.panels.push({
          id: 7,
          gridPos: { h: 8, w: 8, x: 8, y: 24 },
          type: 'stat',
          title: 'Total Messages',
          description: 'Total number of messages',
          datasource: 'Prometheus',
          targets: [
            {
              expr: 'chatbot_message_count',
              refId: 'A'
            }
          ],
          options: {
            colorMode: 'value',
            graphMode: 'area',
            justifyMode: 'auto'
          }
        });
        
        // Response time panel
        dashboard.panels.push({
          id: 8,
          gridPos: { h: 8, w: 8, x: 16, y: 24 },
          type: 'graph',
          title: 'Average Response Time',
          description: 'Average response time in milliseconds',
          datasource: 'Prometheus',
          targets: [
            {
              expr: 'chatbot_avg_response_time',
              legendFormat: 'Response Time (ms)',
              refId: 'A'
            }
          ]
        });
      }
      
      // Add custom metrics panels
      let panelId = 9;
      let yPos = 32;
      
      for (const [metricKey, metric] of this.customMetrics.entries()) {
        if (metric.type === 'counter' || metric.type === 'gauge') {
          dashboard.panels.push({
            id: panelId++,
            gridPos: { h: 8, w: 12, x: panelId % 2 === 0 ? 12 : 0, y: yPos },
            type: metric.type === 'counter' ? 'graph' : 'gauge',
            title: metric.name.replace(this.options.prefix, '').replace(/_/g, ' '),
            description: metric.help,
            datasource: 'Prometheus',
            targets: [
              {
                expr: metric.name,
                refId: 'A'
              }
            ]
          });
          
          if (panelId % 2 === 0) {
            yPos += 8;
          }
        }
      }
      
      return dashboard;
    } catch (error) {
      logger.error('Error creating Grafana dashboard:', error.message);
      return {
        title: 'Error Dashboard',
        panels: [{
          id: 1,
          title: 'Error',
          type: 'text',
          content: `Error creating dashboard: ${error.message}`
        }]
      };
    }
  }
}

// Create and export service instance
const prometheusExporterService = new PrometheusExporterService();

module.exports = {
  PrometheusExporterService,
  prometheusExporterService
};
