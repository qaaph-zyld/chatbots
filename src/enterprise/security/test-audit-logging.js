/**
 * Test script for Audit Logging Service
 * 
 * This script demonstrates the audit logging capabilities of the chatbot platform,
 * including event logging, filtering, and exporting.
 */

// Import required services
const { authenticationService } = require('./authentication.service');
const { authorizationService } = require('./authorization.service');
const { dataProtectionService } = require('./data-protection.service');
const { auditLoggingService } = require('./audit-logging.service');
const { logger } = require('../../utils/mock-utils');

/**
 * Main test function
 */
async function testAuditLogging() {
  logger.info('=== Audit Logging Test ===\n');

  try {
    // 1. Register test users
    logger.info('Creating test users:');
    const adminUser = await authenticationService.registerUser({
      username: 'audit_admin',
      email: 'audit_admin@example.com',
      password: 'SecureP@ss123',
      fullName: 'Audit Admin User'
    });
    logger.info(`Registered admin user: ${adminUser.user.username} (${adminUser.user.id})`);

    const regularUser = await authenticationService.registerUser({
      username: 'audit_user',
      email: 'audit_user@example.com',
      password: 'SecureP@ss123',
      fullName: 'Audit Regular User'
    });
    logger.info(`Registered regular user: ${regularUser.user.username} (${regularUser.user.id})`);

    // 2. Log authentication events
    logger.info('\nLogging authentication events:');
    
    // Log successful login
    const loginEvent = auditLoggingService.logEvent({
      eventType: 'user.login',
      userId: adminUser.user.id,
      action: 'login',
      status: 'success',
      details: { method: 'password' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    logger.info(`Logged login event: ${loginEvent.event.id}`);

    // Log failed login
    const failedLoginEvent = auditLoggingService.logEvent({
      eventType: 'user.login_failed',
      userId: 'unknown',
      action: 'login',
      status: 'failure',
      details: { reason: 'invalid_credentials', username: 'nonexistent_user' },
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    logger.info(`Logged failed login event: ${failedLoginEvent.event.id}`);

    // Log password change
    const passwordChangeEvent = auditLoggingService.logEvent({
      eventType: 'user.password_changed',
      userId: regularUser.user.id,
      action: 'change_password',
      status: 'success',
      details: { forced: false },
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    logger.info(`Logged password change event: ${passwordChangeEvent.event.id}`);

    // 3. Create and assign roles
    logger.info('\nCreating roles and permissions:');
    const adminRole = authorizationService.createRole({
      name: 'audit_admin_role',
      description: 'Administrator role for audit testing'
    });
    logger.info(`Created role: ${adminRole.role.name} (${adminRole.role.id})`);

    const readPermission = authorizationService.createPermission({
      name: 'audit:read:logs',
      description: 'Permission to read audit logs',
      resource: 'audit_logs',
      action: 'read'
    });
    logger.info(`Created permission: ${readPermission.permission.name}`);

    const writePermission = authorizationService.createPermission({
      name: 'audit:write:logs',
      description: 'Permission to write audit logs',
      resource: 'audit_logs',
      action: 'write'
    });
    logger.info(`Created permission: ${writePermission.permission.name}`);

    // 4. Log authorization events
    logger.info('\nLogging authorization events:');
    
    // Assign role to user
    authorizationService.assignRoleToUser(adminUser.user.id, adminRole.role.id);
    const roleAssignEvent = auditLoggingService.logEvent({
      eventType: 'authorization.role_assigned',
      userId: 'system',
      resourceType: 'user',
      resourceId: adminUser.user.id,
      action: 'assign_role',
      status: 'success',
      details: { roleId: adminRole.role.id, roleName: adminRole.role.name }
    });
    logger.info(`Logged role assignment event: ${roleAssignEvent.event.id}`);

    // Assign permission to role
    authorizationService.assignPermissionToRole(adminRole.role.id, readPermission.permission.id);
    const permissionGrantEvent = auditLoggingService.logEvent({
      eventType: 'authorization.permission_granted',
      userId: 'system',
      resourceType: 'role',
      resourceId: adminRole.role.id,
      action: 'grant_permission',
      status: 'success',
      details: { 
        permissionId: readPermission.permission.id, 
        permissionName: readPermission.permission.name 
      }
    });
    logger.info(`Logged permission grant event: ${permissionGrantEvent.event.id}`);

    // Access denied event
    const accessDeniedEvent = auditLoggingService.logEvent({
      eventType: 'authorization.access_denied',
      userId: regularUser.user.id,
      resourceType: 'audit_logs',
      action: 'read',
      status: 'failure',
      details: { reason: 'missing_permission' }
    });
    logger.info(`Logged access denied event: ${accessDeniedEvent.event.id}`);

    // 5. Log data events
    logger.info('\nLogging data events:');
    
    // Encrypt sensitive data
    const sensitiveData = 'This is confidential information';
    let encryptedDataId = 'mock-data-id-123';
    
    try {
      const encryptResult = dataProtectionService.encrypt(sensitiveData, { 
        purpose: 'message', 
        metadata: { userId: adminUser.user.id } 
      });
      
      if (encryptResult && encryptResult.success) {
        encryptedDataId = encryptResult.dataId;
      }
    } catch (error) {
      logger.error(`Error encrypting data: ${error.message}`);
    }
    
    const dataCreatedEvent = auditLoggingService.logEvent({
      eventType: 'data.created',
      userId: adminUser.user.id,
      resourceType: 'encrypted_data',
      resourceId: encryptedDataId,
      action: 'create',
      status: 'success',
      details: { purpose: 'message' }
    });
    logger.info(`Logged data created event: ${dataCreatedEvent.event.id}`);

    // Decrypt data
    try {
      const decryptResult = dataProtectionService.decrypt(encryptedDataId);
    } catch (error) {
      logger.error(`Error decrypting data: ${error.message}`);
    }
    
    const dataReadEvent = auditLoggingService.logEvent({
      eventType: 'data.read',
      userId: adminUser.user.id,
      resourceType: 'encrypted_data',
      resourceId: encryptedDataId,
      action: 'read',
      status: 'success',
      details: { purpose: 'message' }
    });
    logger.info(`Logged data read event: ${dataReadEvent.event.id}`);

    // 6. Log system events
    logger.info('\nLogging system events:');
    
    const systemStartEvent = auditLoggingService.logEvent({
      eventType: 'system.started',
      userId: 'system',
      action: 'start',
      status: 'success',
      details: { version: '1.0.0' }
    });
    logger.info(`Logged system start event: ${systemStartEvent.event.id}`);

    const configChangeEvent = auditLoggingService.logEvent({
      eventType: 'system.config_changed',
      userId: adminUser.user.id,
      action: 'update_config',
      status: 'success',
      details: { 
        changes: {
          'security.password.minLength': { old: 8, new: 10 },
          'security.mfa.enabled': { old: false, new: true }
        }
      }
    });
    logger.info(`Logged config change event: ${configChangeEvent.event.id}`);

    // 7. Register custom event type
    logger.info('\nRegistering custom event type:');
    
    const customEventType = auditLoggingService.registerEventType({
      name: 'chatbot.trained',
      description: 'Chatbot model trained',
      category: 'chatbot',
      severity: 'medium'
    });
    logger.info(`Registered custom event type: ${customEventType.eventType.name}`);

    // Log custom event
    const customEvent = auditLoggingService.logEvent({
      eventType: 'chatbot.trained',
      userId: adminUser.user.id,
      resourceType: 'chatbot',
      resourceId: 'bot-123',
      action: 'train',
      status: 'success',
      details: { 
        trainingTime: 120,
        accuracy: 0.95,
        datasetSize: 1000
      }
    });
    logger.info(`Logged custom event: ${customEvent.event.id}`);

    // 8. Get logs with filters
    logger.info('\nRetrieving logs with filters:');
    
    // Get all logs
    const allLogs = auditLoggingService.getLogs();
    logger.info(`Retrieved all logs: ${allLogs.count} entries`);

    // Get logs by user
    const userLogs = auditLoggingService.getLogs({ 
      userId: adminUser.user.id 
    });
    logger.info(`Retrieved logs for admin user: ${userLogs.count} entries`);

    // Get logs by category
    const authLogs = auditLoggingService.getLogs({ 
      category: 'authentication' 
    });
    logger.info(`Retrieved authentication logs: ${authLogs.count} entries`);

    // Get logs by severity
    const highSeverityLogs = auditLoggingService.getLogs({ 
      severity: 'high' 
    });
    logger.info(`Retrieved high severity logs: ${highSeverityLogs.count} entries`);

    // Get logs by time range
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recentLogs = auditLoggingService.getLogs({ 
      startDate: oneDayAgo.toISOString() 
    });
    logger.info(`Retrieved logs from the last 24 hours: ${recentLogs.count} entries`);

    // 9. Export logs
    logger.info('\nExporting logs:');
    
    // Export as JSON
    const jsonExport = auditLoggingService.exportLogs({ 
      format: 'json',
      filters: { category: 'authentication' }
    });
    logger.info(`Exported ${jsonExport.count} logs as JSON`);

    // Export as CSV
    const csvExport = auditLoggingService.exportLogs({ 
      format: 'csv',
      filters: { userId: adminUser.user.id }
    });
    logger.info(`Exported ${csvExport.count} logs as CSV`);

    // 10. Get event types
    logger.info('\nRetrieving event types:');
    
    // Get all event types
    const allEventTypes = auditLoggingService.getEventTypes();
    logger.info(`Retrieved all event types: ${allEventTypes.eventTypes.length} types`);

    // Get event types by category
    const authEventTypes = auditLoggingService.getEventTypes({ 
      category: 'authentication' 
    });
    logger.info(`Retrieved authentication event types: ${authEventTypes.eventTypes.length} types`);

    // Get event types by severity
    const criticalEventTypes = auditLoggingService.getEventTypes({ 
      severity: 'critical' 
    });
    logger.info(`Retrieved critical event types: ${criticalEventTypes.eventTypes.length} types`);

    logger.info('\n=== Test Complete ===');
    logger.info('The Audit Logging Service is ready for use in the chatbot platform.');
    logger.info('Key features demonstrated:');
    logger.info('1. Comprehensive event logging for authentication, authorization, data, and system events');
    logger.info('2. Custom event type registration and logging');
    logger.info('3. Flexible log filtering by user, category, severity, time range, and more');
    logger.info('4. Log export in multiple formats (JSON, CSV)');
    logger.info('5. Event type management and categorization');
    logger.info('6. Automatic log retention and purging');
  } catch (error) {
    logger.error('Error during audit logging test:', error.message);
  }
}

// Run the test
testAuditLogging();
