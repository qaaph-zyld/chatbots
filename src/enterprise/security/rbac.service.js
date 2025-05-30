/**
 * Role-Based Access Control (RBAC) Service
 * 
 * This service provides advanced RBAC features for the chatbot platform,
 * building on top of the authorization service to provide more granular
 * access control with role hierarchies, dynamic permissions, and policy enforcement.
 */

// Use mock utilities for testing
const { logger, generateUuid } = require('../../utils/mock-utils');
const { authorizationService } = require('./authorization.service');

/**
 * RBAC Service class
 */
class RbacService {
  /**
   * Initialize the RBAC service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      maxRoleHierarchyDepth: parseInt(process.env.MAX_ROLE_HIERARCHY_DEPTH || '10'),
      enablePolicyEnforcement: process.env.ENABLE_POLICY_ENFORCEMENT === 'true',
      enableDynamicPermissions: process.env.ENABLE_DYNAMIC_PERMISSIONS === 'true',
      ...options
    };

    // Storage for role hierarchies, policies, and dynamic permissions
    this.roleHierarchies = new Map();
    this.accessPolicies = new Map();
    this.dynamicPermissions = new Map();
    this.resourceConstraints = new Map();
    this.roleAssignments = new Map();

    logger.info('RBAC Service initialized with options:', {
      maxRoleHierarchyDepth: this.options.maxRoleHierarchyDepth,
      enablePolicyEnforcement: this.options.enablePolicyEnforcement,
      enableDynamicPermissions: this.options.enableDynamicPermissions
    });
  }

  /**
   * Create a role hierarchy
   * @param {Object} hierarchyData - Hierarchy data
   * @returns {Object} - Creation result
   */
  createRoleHierarchy(hierarchyData) {
    try {
      const { name, description, roles } = hierarchyData;

      if (!name) {
        throw new Error('Hierarchy name is required');
      }

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        throw new Error('Roles array is required and must not be empty');
      }

      // Check if hierarchy already exists
      if (Array.from(this.roleHierarchies.values()).some(h => h.name === name)) {
        throw new Error(`Hierarchy with name '${name}' already exists`);
      }

      // Validate roles
      for (const roleId of roles) {
        const roleResult = authorizationService.getRole(roleId);
        if (!roleResult.success) {
          throw new Error(`Role with ID '${roleId}' not found`);
        }
      }

      // Generate hierarchy ID
      const hierarchyId = generateUuid();

      // Create hierarchy object
      const hierarchy = {
        id: hierarchyId,
        name,
        description: description || '',
        roles,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store hierarchy
      this.roleHierarchies.set(hierarchyId, hierarchy);

      logger.info(`Created role hierarchy: ${name}`, { hierarchyId });
      return { success: true, hierarchy };
    } catch (error) {
      logger.error('Error creating role hierarchy:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create an access policy
   * @param {Object} policyData - Policy data
   * @returns {Object} - Creation result
   */
  createAccessPolicy(policyData) {
    try {
      const { name, description, resources, actions, effect, conditions } = policyData;

      if (!name) {
        throw new Error('Policy name is required');
      }

      if (!resources || !Array.isArray(resources) || resources.length === 0) {
        throw new Error('Resources array is required and must not be empty');
      }

      if (!actions || !Array.isArray(actions) || actions.length === 0) {
        throw new Error('Actions array is required and must not be empty');
      }

      if (!effect || !['allow', 'deny'].includes(effect)) {
        throw new Error("Effect is required and must be either 'allow' or 'deny'");
      }

      // Check if policy already exists
      if (Array.from(this.accessPolicies.values()).some(p => p.name === name)) {
        throw new Error(`Policy with name '${name}' already exists`);
      }

      // Generate policy ID
      const policyId = generateUuid();

      // Create policy object
      const policy = {
        id: policyId,
        name,
        description: description || '',
        resources,
        actions,
        effect,
        conditions: conditions || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store policy
      this.accessPolicies.set(policyId, policy);

      logger.info(`Created access policy: ${name}`, { policyId, effect });
      return { success: true, policy };
    } catch (error) {
      logger.error('Error creating access policy:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign a policy to a role
   * @param {string} roleId - Role ID
   * @param {string} policyId - Policy ID
   * @returns {Object} - Assignment result
   */
  assignPolicyToRole(roleId, policyId) {
    try {
      // Check if role exists
      const roleResult = authorizationService.getRole(roleId);
      if (!roleResult.success) {
        throw new Error(`Role with ID '${roleId}' not found`);
      }

      // Check if policy exists
      const policy = this.accessPolicies.get(policyId);
      if (!policy) {
        throw new Error(`Policy with ID '${policyId}' not found`);
      }

      // Get current role assignments
      const assignments = this.roleAssignments.get(roleId) || { policies: [] };

      // Check if policy is already assigned
      if (assignments.policies.includes(policyId)) {
        throw new Error(`Policy '${policy.name}' is already assigned to role '${roleResult.role.name}'`);
      }

      // Assign policy to role
      assignments.policies.push(policyId);
      this.roleAssignments.set(roleId, assignments);

      logger.info(`Assigned policy '${policy.name}' to role '${roleResult.role.name}'`, { roleId, policyId });
      return { 
        success: true, 
        message: `Policy '${policy.name}' assigned to role '${roleResult.role.name}'` 
      };
    } catch (error) {
      logger.error('Error assigning policy to role:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a resource constraint
   * @param {Object} constraintData - Constraint data
   * @returns {Object} - Creation result
   */
  createResourceConstraint(constraintData) {
    try {
      const { name, description, resource, attribute, operator, value } = constraintData;

      if (!name) {
        throw new Error('Constraint name is required');
      }

      if (!resource) {
        throw new Error('Resource is required');
      }

      if (!attribute) {
        throw new Error('Attribute is required');
      }

      if (!operator || !['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'contains'].includes(operator)) {
        throw new Error('Operator is required and must be a valid operator');
      }

      if (value === undefined) {
        throw new Error('Value is required');
      }

      // Check if constraint already exists
      if (Array.from(this.resourceConstraints.values()).some(c => c.name === name)) {
        throw new Error(`Constraint with name '${name}' already exists`);
      }

      // Generate constraint ID
      const constraintId = generateUuid();

      // Create constraint object
      const constraint = {
        id: constraintId,
        name,
        description: description || '',
        resource,
        attribute,
        operator,
        value,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store constraint
      this.resourceConstraints.set(constraintId, constraint);

      logger.info(`Created resource constraint: ${name}`, { constraintId, resource });
      return { success: true, constraint };
    } catch (error) {
      logger.error('Error creating resource constraint:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a dynamic permission
   * @param {Object} permissionData - Permission data
   * @returns {Object} - Creation result
   */
  createDynamicPermission(permissionData) {
    try {
      const { name, description, resource, action, constraints } = permissionData;

      if (!name) {
        throw new Error('Permission name is required');
      }

      if (!resource) {
        throw new Error('Resource is required');
      }

      if (!action) {
        throw new Error('Action is required');
      }

      if (!constraints || !Array.isArray(constraints)) {
        throw new Error('Constraints array is required');
      }

      // Check if dynamic permission already exists
      if (Array.from(this.dynamicPermissions.values()).some(p => p.name === name)) {
        throw new Error(`Dynamic permission with name '${name}' already exists`);
      }

      // Validate constraints
      for (const constraintId of constraints) {
        if (!this.resourceConstraints.has(constraintId)) {
          throw new Error(`Constraint with ID '${constraintId}' not found`);
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
        constraints,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store permission
      this.dynamicPermissions.set(permissionId, permission);

      logger.info(`Created dynamic permission: ${name}`, { permissionId, resource, action });
      return { success: true, permission };
    } catch (error) {
      logger.error('Error creating dynamic permission:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign a dynamic permission to a role
   * @param {string} roleId - Role ID
   * @param {string} permissionId - Permission ID
   * @returns {Object} - Assignment result
   */
  assignDynamicPermissionToRole(roleId, permissionId) {
    try {
      // Check if role exists
      const roleResult = authorizationService.getRole(roleId);
      if (!roleResult.success) {
        throw new Error(`Role with ID '${roleId}' not found`);
      }

      // Check if dynamic permission exists
      const permission = this.dynamicPermissions.get(permissionId);
      if (!permission) {
        throw new Error(`Dynamic permission with ID '${permissionId}' not found`);
      }

      // Get current role assignments
      const assignments = this.roleAssignments.get(roleId) || { 
        policies: [],
        dynamicPermissions: []
      };

      // Check if permission is already assigned
      if (assignments.dynamicPermissions && assignments.dynamicPermissions.includes(permissionId)) {
        throw new Error(`Dynamic permission '${permission.name}' is already assigned to role '${roleResult.role.name}'`);
      }

      // Assign permission to role
      if (!assignments.dynamicPermissions) {
        assignments.dynamicPermissions = [];
      }
      assignments.dynamicPermissions.push(permissionId);
      this.roleAssignments.set(roleId, assignments);

      logger.info(`Assigned dynamic permission '${permission.name}' to role '${roleResult.role.name}'`, { roleId, permissionId });
      return { 
        success: true, 
        message: `Dynamic permission '${permission.name}' assigned to role '${roleResult.role.name}'` 
      };
    } catch (error) {
      logger.error('Error assigning dynamic permission to role:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a user has access to a resource
   * @param {string} userId - User ID
   * @param {string} resource - Resource name
   * @param {string} action - Action name
   * @param {Object} context - Access context
   * @returns {Object} - Access check result
   */
  checkAccess(userId, resource, action, context = {}) {
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

      // First, check basic permission using the authorization service
      const basicPermission = authorizationService.checkPermission(userId, resource, action);
      
      if (!basicPermission.success) {
        throw new Error(basicPermission.error);
      }

      // If basic permission check passes and policy enforcement is not enabled, return success
      if (basicPermission.authorized && !this.options.enablePolicyEnforcement) {
        return { success: true, authorized: true, source: 'basic_permission' };
      }

      // If policy enforcement is enabled, check policies
      if (this.options.enablePolicyEnforcement) {
        // Get user roles
        const userRolesResult = authorizationService.getUserRoles(userId);
        
        if (!userRolesResult.success) {
          throw new Error(userRolesResult.error);
        }

        const userRoles = userRolesResult.roles;
        
        // Check policies for each role
        for (const role of userRoles) {
          const assignments = this.roleAssignments.get(role.id);
          
          if (assignments && assignments.policies) {
            for (const policyId of assignments.policies) {
              const policy = this.accessPolicies.get(policyId);
              
              if (policy) {
                // Check if policy applies to this resource and action
                const resourceMatch = policy.resources.some(r => r === '*' || r === resource);
                const actionMatch = policy.actions.some(a => a === '*' || a === action);
                
                if (resourceMatch && actionMatch) {
                  // Check conditions if any
                  let conditionsMet = true;
                  
                  if (policy.conditions && policy.conditions.length > 0) {
                    conditionsMet = this._evaluateConditions(policy.conditions, context);
                  }
                  
                  if (conditionsMet) {
                    // If policy effect is 'deny', access is denied
                    if (policy.effect === 'deny') {
                      return { 
                        success: true, 
                        authorized: false, 
                        source: 'policy', 
                        policy: policy.name,
                        reason: `Access denied by policy '${policy.name}'`
                      };
                    }
                    
                    // If policy effect is 'allow', access is granted
                    if (policy.effect === 'allow') {
                      return { 
                        success: true, 
                        authorized: true, 
                        source: 'policy', 
                        policy: policy.name
                      };
                    }
                  }
                }
              }
            }
          }
          
          // Check dynamic permissions if enabled
          if (this.options.enableDynamicPermissions && assignments && assignments.dynamicPermissions) {
            for (const permissionId of assignments.dynamicPermissions) {
              const permission = this.dynamicPermissions.get(permissionId);
              
              if (permission && permission.resource === resource && permission.action === action) {
                // Check constraints
                let constraintsMet = true;
                
                for (const constraintId of permission.constraints) {
                  const constraint = this.resourceConstraints.get(constraintId);
                  
                  if (constraint) {
                    constraintsMet = constraintsMet && this._evaluateConstraint(constraint, context);
                  }
                }
                
                if (constraintsMet) {
                  return { 
                    success: true, 
                    authorized: true, 
                    source: 'dynamic_permission', 
                    permission: permission.name
                  };
                }
              }
            }
          }
        }
      }

      // If we get here, return the result of the basic permission check
      return {
        success: true,
        authorized: basicPermission.authorized,
        source: 'basic_permission',
        reason: basicPermission.reason
      };
    } catch (error) {
      logger.error('Error checking access:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all policies assigned to a role
   * @param {string} roleId - Role ID
   * @returns {Object} - Policies result
   */
  getRolePolicies(roleId) {
    try {
      // Check if role exists
      const roleResult = authorizationService.getRole(roleId);
      if (!roleResult.success) {
        throw new Error(`Role with ID '${roleId}' not found`);
      }

      // Get role assignments
      const assignments = this.roleAssignments.get(roleId) || { policies: [] };
      const policyIds = assignments.policies || [];
      
      // Get policy objects
      const policies = policyIds.map(id => this.accessPolicies.get(id)).filter(Boolean);

      return { 
        success: true, 
        role: roleResult.role,
        policies
      };
    } catch (error) {
      logger.error('Error getting role policies:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all dynamic permissions assigned to a role
   * @param {string} roleId - Role ID
   * @returns {Object} - Permissions result
   */
  getRoleDynamicPermissions(roleId) {
    try {
      // Check if role exists
      const roleResult = authorizationService.getRole(roleId);
      if (!roleResult.success) {
        throw new Error(`Role with ID '${roleId}' not found`);
      }

      // Get role assignments
      const assignments = this.roleAssignments.get(roleId) || { dynamicPermissions: [] };
      const permissionIds = assignments.dynamicPermissions || [];
      
      // Get permission objects
      const permissions = permissionIds.map(id => this.dynamicPermissions.get(id)).filter(Boolean);

      return { 
        success: true, 
        role: roleResult.role,
        permissions
      };
    } catch (error) {
      logger.error('Error getting role dynamic permissions:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Evaluate conditions for a policy
   * @param {Array} conditions - Conditions to evaluate
   * @param {Object} context - Access context
   * @returns {boolean} - Whether conditions are met
   * @private
   */
  _evaluateConditions(conditions, context) {
    // In a real implementation, this would be more sophisticated
    // For this example, we'll do a simple evaluation
    for (const condition of conditions) {
      const { attribute, operator, value } = condition;
      
      if (!context[attribute]) {
        return false;
      }
      
      const contextValue = context[attribute];
      
      switch (operator) {
        case 'eq':
          if (contextValue !== value) return false;
          break;
        case 'ne':
          if (contextValue === value) return false;
          break;
        case 'gt':
          if (contextValue <= value) return false;
          break;
        case 'lt':
          if (contextValue >= value) return false;
          break;
        case 'gte':
          if (contextValue < value) return false;
          break;
        case 'lte':
          if (contextValue > value) return false;
          break;
        case 'in':
          if (!Array.isArray(value) || !value.includes(contextValue)) return false;
          break;
        case 'contains':
          if (!contextValue.includes(value)) return false;
          break;
        default:
          return false;
      }
    }
    
    return true;
  }

  /**
   * Evaluate a constraint
   * @param {Object} constraint - Constraint to evaluate
   * @param {Object} context - Access context
   * @returns {boolean} - Whether constraint is met
   * @private
   */
  _evaluateConstraint(constraint, context) {
    const { attribute, operator, value } = constraint;
    
    if (!context[attribute]) {
      return false;
    }
    
    const contextValue = context[attribute];
    
    switch (operator) {
      case 'eq':
        return contextValue === value;
      case 'ne':
        return contextValue !== value;
      case 'gt':
        return contextValue > value;
      case 'lt':
        return contextValue < value;
      case 'gte':
        return contextValue >= value;
      case 'lte':
        return contextValue <= value;
      case 'in':
        return Array.isArray(value) && value.includes(contextValue);
      case 'contains':
        return contextValue.includes(value);
      default:
        return false;
    }
  }
}

module.exports = { rbacService: new RbacService() };
