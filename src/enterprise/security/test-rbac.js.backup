/**
 * Test script for Role-Based Access Control (RBAC) Service
 * 
 * This script demonstrates the advanced RBAC capabilities of the chatbot platform,
 * including role hierarchies, access policies, dynamic permissions, and resource constraints.
 */

// Import required services
require('@src/enterprise\security\authentication.service');
require('@src/enterprise\security\authorization.service');
require('@src/enterprise\security\rbac.service');
require('@src/utils\mock-utils');

/**
 * Main test function
 */
async function testRbacFeatures() {
  logger.info('=== Advanced RBAC Features Test ===\n');

  try {
    // 1. Register test users
    logger.info('Creating test users:');
    const adminUser = await authenticationService.registerUser({
      username: 'admin',
      email: 'admin@example.com',
      password: 'SecureP@ss123',
      fullName: 'Admin User'
    });
    logger.info(`Registered admin user: ${adminUser.user.username} (${adminUser.user.id})`);

    const managerUser = await authenticationService.registerUser({
      username: 'manager',
      email: 'manager@example.com',
      password: 'SecureP@ss123',
      fullName: 'Manager User'
    });
    logger.info(`Registered manager user: ${managerUser.user.username} (${managerUser.user.id})`);

    const regularUser = await authenticationService.registerUser({
      username: 'user',
      email: 'user@example.com',
      password: 'SecureP@ss123',
      fullName: 'Regular User'
    });
    logger.info(`Registered regular user: ${regularUser.user.username} (${regularUser.user.id})`);

    // 2. Create roles
    logger.info('\nCreating roles:');
    const adminRole = authorizationService.createRole({
      name: 'rbac_admin',
      description: 'Administrator role with full access'
    });
    logger.info(`Created role: ${adminRole.role.name} (${adminRole.role.id})`);

    const managerRole = authorizationService.createRole({
      name: 'rbac_manager',
      description: 'Manager role with team management access'
    });
    logger.info(`Created role: ${managerRole.role.name} (${managerRole.role.id})`);

    const userRole = authorizationService.createRole({
      name: 'rbac_user',
      description: 'Regular user role with basic access'
    });
    logger.info(`Created role: ${userRole.role.name} (${userRole.role.id})`);

    // 3. Create permissions
    logger.info('\nCreating permissions:');
    const readChatbotPermission = authorizationService.createPermission({
      name: 'rbac:read:chatbot',
      description: 'Permission to read chatbot data',
      resource: 'chatbot',
      action: 'read'
    });
    logger.info(`Created permission: ${readChatbotPermission.permission.name}`);

    const writeChatbotPermission = authorizationService.createPermission({
      name: 'rbac:write:chatbot',
      description: 'Permission to write chatbot data',
      resource: 'chatbot',
      action: 'write'
    });
    logger.info(`Created permission: ${writeChatbotPermission.permission.name}`);

    const deleteChatbotPermission = authorizationService.createPermission({
      name: 'rbac:delete:chatbot',
      description: 'Permission to delete chatbot data',
      resource: 'chatbot',
      action: 'delete'
    });
    logger.info(`Created permission: ${deleteChatbotPermission.permission.name}`);

    const readTeamPermission = authorizationService.createPermission({
      name: 'rbac:read:team',
      description: 'Permission to read team data',
      resource: 'team',
      action: 'read'
    });
    logger.info(`Created permission: ${readTeamPermission.permission.name}`);

    const writeTeamPermission = authorizationService.createPermission({
      name: 'rbac:write:team',
      description: 'Permission to write team data',
      resource: 'team',
      action: 'write'
    });
    logger.info(`Created permission: ${writeTeamPermission.permission.name}`);

    // 4. Assign permissions to roles
    logger.info('\nAssigning permissions to roles:');
    authorizationService.assignPermissionToRole(adminRole.role.id, readChatbotPermission.permission.id);
    authorizationService.assignPermissionToRole(adminRole.role.id, writeChatbotPermission.permission.id);
    authorizationService.assignPermissionToRole(adminRole.role.id, deleteChatbotPermission.permission.id);
    authorizationService.assignPermissionToRole(adminRole.role.id, readTeamPermission.permission.id);
    authorizationService.assignPermissionToRole(adminRole.role.id, writeTeamPermission.permission.id);
    logger.info(`Assigned all permissions to role: ${adminRole.role.name}`);

    authorizationService.assignPermissionToRole(managerRole.role.id, readChatbotPermission.permission.id);
    authorizationService.assignPermissionToRole(managerRole.role.id, writeChatbotPermission.permission.id);
    authorizationService.assignPermissionToRole(managerRole.role.id, readTeamPermission.permission.id);
    authorizationService.assignPermissionToRole(managerRole.role.id, writeTeamPermission.permission.id);
    logger.info(`Assigned permissions to role: ${managerRole.role.name}`);

    authorizationService.assignPermissionToRole(userRole.role.id, readChatbotPermission.permission.id);
    logger.info(`Assigned permission to role: ${userRole.role.name}`);

    // 5. Assign roles to users
    logger.info('\nAssigning roles to users:');
    authorizationService.assignRoleToUser(adminUser.user.id, adminRole.role.id);
    logger.info(`Assigned role '${adminRole.role.name}' to user ${adminUser.user.username}`);

    authorizationService.assignRoleToUser(managerUser.user.id, managerRole.role.id);
    logger.info(`Assigned role '${managerRole.role.name}' to user ${managerUser.user.username}`);

    authorizationService.assignRoleToUser(regularUser.user.id, userRole.role.id);
    logger.info(`Assigned role '${userRole.role.name}' to user ${regularUser.user.username}`);

    // 6. Create role hierarchy
    logger.info('\nCreating role hierarchy:');
    const hierarchy = rbacService.createRoleHierarchy({
      name: 'Organization Hierarchy',
      description: 'Hierarchy for organization roles',
      roles: [adminRole.role.id, managerRole.role.id, userRole.role.id]
    });
    logger.info(`Created role hierarchy: ${hierarchy.hierarchy.name} (${hierarchy.hierarchy.id})`);

    // 7. Create resource constraints
    logger.info('\nCreating resource constraints:');
    const teamOwnerConstraint = rbacService.createResourceConstraint({
      name: 'team_owner',
      description: 'User must be the owner of the team',
      resource: 'team',
      attribute: 'ownerId',
      operator: 'eq',
      value: '$userId'
    });
    logger.info(`Created resource constraint: ${teamOwnerConstraint.constraint.name}`);

    const chatbotOwnerConstraint = rbacService.createResourceConstraint({
      name: 'chatbot_owner',
      description: 'User must be the owner of the chatbot',
      resource: 'chatbot',
      attribute: 'ownerId',
      operator: 'eq',
      value: '$userId'
    });
    logger.info(`Created resource constraint: ${chatbotOwnerConstraint.constraint.name}`);

    // 8. Create access policies
    logger.info('\nCreating access policies:');
    const adminPolicy = rbacService.createAccessPolicy({
      name: 'admin_full_access',
      description: 'Full access for administrators',
      resources: ['*'],
      actions: ['*'],
      effect: 'allow'
    });
    logger.info(`Created access policy: ${adminPolicy.policy.name}`);

    const denyDeletionPolicy = rbacService.createAccessPolicy({
      name: 'deny_deletion_for_managers',
      description: 'Deny deletion for managers',
      resources: ['chatbot', 'team'],
      actions: ['delete'],
      effect: 'deny'
    });
    logger.info(`Created access policy: ${denyDeletionPolicy.policy.name}`);

    const workingHoursPolicy = rbacService.createAccessPolicy({
      name: 'working_hours_only',
      description: 'Allow access only during working hours',
      resources: ['chatbot', 'team'],
      actions: ['write'],
      effect: 'allow',
      conditions: [
        { attribute: 'hour', operator: 'gte', value: 9 },
        { attribute: 'hour', operator: 'lte', value: 17 }
      ]
    });
    logger.info(`Created access policy: ${workingHoursPolicy.policy.name}`);

    // 9. Assign policies to roles
    logger.info('\nAssigning policies to roles:');
    rbacService.assignPolicyToRole(adminRole.role.id, adminPolicy.policy.id);
    logger.info(`Assigned policy '${adminPolicy.policy.name}' to role '${adminRole.role.name}'`);

    rbacService.assignPolicyToRole(managerRole.role.id, denyDeletionPolicy.policy.id);
    logger.info(`Assigned policy '${denyDeletionPolicy.policy.name}' to role '${managerRole.role.name}'`);

    rbacService.assignPolicyToRole(managerRole.role.id, workingHoursPolicy.policy.id);
    logger.info(`Assigned policy '${workingHoursPolicy.policy.name}' to role '${managerRole.role.name}'`);

    // 10. Create dynamic permissions
    logger.info('\nCreating dynamic permissions:');
    const ownTeamManagement = rbacService.createDynamicPermission({
      name: 'manage_own_team',
      description: 'Manage teams owned by the user',
      resource: 'team',
      action: 'write',
      constraints: [teamOwnerConstraint.constraint.id]
    });
    logger.info(`Created dynamic permission: ${ownTeamManagement.permission.name}`);

    const ownChatbotManagement = rbacService.createDynamicPermission({
      name: 'manage_own_chatbot',
      description: 'Manage chatbots owned by the user',
      resource: 'chatbot',
      action: 'write',
      constraints: [chatbotOwnerConstraint.constraint.id]
    });
    logger.info(`Created dynamic permission: ${ownChatbotManagement.permission.name}`);

    // 11. Assign dynamic permissions to roles
    logger.info('\nAssigning dynamic permissions to roles:');
    rbacService.assignDynamicPermissionToRole(userRole.role.id, ownTeamManagement.permission.id);
    logger.info(`Assigned dynamic permission '${ownTeamManagement.permission.name}' to role '${userRole.role.name}'`);

    rbacService.assignDynamicPermissionToRole(userRole.role.id, ownChatbotManagement.permission.id);
    logger.info(`Assigned dynamic permission '${ownChatbotManagement.permission.name}' to role '${userRole.role.name}'`);

    // 12. Test access checks
    logger.info('\nTesting access checks:');
    
    // Test admin access
    logger.info('\nAdmin access checks:');
    const adminChatbotRead = rbacService.checkAccess(adminUser.user.id, 'chatbot', 'read');
    logger.info(`Admin read chatbot: ${adminChatbotRead.authorized ? 'Allowed' : 'Denied'} (Source: ${adminChatbotRead.source})`);
    
    const adminChatbotWrite = rbacService.checkAccess(adminUser.user.id, 'chatbot', 'write');
    logger.info(`Admin write chatbot: ${adminChatbotWrite.authorized ? 'Allowed' : 'Denied'} (Source: ${adminChatbotWrite.source})`);
    
    const adminChatbotDelete = rbacService.checkAccess(adminUser.user.id, 'chatbot', 'delete');
    logger.info(`Admin delete chatbot: ${adminChatbotDelete.authorized ? 'Allowed' : 'Denied'} (Source: ${adminChatbotDelete.source})`);

    // Test manager access
    logger.info('\nManager access checks:');
    const managerChatbotRead = rbacService.checkAccess(managerUser.user.id, 'chatbot', 'read');
    logger.info(`Manager read chatbot: ${managerChatbotRead.authorized ? 'Allowed' : 'Denied'} (Source: ${managerChatbotRead.source})`);
    
    const managerChatbotWrite = rbacService.checkAccess(managerUser.user.id, 'chatbot', 'write', { hour: 14 });
    logger.info(`Manager write chatbot (during work hours): ${managerChatbotWrite.authorized ? 'Allowed' : 'Denied'} (Source: ${managerChatbotWrite.source})`);
    
    const managerChatbotWriteAfterHours = rbacService.checkAccess(managerUser.user.id, 'chatbot', 'write', { hour: 20 });
    logger.info(`Manager write chatbot (after hours): ${managerChatbotWriteAfterHours.authorized ? 'Allowed' : 'Denied'} (Source: ${managerChatbotWriteAfterHours.source || 'policy'})`);
    
    const managerChatbotDelete = rbacService.checkAccess(managerUser.user.id, 'chatbot', 'delete');
    logger.info(`Manager delete chatbot: ${managerChatbotDelete.authorized ? 'Allowed' : 'Denied'} (Source: ${managerChatbotDelete.source})`);

    // Test regular user access
    logger.info('\nRegular user access checks:');
    const userChatbotRead = rbacService.checkAccess(regularUser.user.id, 'chatbot', 'read');
    logger.info(`User read chatbot: ${userChatbotRead.authorized ? 'Allowed' : 'Denied'} (Source: ${userChatbotRead.source})`);
    
    const userChatbotWrite = rbacService.checkAccess(regularUser.user.id, 'chatbot', 'write');
    logger.info(`User write chatbot (no context): ${userChatbotWrite.authorized ? 'Allowed' : 'Denied'} (Source: ${userChatbotWrite.source})`);
    
    const userChatbotWriteOwned = rbacService.checkAccess(regularUser.user.id, 'chatbot', 'write', { ownerId: regularUser.user.id });
    logger.info(`User write chatbot (owned): ${userChatbotWriteOwned.authorized ? 'Allowed' : 'Denied'} (Source: ${userChatbotWriteOwned.source})`);
    
    const userChatbotWriteNotOwned = rbacService.checkAccess(regularUser.user.id, 'chatbot', 'write', { ownerId: adminUser.user.id });
    logger.info(`User write chatbot (not owned): ${userChatbotWriteNotOwned.authorized ? 'Allowed' : 'Denied'} (Source: ${userChatbotWriteNotOwned.source})`);

    // 13. Get role policies and permissions
    logger.info('\nGetting role policies and permissions:');
    const adminPolicies = rbacService.getRolePolicies(adminRole.role.id);
    logger.info(`Admin role policies: ${adminPolicies.policies.map(p => p.name).join(', ')}`);
    
    const managerPolicies = rbacService.getRolePolicies(managerRole.role.id);
    logger.info(`Manager role policies: ${managerPolicies.policies.map(p => p.name).join(', ')}`);
    
    const userDynamicPermissions = rbacService.getRoleDynamicPermissions(userRole.role.id);
    logger.info(`User role dynamic permissions: ${userDynamicPermissions.permissions.map(p => p.name).join(', ')}`);

    logger.info('\n=== Test Complete ===');
    logger.info('The Advanced RBAC Features are ready for use in the chatbot platform.');
    logger.info('Key features demonstrated:');
    logger.info('1. Role hierarchies');
    logger.info('2. Access policies with conditions');
    logger.info('3. Dynamic permissions with resource constraints');
    logger.info('4. Context-aware access control');
    logger.info('5. Policy-based authorization');
    logger.info('6. Owner-based resource access');
  } catch (error) {
    logger.error('Error during RBAC test:', error.message);
  }
}

// Run the test
testRbacFeatures();
