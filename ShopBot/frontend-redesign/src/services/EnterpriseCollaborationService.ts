/**
 * Enterprise Collaboration Service
 * Role-based permissions and team collaboration engine with enterprise security
 * Part of Phase 3: Market Leadership - Enterprise Tools & Strategic Integration
 */

import {
  User, Role, Permission, Organization, Team, Project, 
  Activity, AuditLog, Notification, SearchResult,
  UserStatus, TeamMember, ProjectMember, SecuritySettings
} from '../types/EnterpriseCollaborationTypes';

class EnterpriseCollaborationService {
  private static instance: EnterpriseCollaborationService;
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private teams: Map<string, Team> = new Map();
  private projects: Map<string, Project> = new Map();
  private activities: Activity[] = [];
  private auditLogs: AuditLog[] = [];

  private constructor() {
    this.initializeDefaultData();
  }

  static getInstance(): EnterpriseCollaborationService {
    if (!EnterpriseCollaborationService.instance) {
      EnterpriseCollaborationService.instance = new EnterpriseCollaborationService();
    }
    return EnterpriseCollaborationService.instance;
  }

  private initializeDefaultData() {
    this.initializePermissions();
    this.initializeRoles();
    this.initializeSampleData();
  }

  private initializePermissions() {
    const corePermissions: Omit<Permission, 'id'>[] = [
      { name: 'user.read', description: 'View user profiles', resource: 'user', actions: ['read'], scope: 'organization', category: 'administration' },
      { name: 'user.create', description: 'Create new users', resource: 'user', actions: ['create'], scope: 'organization', category: 'administration' },
      { name: 'role.manage', description: 'Manage roles and permissions', resource: 'role', actions: ['create', 'read', 'update', 'delete'], scope: 'organization', category: 'security' },
      { name: 'project.create', description: 'Create new projects', resource: 'project', actions: ['create'], scope: 'organization', category: 'content' },
      { name: 'project.read', description: 'View projects', resource: 'project', actions: ['read'], scope: 'team', category: 'content' },
      { name: 'dashboard.view', description: 'View dashboards', resource: 'dashboard', actions: ['read'], scope: 'team', category: 'analytics' },
      { name: 'audit.view', description: 'View audit logs', resource: 'settings', actions: ['read'], scope: 'organization', category: 'security' },
      { name: 'integration.manage', description: 'Manage integrations', resource: 'integration', actions: ['create', 'read', 'update', 'delete'], scope: 'organization', category: 'integration' }
    ];

    corePermissions.forEach((perm, index) => {
      const permission: Permission = { ...perm, id: `perm_${index + 1}` };
      this.permissions.set(permission.id, permission);
    });
  }

  private initializeRoles() {
    const coreRoles: Omit<Role, 'id'>[] = [
      {
        name: 'System Administrator',
        description: 'Full system access with all permissions',
        level: 'system',
        permissions: Array.from(this.permissions.values()),
        isCustom: false,
        organizationId: 'org_1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Team Lead',
        description: 'Team management and project oversight',
        level: 'team',
        permissions: Array.from(this.permissions.values()).filter(p => 
          ['content', 'analytics', 'collaboration'].includes(p.category)
        ),
        isCustom: false,
        organizationId: 'org_1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Team Member',
        description: 'Standard team collaboration access',
        level: 'team',
        permissions: Array.from(this.permissions.values()).filter(p => 
          p.actions.includes('read') || p.scope === 'own'
        ),
        isCustom: false,
        organizationId: 'org_1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    coreRoles.forEach((role, index) => {
      const roleObj: Role = { ...role, id: `role_${index + 1}` };
      this.roles.set(roleObj.id, roleObj);
    });
  }

