/**
 * Authorization Service
 * 
 * This service provides advanced authorization features for the chatbot platform,
 * including role-based access control, permission management, and resource protection.
 */

// Use mock utilities for testing
require('@src/utils\mock-utils');

/**
 * Authorization Service class
 */
class AuthorizationService {
  /**
   * Initialize the authorization service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      defaultRole: process.env.DEFAULT_ROLE || 'user',
      superAdminRole: process.env.SUPER_ADMIN_ROLE || 'superadmin',
      ...options
    };

    // Storage for roles, permissions, and resources
    this.roles = new Map();
    this.permissions = new Map();
    this.resources = new Map();
    this.userRoles = new Map();
    this.rolePermissions = new Map();
    this.resourcePermissions = new Map();

    // Initialize default roles and permissions
    this._initializeDefaults();

    logger.info('Authorization Service initialized with options:', {
      defaultRole: this.options.defaultRole,
      superAdminRole: this.options.superAdminRole
    });
  }

  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @returns {Object} - Creation result
   */
  createRole(roleData) {
    try {
      const { name, description, parentRole } = roleData;

      if (!name) {
        throw new Error('Role name is required');
      }

      // Check if role already exists
      for (const role of this.roles.values()) {
        if (role.name === name) {
          throw new Error(`Role '${name}' already exists`);
        }
      }

      // Check if parent role exists if specified
      let parentRoleObj = null;
      if (parentRole) {
        parentRoleObj = Array.from(this.roles.values()).find(r => r.name === parentRole);
        if (!parentRoleObj) {
          throw new Error(`Parent role '${parentRole}' not found`);
        }
      }

      // Generate role ID
      const roleId = generateUuid();

      // Create role object
      const role = {
        id: roleId,
        name,
        description: description || '',
        parentRole: parentRoleObj ? parentRoleObj.id : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store role
      this.roles.set(roleId, role);

      // If parent role exists, inherit its permissions
      if (parentRoleObj) {
        const parentPermissions = this.rolePermissions.get(parentRoleObj.id) || [];
        this.rolePermissions.set(roleId, [...parentPermissions]);
      } else {
        this.rolePermissions.set(roleId, []);
      }

      logger.info(`Created role: ${name}`, { roleId });
      return { success: true, role };
    } catch (error) {
      logger.error('Error creating role:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get role by ID or name
   * @param {string} roleIdentifier - Role ID or name
   * @returns {Object} - Role data
   */
  getRole(roleIdentifier) {
    try {
      if (!roleIdentifier) {
        throw new Error('Role identifier is required');
      }

      let role = this.roles.get(roleIdentifier);

      // If not found by ID, try to find by name
      if (!role) {
        role = Array.from(this.roles.values()).find(r => r.name === roleIdentifier);
      }

      if (!role) {
        throw new Error(`Role '${roleIdentifier}' not found`);
      }

      return { success: true, role };
    } catch (error) {
      logger.error('Error getting role:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a role
   * @param {string} roleId - Role ID
   * @param {Object} updateData - Data to update
   * @returns {Object} - Update result
   */
  updateRole(roleId, updateData) {
    try {
      const role = this.roles.get(roleId);

      if (!role) {
        throw new Error(`Role with ID ${roleId} not found`);
      }

      // Update role properties
      if (updateData.name) {
        // Check if new name already exists
        const existingRole = Array.from(this.roles.values()).find(r => r.name === updateData.name && r.id !== roleId);
        if (existingRole) {
          throw new Error(`Role with name '${updateData.name}' already exists`);
        }
        role.name = updateData.name;
      }

      if (updateData.description !== undefined) {
        role.description = updateData.description;
      }

      if (updateData.parentRole !== undefined) {
        if (updateData.parentRole === null) {
          role.parentRole = null;
        } else {
          const parentRole = Array.from(this.roles.values()).find(r => r.name === updateData.parentRole || r.id === updateData.parentRole);
          if (!parentRole) {
            throw new Error(`Parent role '${updateData.parentRole}' not found`);
          }
          role.parentRole = parentRole.id;
        }
      }

      role.updatedAt = new Date().toISOString();

      // Store updated role
      this.roles.set(roleId, role);

      logger.info(`Updated role: ${role.name}`, { roleId });
      return { success: true, role };
    } catch (error) {
      logger.error('Error updating role:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a role
   * @param {string} roleId - Role ID
   * @returns {Object} - Deletion result
   */
  deleteRole(roleId) {
    try {
      const role = this.roles.get(roleId);

      if (!role) {
        throw new Error(`Role with ID ${roleId} not found`);
      }

      // Check if role is a system role
      if (role.name === this.options.defaultRole || role.name === this.options.superAdminRole) {
        throw new Error(`Cannot delete system role: ${role.name}`);
      }

      // Check if role is used as a parent role
      for (const r of this.roles.values()) {
        if (r.parentRole === roleId) {
          throw new Error(`Role is used as a parent role and cannot be deleted`);
        }
      }

      // Remove role
      this.roles.delete(roleId);
      this.rolePermissions.delete(roleId);

      // Remove role from users
      for (const [userId, roles] of this.userRoles.entries()) {
        const updatedRoles = roles.filter(r => r !== roleId);
        this.userRoles.set(userId, updatedRoles);
      }

      logger.info(`Deleted role: ${role.name}`, { roleId });
      return { success: true, message: `Role '${role.name}' deleted successfully` };
    } catch (error) {
      logger.error('Error deleting role:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new permission
   * @param {Object} permissionData - Permission data
   * @returns {Object} - Creation result
   */
  createPermission(permissionData) {
    try {
      const { name, description, resource, action } = permissionData;

      if (!name) {
        throw new Error('Permission name is required');
      }

      if (!resource) {
        throw new Error('Resource is required');
      }

      if (!action) {
        throw new Error('Action is required');
      }

      // Check if permission already exists
      for (const permission of this.permissions.values()) {
        if (permission.name === name) {
          throw new Error(`Permission '${name}' already exists`);
        }
      }

      // Generate permission ID
      const permissionId = generateUuid();

      // Create permission object
      const permission = {
        id: permissionId,
        name,
        description: description || '',
        resource,
        action,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store permission
      this.permissions.set(permissionId, permission);

      logger.info(`Created permission: ${name}`, { permissionId, resource, action });
      return { success: true, permission };
    } catch (error) {
      logger.error('Error creating permission:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign a permission to a role
   * @param {string} roleId - Role ID
   * @param {string} permissionId - Permission ID
   * @returns {Object} - Assignment result
   */
  assignPermissionToRole(roleId, permissionId) {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error(`Role with ID ${roleId} not found`);
      }

      const permission = this.permissions.get(permissionId);
      if (!permission) {
        throw new Error(`Permission with ID ${permissionId} not found`);
      }

      // Get current permissions for the role
      const rolePermissions = this.rolePermissions.get(roleId) || [];

      // Check if permission is already assigned
      if (rolePermissions.includes(permissionId)) {
        throw new Error(`Permission '${permission.name}' is already assigned to role '${role.name}'`);
      }

      // Assign permission to role
      rolePermissions.push(permissionId);
      this.rolePermissions.set(roleId, rolePermissions);

      logger.info(`Assigned permission '${permission.name}' to role '${role.name}'`, { roleId, permissionId });
      return { success: true, message: `Permission '${permission.name}' assigned to role '${role.name}'` };
    } catch (error) {
      logger.error('Error assigning permission to role:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a permission from a role
   * @param {string} roleId - Role ID
   * @param {string} permissionId - Permission ID
   * @returns {Object} - Removal result
   */
  removePermissionFromRole(roleId, permissionId) {
    try {
      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error(`Role with ID ${roleId} not found`);
      }

      const permission = this.permissions.get(permissionId);
      if (!permission) {
        throw new Error(`Permission with ID ${permissionId} not found`);
      }

      // Get current permissions for the role
      const rolePermissions = this.rolePermissions.get(roleId) || [];

      // Check if permission is assigned
      if (!rolePermissions.includes(permissionId)) {
        throw new Error(`Permission '${permission.name}' is not assigned to role '${role.name}'`);
      }

      // Remove permission from role
      const updatedPermissions = rolePermissions.filter(p => p !== permissionId);
      this.rolePermissions.set(roleId, updatedPermissions);

      logger.info(`Removed permission '${permission.name}' from role '${role.name}'`, { roleId, permissionId });
      return { success: true, message: `Permission '${permission.name}' removed from role '${role.name}'` };
    } catch (error) {
      logger.error('Error removing permission from role:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign a role to a user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Object} - Assignment result
   */
  assignRoleToUser(userId, roleId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error(`Role with ID ${roleId} not found`);
      }

      // Get current roles for the user
      const userRoles = this.userRoles.get(userId) || [];

      // Check if role is already assigned
      if (userRoles.includes(roleId)) {
        throw new Error(`Role '${role.name}' is already assigned to user ${userId}`);
      }

      // Assign role to user
      userRoles.push(roleId);
      this.userRoles.set(userId, userRoles);

      logger.info(`Assigned role '${role.name}' to user ${userId}`, { userId, roleId });
      return { success: true, message: `Role '${role.name}' assigned to user ${userId}` };
    } catch (error) {
      logger.error('Error assigning role to user:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a role from a user
   * @param {string} userId - User ID
   * @param {string} roleId - Role ID
   * @returns {Object} - Removal result
   */
  removeRoleFromUser(userId, roleId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const role = this.roles.get(roleId);
      if (!role) {
        throw new Error(`Role with ID ${roleId} not found`);
      }

      // Get current roles for the user
      const userRoles = this.userRoles.get(userId) || [];

      // Check if role is assigned
      if (!userRoles.includes(roleId)) {
        throw new Error(`Role '${role.name}' is not assigned to user ${userId}`);
      }

      // Check if it's the default role and it's the only role
      if (role.name === this.options.defaultRole && userRoles.length === 1) {
        throw new Error(`Cannot remove the default role from user ${userId}`);
      }

      // Remove role from user
      const updatedRoles = userRoles.filter(r => r !== roleId);
      this.userRoles.set(userId, updatedRoles);

      logger.info(`Removed role '${role.name}' from user ${userId}`, { userId, roleId });
      return { success: true, message: `Role '${role.name}' removed from user ${userId}` };
    } catch (error) {
      logger.error('Error removing role from user:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all roles assigned to a user
   * @param {string} userId - User ID
   * @returns {Object} - User roles
   */
  getUserRoles(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get roles for the user
      const roleIds = this.userRoles.get(userId) || [];
      const roles = roleIds.map(id => this.roles.get(id)).filter(Boolean);

      return { success: true, roles };
    } catch (error) {
      logger.error('Error getting user roles:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all permissions for a user
   * @param {string} userId - User ID
   * @returns {Object} - User permissions
   */
  getUserPermissions(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get roles for the user
      const roleIds = this.userRoles.get(userId) || [];
      
      // Collect all permissions from all roles
      const permissionIds = new Set();
      for (const roleId of roleIds) {
        const rolePermissions = this.rolePermissions.get(roleId) || [];
        for (const permId of rolePermissions) {
          permissionIds.add(permId);
        }
      }

      // Get permission objects
      const permissions = Array.from(permissionIds).map(id => this.permissions.get(id)).filter(Boolean);

      return { success: true, permissions };
    } catch (error) {
      logger.error('Error getting user permissions:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a user has a specific permission
   * @param {string} userId - User ID
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @returns {Object} - Authorization result
   */
  checkPermission(userId, resource, action) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!resource) {
        throw new Error('Resource is required');
      }

      if (!action) {
        throw new Error('Action is required');
      }

      // Get user permissions
      const { success, permissions, error } = this.getUserPermissions(userId);
      
      if (!success) {
        throw new Error(error);
      }

      // Check if user has the superadmin role
      const userRoles = this.userRoles.get(userId) || [];
      const superAdminRoleId = Array.from(this.roles.values())
        .find(r => r.name === this.options.superAdminRole)?.id;
      
      if (superAdminRoleId && userRoles.includes(superAdminRoleId)) {
        // Superadmin has all permissions
        return { success: true, authorized: true, reason: 'User has superadmin role' };
      }

      // Check if user has the required permission
      const hasPermission = permissions.some(p => 
        (p.resource === resource || p.resource === '*') && 
        (p.action === action || p.action === '*')
      );

      if (hasPermission) {
        return { success: true, authorized: true };
      } else {
        return { 
          success: true, 
          authorized: false, 
          reason: `User does not have permission to ${action} on ${resource}` 
        };
      }
    } catch (error) {
      logger.error('Error checking permission:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Register a resource for access control
   * @param {Object} resourceData - Resource data
   * @returns {Object} - Registration result
   */
  registerResource(resourceData) {
    try {
      const { name, description, type } = resourceData;

      if (!name) {
        throw new Error('Resource name is required');
      }

      if (!type) {
        throw new Error('Resource type is required');
      }

      // Check if resource already exists
      for (const resource of this.resources.values()) {
        if (resource.name === name) {
          throw new Error(`Resource '${name}' already exists`);
        }
      }

      // Generate resource ID
      const resourceId = generateUuid();

      // Create resource object
      const resource = {
        id: resourceId,
        name,
        description: description || '',
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store resource
      this.resources.set(resourceId, resource);

      logger.info(`Registered resource: ${name}`, { resourceId, type });
      return { success: true, resource };
    } catch (error) {
      logger.error('Error registering resource:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize default roles and permissions
   * @private
   */
  _initializeDefaults() {
    // Create default roles
    const userRoleId = generateUuid();
    const adminRoleId = generateUuid();
    const superAdminRoleId = generateUuid();

    this.roles.set(userRoleId, {
      id: userRoleId,
      name: 'user',
      description: 'Regular user with basic permissions',
      parentRole: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.roles.set(adminRoleId, {
      id: adminRoleId,
      name: 'admin',
      description: 'Administrator with elevated permissions',
      parentRole: userRoleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.roles.set(superAdminRoleId, {
      id: superAdminRoleId,
      name: 'superadmin',
      description: 'Super administrator with all permissions',
      parentRole: adminRoleId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Create default permissions
    const readChatbotPermId = generateUuid();
    const createChatbotPermId = generateUuid();
    const updateChatbotPermId = generateUuid();
    const deleteChatbotPermId = generateUuid();
    const manageUsersPermId = generateUuid();

    this.permissions.set(readChatbotPermId, {
      id: readChatbotPermId,
      name: 'read:chatbot',
      description: 'Read chatbot data',
      resource: 'chatbot',
      action: 'read',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.permissions.set(createChatbotPermId, {
      id: createChatbotPermId,
      name: 'create:chatbot',
      description: 'Create chatbot',
      resource: 'chatbot',
      action: 'create',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.permissions.set(updateChatbotPermId, {
      id: updateChatbotPermId,
      name: 'update:chatbot',
      description: 'Update chatbot',
      resource: 'chatbot',
      action: 'update',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.permissions.set(deleteChatbotPermId, {
      id: deleteChatbotPermId,
      name: 'delete:chatbot',
      description: 'Delete chatbot',
      resource: 'chatbot',
      action: 'delete',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.permissions.set(manageUsersPermId, {
      id: manageUsersPermId,
      name: 'manage:users',
      description: 'Manage users',
      resource: 'user',
      action: 'manage',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Assign permissions to roles
    this.rolePermissions.set(userRoleId, [readChatbotPermId]);
    this.rolePermissions.set(adminRoleId, [readChatbotPermId, createChatbotPermId, updateChatbotPermId]);
    this.rolePermissions.set(superAdminRoleId, [readChatbotPermId, createChatbotPermId, updateChatbotPermId, deleteChatbotPermId, manageUsersPermId]);

    logger.info('Initialized default roles and permissions');
  }
}

module.exports = { authorizationService: new AuthorizationService() };
