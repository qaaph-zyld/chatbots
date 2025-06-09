/**
 * Security Module Index
 * 
 * This module provides advanced security features for the chatbot platform,
 * including authentication, authorization, data protection, role-based access control,
 * audit logging, and data retention policies.
 */

require('@src/enterprise\security\authentication.service');
require('@src/enterprise\security\authorization.service');
require('@src/enterprise\security\data-protection.service');
require('@src/enterprise\security\rbac.service');
require('@src/enterprise\security\audit-logging.service');
require('@src/enterprise\security\data-retention.service');

module.exports = {
  authenticationService,
  authorizationService,
  dataProtectionService,
  rbacService,
  auditLoggingService,
  dataRetentionService
};