  private initializeSampleData() {
    // Sample organization
    const organization: Organization = {
      id: 'org_1',
      name: 'shopbot-enterprise',
      displayName: 'ShopBot Enterprise',
      domain: 'shopbot.ai',
      description: 'AI-powered customer engagement platform',
      industry: 'Technology',
      size: 'enterprise',
      plan: {
        id: 'plan_enterprise',
        name: 'Enterprise Plan',
        tier: 'enterprise',
        features: ['unlimited_users', 'advanced_security', 'custom_integrations'],
        limits: { users: -1, projects: -1, storage: 1000000, apiCalls: 1000000, customRoles: 50, integrations: 100 },
        billing: { cycle: 'yearly', amount: 50000, currency: 'USD', nextBilling: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), status: 'active' }
      },
      settings: {
        security: {
          passwordPolicy: { minLength: 12, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSymbols: true, historyCount: 5, expirationDays: 90 },
          mfaRequired: true,
          sessionTimeout: 3600,
          ipRestrictions: true,
          ssoEnabled: true,
          ssoProvider: 'okta',
          auditLogging: true,
          dataRetention: 2555
        },
        collaboration: {
          defaultPermissions: Array.from(this.permissions.values()).filter(p => p.name === 'project.read'),
          guestAccess: false,
          externalSharing: false,
          commentModeration: true,
          mentionNotifications: true,
          activityTracking: true
        },
        branding: { primaryColor: '#3b82f6', secondaryColor: '#10b981', logo: '/assets/logo.png', favicon: '/assets/favicon.ico', whiteLabel: true },
        integrations: { allowedIntegrations: ['slack', 'teams'], apiAccess: true, webhookEndpoints: ['https://api.shopbot.ai/webhooks'], rateLimits: { 'api_calls_per_hour': 10000 } },
        compliance: { gdprEnabled: true, hipaaEnabled: false, soc2Enabled: true, dataProcessingAgreement: true }
      },
      departments: [],
      teams: [],
      projects: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    };
    this.organizations.set(organization.id, organization);

