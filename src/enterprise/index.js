/**
 * Enterprise Module Index
 * 
 * Exports all enterprise features including team collaboration tools,
 * advanced security features, role-based access control, audit logging,
 * and data retention policies.
 */

require('@src/enterprise\collaboration\team-collaboration.service');
require('@src/enterprise\security');

module.exports = {
  teamCollaborationService,
  security
};
