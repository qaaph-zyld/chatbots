/**
 * Security Module Index
 * 
 * This module provides advanced security features for the chatbot platform,
 * including authentication, authorization, data protection, role-based access control,
 * audit logging, and data retention policies.
 */

const { authenticationService } = require('./authentication.service');
const { authorizationService } = require('./authorization.service');
const { dataProtectionService } = require('./data-protection.service');
const { rbacService } = require('./rbac.service');
const { auditLoggingService } = require('./audit-logging.service');
const { dataRetentionService } = require('./data-retention.service');

module.exports = {
  authenticationService,
  authorizationService,
  dataProtectionService,
  rbacService,
  auditLoggingService,
  dataRetentionService
};