    // Sample users
    const adminUser: User = {
      id: 'user_1',
      email: 'admin@shopbot.ai',
      firstName: 'System',
      lastName: 'Administrator',
      displayName: 'System Admin',
      status: 'active',
      roles: [this.roles.get('role_1')!],
      permissions: Array.from(this.permissions.values()),
      organizationId: 'org_1',
      directReports: [],
      lastLogin: new Date(),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications: { email: true, inApp: true, push: true, sms: false, frequency: 'immediate', categories: ['system', 'security'] },
        dashboard: { defaultView: 'overview', widgets: [], layout: 'grid', density: 'comfortable' },
        privacy: { profileVisibility: 'organization', activityTracking: true, dataSharing: false, analyticsOptOut: false }
      },
      securitySettings: {
        mfaEnabled: true,
        mfaMethods: ['totp', 'hardware_key'],
        sessionTimeout: 3600,
        ipWhitelist: [],
        deviceTrust: { enabled: true, trustDuration: 30, requireApproval: true },
        passwordPolicy: { minLength: 12, requireUppercase: true, requireLowercase: true, requireNumbers: true, requireSymbols: true, historyCount: 5, expirationDays: 90 }
      }
    };
    this.users.set(adminUser.id, adminUser);
  }

  // Authentication & Authorization
  async authenticateUser(email: string, password: string, mfaToken?: string): Promise<{ user: User; token: string } | null> {
    await this.delay(500);
    
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user || user.status !== 'active') {
      await this.logAuditEvent('login', user?.id || 'unknown', 'user', email, 'login', 'failure', {
        description: 'Failed login attempt - invalid credentials',
        riskLevel: 'medium',
        compliance: []
      });
      return null;
    }

    if (user.securitySettings.mfaEnabled && !mfaToken) {
      throw new Error('MFA_REQUIRED');
    }

    user.lastLogin = new Date();
    this.users.set(user.id, user);

    const token = this.generateSecureToken(user.id);
    
    await this.logAuditEvent('login', user.id, 'user', user.id, 'login', 'success', {
      description: 'Successful user login',
      riskLevel: 'low',
      compliance: [{ standard: 'SOC2', requirement: 'Access Control', status: 'compliant' }]
    });

    return { user, token };
  }

  async checkPermission(userId: string, permission: string, resourceId?: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || user.status !== 'active') return false;

    const hasDirectPermission = user.permissions.some(p => p.name === permission);
    if (hasDirectPermission) return true;

    const hasRolePermission = user.roles.some(role => 
      role.permissions.some(p => p.name === permission)
    );

    await this.logActivity('permission', `Permission check: ${permission}`, userId, resourceId, 'security', {
      permission, result: hasRolePermission, resourceId
    });

    return hasRolePermission;
  }

  async assignRole(userId: string, roleId: string, assignedBy: string): Promise<void> {
    const user = this.users.get(userId);
    const role = this.roles.get(roleId);
    
    if (!user || !role) throw new Error('User or role not found');

    const canAssignRoles = await this.checkPermission(assignedBy, 'role.manage');
    if (!canAssignRoles) throw new Error('Insufficient permissions to assign roles');

    if (!user.roles.some(r => r.id === roleId)) {
      user.roles.push(role);
      user.updatedAt = new Date();
      this.users.set(userId, user);

      await this.logAuditEvent('permission_change', assignedBy, 'role', roleId, 'assign_role', 'success', {
        description: `Role ${role.name} assigned to user ${user.displayName}`,
        changes: { role_added: role.name },
        riskLevel: 'medium',
        compliance: [{ standard: 'SOC2', requirement: 'Access Control', status: 'compliant' }]
      });
    }
  }

  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<string> {
    const canCreateUsers = await this.checkPermission(createdBy, 'user.create');
    if (!canCreateUsers) throw new Error('Insufficient permissions to create users');

    const userId = this.generateId();
    const user: User = { ...userData, id: userId, createdAt: new Date(), updatedAt: new Date() };
    this.users.set(userId, user);

    await this.logAuditEvent('user', createdBy, 'user', userId, 'create_user', 'success', {
      description: `New user created: ${user.displayName}`,
      riskLevel: 'low',
      compliance: [{ standard: 'GDPR', requirement: 'Data Processing', status: 'compliant' }]
    });

    return userId;
  }

  // Team Management
  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<string> {
    const teamId = this.generateId();
    const team: Team = { ...teamData, id: teamId, createdAt: new Date(), updatedAt: new Date() };
    this.teams.set(teamId, team);

    await this.logActivity('team', `Team created: ${team.name}`, createdBy, teamId, 'collaboration', {
      teamName: team.name, teamType: team.type
    });

    return teamId;
  }

  // Project Management
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<string> {
    const canCreateProjects = await this.checkPermission(createdBy, 'project.create');
    if (!canCreateProjects) throw new Error('Insufficient permissions to create projects');

    const projectId = this.generateId();
    const project: Project = { ...projectData, id: projectId, createdAt: new Date(), updatedAt: new Date() };
    this.projects.set(projectId, project);

    await this.logActivity('project', `Project created: ${project.name}`, createdBy, projectId, 'content', {
      projectName: project.name, priority: project.priority
    });

    return projectId;
  }

  // Search
  async searchResources(query: string, userId: string): Promise<SearchResult[]> {
    await this.delay(300);
    const results: SearchResult[] = [];
    
    if (await this.checkPermission(userId, 'user.read')) {
      Array.from(this.users.values())
        .filter(user => 
          user.displayName.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        )
        .forEach(user => {
          results.push({
            id: user.id,
            type: 'user',
            title: user.displayName,
            description: user.email,
            url: `/users/${user.id}`,
            score: 0.9,
            highlights: [],
            metadata: { createdAt: user.createdAt, updatedAt: user.updatedAt, author: 'system', tags: ['user'], category: 'people' },
            permissions: []
          });
        });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // Audit and Logging
  private async logAuditEvent(event: string, userId: string, resourceType: string, resourceId: string, action: string, result: 'success' | 'failure' | 'warning', details: any): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      event: event as any,
      userId,
      organizationId: 'org_1',
      resourceType,
      resourceId,
      action,
      result,
      details,
      timestamp: new Date(),
      ipAddress: '192.168.1.100',
      userAgent: 'ShopBot Enterprise Client',
      location: { country: 'US', region: 'California', city: 'San Francisco', latitude: 37.7749, longitude: -122.4194 }
    };

    this.auditLogs.push(auditLog);
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  private async logActivity(type: string, description: string, actorId: string, targetId?: string, category?: string, metadata?: any): Promise<void> {
    const activity: Activity = {
      id: this.generateId(),
      type: type as any,
      action: 'performed',
      description,
      actorId,
      targetId,
      organizationId: 'org_1',
      metadata: { ...metadata, category, severity: 'low' },
      timestamp: new Date(),
      ipAddress: '192.168.1.100',
      userAgent: 'ShopBot Enterprise Client'
    };

    this.activities.push(activity);
    if (this.activities.length > 5000) {
      this.activities = this.activities.slice(-5000);
    }
  }

  // Data Access
  getUser(id: string): User | undefined { return this.users.get(id); }
  getAllUsers(): User[] { return Array.from(this.users.values()); }
  getRole(id: string): Role | undefined { return this.roles.get(id); }
  getAllRoles(): Role[] { return Array.from(this.roles.values()); }
  getOrganization(id: string): Organization | undefined { return this.organizations.get(id); }
  getTeam(id: string): Team | undefined { return this.teams.get(id); }
  getAllTeams(): Team[] { return Array.from(this.teams.values()); }
  getProject(id: string): Project | undefined { return this.projects.get(id); }
  getAllProjects(): Project[] { return Array.from(this.projects.values()); }
  getActivities(): Activity[] { return [...this.activities]; }
  getAuditLogs(): AuditLog[] { return [...this.auditLogs]; }

  // Utility Methods
  private generateId(): string { return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }
  private generateSecureToken(userId: string): string { return `token_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`; }
  private async delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
  private getChanges(oldData: any, newData: any): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};
    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = { from: oldData[key], to: newData[key] };
      }
    });
    return changes;
  }
}

export default EnterpriseCollaborationService;
