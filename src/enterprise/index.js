/**
 * Enterprise Module Index
 * 
 * Exports all enterprise features including team collaboration tools,
 * advanced security features, role-based access control, audit logging,
 * and data retention policies.
 */

const { teamCollaborationService } = require('./collaboration/team-collaboration.service');
const security = require('./security');

module.exports = {
  teamCollaborationService,
  security
};
