/**
 * Audit Logging Service
 * 
 * This service provides comprehensive audit logging capabilities for the chatbot platform,
 * recording all security-relevant events and actions for compliance and security monitoring.
 */

// Use mock utilities for testing
require('@src/utils\mock-utils');

/**
 * Audit Logging Service class
 */
class AuditLoggingService {
  /**
   * Initialize the audit logging service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      retentionPeriod: parseInt(process.env.AUDIT_RETENTION_DAYS || '365'),
      logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
      enabledCategories: (process.env.AUDIT_ENABLED_CATEGORIES || 'authentication,authorization,data,system').split(','),
      storageType: process.env.AUDIT_STORAGE_TYPE || 'memory',
      ...options
    };

    // Storage for audit logs
    this.auditLogs = [];
    this.eventTypes = new Map();

    // Initialize default event types
    this._initializeDefaultEventTypes();

    logger.info('Audit Logging Service initialized with options:', {
      retentionPeriod: this.options.retentionPeriod,
      logLevel: this.options.logLevel,
      enabledCategories: this.options.enabledCategories,
      storageType: this.options.storageType
    });
  }

  /**
   * Log an audit event
   * @param {Object} eventData - Event data
   * @returns {Object} - Logging result
   */
  logEvent(eventData) {
    try {
      const { 
        eventType, 
        userId, 
        resourceType, 
        resourceId, 
        action, 
        status, 
        details,
        ipAddress,
        userAgent
      } = eventData;

      if (!eventType) {
        throw new Error('Event type is required');
      }

      // Check if event type exists
      const eventTypeInfo = this.eventTypes.get(eventType);
      if (!eventTypeInfo) {
        throw new Error(`Event type '${eventType}' is not registered`);
      }

      // Check if category is enabled
      if (!this.options.enabledCategories.includes(eventTypeInfo.category)) {
        return { 
          success: true, 
          message: `Event category '${eventTypeInfo.category}' is disabled, event not logged`,
          logged: false
        };
      }

      // Generate event ID
      const eventId = generateUuid();

      // Create event object
      const event = {
        id: eventId,
        timestamp: new Date().toISOString(),
        eventType,
        category: eventTypeInfo.category,
        severity: eventTypeInfo.severity,
        userId: userId || 'system',
        resourceType: resourceType || null,
        resourceId: resourceId || null,
        action: action || null,
        status: status || 'success',
        details: details || {},
        ipAddress: ipAddress || null,
        userAgent: userAgent || null
      };

      // Store event
      this.auditLogs.push(event);

      // Purge old logs if needed
      this._purgeOldLogs();

      logger.debug(`Audit event logged: ${eventType}`, { eventId });
      return { success: true, event, logged: true };
    } catch (error) {
      logger.error('Error logging audit event:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register a new event type
   * @param {Object} eventTypeData - Event type data
   * @returns {Object} - Registration result
   */
  registerEventType(eventTypeData) {
    try {
      const { name, description, category, severity } = eventTypeData;

      if (!name) {
        throw new Error('Event type name is required');
      }

      if (!category) {
        throw new Error('Event type category is required');
      }

      if (!severity || !['low', 'medium', 'high', 'critical'].includes(severity)) {
        throw new Error("Event type severity is required and must be one of 'low', 'medium', 'high', or 'critical'");
      }

      // Check if event type already exists
      if (this.eventTypes.has(name)) {
        throw new Error(`Event type '${name}' already exists`);
      }

      // Create event type object
      const eventType = {
        name,
        description: description || '',
        category,
        severity,
        createdAt: new Date().toISOString()
      };

      // Store event type
      this.eventTypes.set(name, eventType);

      logger.info(`Registered audit event type: ${name}`, { category, severity });
      return { success: true, eventType };
    } catch (error) {
      logger.error('Error registering audit event type:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get audit logs with filtering
   * @param {Object} filters - Filters to apply
   * @returns {Object} - Filtered logs
   */
  getLogs(filters = {}) {
    try {
      const { 
        startDate, 
        endDate, 
        userId, 
        eventType, 
        category, 
        severity, 
        resourceType, 
        resourceId,
        status,
        limit,
        offset
      } = filters;

      // Apply filters
      let filteredLogs = [...this.auditLogs];

      if (startDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
      }

      if (endDate) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
      }

      if (userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === userId);
      }

      if (eventType) {
        filteredLogs = filteredLogs.filter(log => log.eventType === eventType);
      }

      if (category) {
        filteredLogs = filteredLogs.filter(log => log.category === category);
      }

      if (severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === severity);
      }

      if (resourceType) {
        filteredLogs = filteredLogs.filter(log => log.resourceType === resourceType);
      }

      if (resourceId) {
        filteredLogs = filteredLogs.filter(log => log.resourceId === resourceId);
      }

      if (status) {
        filteredLogs = filteredLogs.filter(log => log.status === status);
      }

      // Sort by timestamp (newest first)
      filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Apply pagination
      const totalCount = filteredLogs.length;
      const paginatedLogs = filteredLogs.slice(offset || 0, (offset || 0) + (limit || filteredLogs.length));

      return { 
        success: true, 
        logs: paginatedLogs,
        totalCount,
        count: paginatedLogs.length
      };
    } catch (error) {
      logger.error('Error getting audit logs:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get event types
   * @param {Object} filters - Filters to apply
   * @returns {Object} - Event types
   */
  getEventTypes(filters = {}) {
    try {
      const { category, severity } = filters;

      // Get all event types
      let eventTypes = Array.from(this.eventTypes.values());

      // Apply filters
      if (category) {
        eventTypes = eventTypes.filter(type => type.category === category);
      }

      if (severity) {
        eventTypes = eventTypes.filter(type => type.severity === severity);
      }

      return { success: true, eventTypes };
    } catch (error) {
      logger.error('Error getting event types:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export audit logs
   * @param {Object} options - Export options
   * @returns {Object} - Export result
   */
  exportLogs(options = {}) {
    try {
      const { format, filters } = options;

      // Get filtered logs
      const logsResult = this.getLogs(filters || {});
      
      if (!logsResult.success) {
        throw new Error(logsResult.error);
      }

      const logs = logsResult.logs;

      // Format logs
      let formattedLogs;
      
      switch (format) {
        case 'json':
          formattedLogs = JSON.stringify(logs, null, 2);
          break;
        case 'csv':
          // Simple CSV formatting
          const headers = ['id', 'timestamp', 'eventType', 'category', 'severity', 'userId', 'resourceType', 'resourceId', 'action', 'status'];
          const rows = logs.map(log => headers.map(header => log[header] || '').join(','));
          formattedLogs = [headers.join(','), ...rows].join('\n');
          break;
        default:
          formattedLogs = JSON.stringify(logs, null, 2);
      }

      return { 
        success: true, 
        data: formattedLogs,
        format: format || 'json',
        count: logs.length
      };
    } catch (error) {
      logger.error('Error exporting audit logs:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize default event types
   * @private
   */
  _initializeDefaultEventTypes() {
    // Authentication events
    this.registerEventType({
      name: 'user.login',
      description: 'User login attempt',
      category: 'authentication',
      severity: 'medium'
    });

    this.registerEventType({
      name: 'user.logout',
      description: 'User logout',
      category: 'authentication',
      severity: 'low'
    });

    this.registerEventType({
      name: 'user.login_failed',
      description: 'Failed login attempt',
      category: 'authentication',
      severity: 'high'
    });

    this.registerEventType({
      name: 'user.password_changed',
      description: 'User password changed',
      category: 'authentication',
      severity: 'medium'
    });

    this.registerEventType({
      name: 'user.mfa_enabled',
      description: 'Multi-factor authentication enabled',
      category: 'authentication',
      severity: 'medium'
    });

    this.registerEventType({
      name: 'user.mfa_disabled',
      description: 'Multi-factor authentication disabled',
      category: 'authentication',
      severity: 'high'
    });

    // Authorization events
    this.registerEventType({
      name: 'authorization.permission_granted',
      description: 'Permission granted to user or role',
      category: 'authorization',
      severity: 'medium'
    });

    this.registerEventType({
      name: 'authorization.permission_revoked',
      description: 'Permission revoked from user or role',
      category: 'authorization',
      severity: 'medium'
    });

    this.registerEventType({
      name: 'authorization.role_assigned',
      description: 'Role assigned to user',
      category: 'authorization',
      severity: 'medium'
    });

    this.registerEventType({
      name: 'authorization.role_removed',
      description: 'Role removed from user',
      category: 'authorization',
      severity: 'medium'
    });

    this.registerEventType({
      name: 'authorization.access_denied',
      description: 'Access denied to resource',
      category: 'authorization',
      severity: 'high'
    });

    // Data events
    this.registerEventType({
      name: 'data.created',
      description: 'Data resource created',
      category: 'data',
      severity: 'low'
    });

    this.registerEventType({
      name: 'data.read',
      description: 'Data resource read',
      category: 'data',
      severity: 'low'
    });

    this.registerEventType({
      name: 'data.updated',
      description: 'Data resource updated',
      category: 'data',
      severity: 'medium'
    });

    this.registerEventType({
      name: 'data.deleted',
      description: 'Data resource deleted',
      category: 'data',
      severity: 'high'
    });

    this.registerEventType({
      name: 'data.exported',
      description: 'Data exported from system',
      category: 'data',
      severity: 'high'
    });

    this.registerEventType({
      name: 'data.imported',
      description: 'Data imported into system',
      category: 'data',
      severity: 'medium'
    });

    // System events
    this.registerEventType({
      name: 'system.started',
      description: 'System started',
      category: 'system',
      severity: 'low'
    });

    this.registerEventType({
      name: 'system.stopped',
      description: 'System stopped',
      category: 'system',
      severity: 'low'
    });

    this.registerEventType({
      name: 'system.error',
      description: 'System error occurred',
      category: 'system',
      severity: 'high'
    });

    this.registerEventType({
      name: 'system.config_changed',
      description: 'System configuration changed',
      category: 'system',
      severity: 'medium'
    });

    this.registerEventType({
      name: 'system.backup_created',
      description: 'System backup created',
      category: 'system',
      severity: 'low'
    });

    this.registerEventType({
      name: 'system.backup_restored',
      description: 'System backup restored',
      category: 'system',
      severity: 'high'
    });
  }

  /**
   * Purge old logs based on retention period
   * @private
   */
  _purgeOldLogs() {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.options.retentionPeriod);

    const initialCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => new Date(log.timestamp) >= retentionDate);
    const purgedCount = initialCount - this.auditLogs.length;

    if (purgedCount > 0) {
      logger.debug(`Purged ${purgedCount} audit logs older than ${retentionDate.toISOString()}`);
    }
  }
}

module.exports = { auditLoggingService: new AuditLoggingService() };
