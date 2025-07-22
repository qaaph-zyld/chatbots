/**
 * Enterprise Collaboration Types
 * Role-based permissions and team collaboration interfaces
 * Part of Phase 3: Market Leadership - Enterprise Tools & Strategic Integration
 */

// Core User and Role Management
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  status: UserStatus;
  roles: Role[];
  permissions: Permission[];
  organizationId: string;
  departmentId?: string;
  managerId?: string;
  directReports: string[];
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  securitySettings: SecuritySettings;
}

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface Role {
  id: string;
  name: string;
  description: string;
  level: RoleLevel;
  permissions: Permission[];
  inheritsFrom?: string[];
  isCustom: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RoleLevel = 'system' | 'organization' | 'department' | 'team' | 'individual';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: ResourceType;
  actions: PermissionAction[];
  conditions?: PermissionCondition[];
  scope: PermissionScope;
  category: PermissionCategory;
}

export type ResourceType = 
  | 'dashboard' 
  | 'report' 
  | 'user' 
  | 'role' 
  | 'organization' 
  | 'project' 
  | 'workflow' 
  | 'integration' 
  | 'settings' 
  | 'billing';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'approve' | 'share' | 'export';

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'and' | 'or' | 'not';
}

export type PermissionScope = 'global' | 'organization' | 'department' | 'team' | 'own';

export type PermissionCategory = 
  | 'administration' 
  | 'content' 
  | 'analytics' 
  | 'collaboration' 
  | 'security' 
  | 'integration';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  push: boolean;
  sms: boolean;
  frequency: NotificationFrequency;
  categories: NotificationCategory[];
}

export type NotificationFrequency = 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';

export type NotificationCategory = 
  | 'system' 
  | 'security' 
  | 'collaboration' 
  | 'reports' 
  | 'workflows' 
  | 'mentions' 
  | 'assignments';

export interface DashboardPreferences {
  defaultView: string;
  widgets: WidgetPreference[];
  layout: 'grid' | 'list' | 'cards';
  density: 'compact' | 'comfortable' | 'spacious';
}

export interface WidgetPreference {
  id: string;
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'organization' | 'team' | 'private';
  activityTracking: boolean;
  dataSharing: boolean;
  analyticsOptOut: boolean;
}

export interface SecuritySettings {
  mfaEnabled: boolean;
  mfaMethods: MFAMethod[];
  sessionTimeout: number;
  ipWhitelist: string[];
  deviceTrust: DeviceTrustSettings;
  passwordPolicy: PasswordPolicy;
}

export type MFAMethod = 'totp' | 'sms' | 'email' | 'hardware_key' | 'biometric';

export interface DeviceTrustSettings {
  enabled: boolean;
  trustDuration: number;
  requireApproval: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  historyCount: number;
  expirationDays: number;
}

// Organization and Team Structure
export interface Organization {
  id: string;
  name: string;
  displayName: string;
  domain: string;
  logo?: string;
  description: string;
  industry: string;
  size: OrganizationSize;
  plan: SubscriptionPlan;
  settings: OrganizationSettings;
  departments: Department[];
  teams: Team[];
  projects: Project[];
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizationSize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: 'basic' | 'professional' | 'enterprise' | 'custom';
  features: string[];
  limits: PlanLimits;
  billing: BillingInfo;
}

export interface PlanLimits {
  users: number;
  projects: number;
  storage: number;
  apiCalls: number;
  customRoles: number;
  integrations: number;
}

export interface BillingInfo {
  cycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  nextBilling: Date;
  status: 'active' | 'past_due' | 'cancelled' | 'trial';
}

export interface OrganizationSettings {
  security: SecurityPolicy;
  collaboration: CollaborationSettings;
  branding: BrandingSettings;
  integrations: IntegrationSettings;
  compliance: ComplianceSettings;
}

export interface SecurityPolicy {
  passwordPolicy: PasswordPolicy;
  mfaRequired: boolean;
  sessionTimeout: number;
  ipRestrictions: boolean;
  ssoEnabled: boolean;
  ssoProvider?: string;
  auditLogging: boolean;
  dataRetention: number;
}

export interface CollaborationSettings {
  defaultPermissions: Permission[];
  guestAccess: boolean;
  externalSharing: boolean;
  commentModeration: boolean;
  mentionNotifications: boolean;
  activityTracking: boolean;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  favicon: string;
  customDomain?: string;
  whiteLabel: boolean;
}

export interface IntegrationSettings {
  allowedIntegrations: string[];
  apiAccess: boolean;
  webhookEndpoints: string[];
  rateLimits: Record<string, number>;
}

export interface ComplianceSettings {
  gdprEnabled: boolean;
  hipaaEnabled: boolean;
  soc2Enabled: boolean;
  dataProcessingAgreement: boolean;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  managerId: string;
  parentId?: string;
  organizationId: string;
  members: string[];
  teams: string[];
  budget?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  type: TeamType;
  leaderId: string;
  members: TeamMember[];
  departmentId?: string;
  organizationId: string;
  projects: string[];
  channels: Channel[];
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type TeamType = 'permanent' | 'project' | 'cross_functional' | 'temporary';

export interface TeamMember {
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  permissions: Permission[];
  status: MemberStatus;
}

export type TeamRole = 'owner' | 'admin' | 'member' | 'guest' | 'viewer';
export type MemberStatus = 'active' | 'inactive' | 'pending' | 'invited';

export interface TeamSettings {
  visibility: 'public' | 'private' | 'organization';
  joinPolicy: 'open' | 'approval' | 'invitation';
  defaultRole: TeamRole;
  allowGuests: boolean;
  mentionEveryone: boolean;
}

// Project and Workspace Management
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  ownerId: string;
  teamId?: string;
  organizationId: string;
  members: ProjectMember[];
  workspaces: Workspace[];
  milestones: Milestone[];
  tags: string[];
  metadata: ProjectMetadata;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  permissions: Permission[];
  allocation: number;
  joinedAt: Date;
}

export type ProjectRole = 'owner' | 'manager' | 'contributor' | 'reviewer' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  type: WorkspaceType;
  projectId: string;
  ownerId: string;
  members: string[];
  resources: WorkspaceResource[];
  settings: WorkspaceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type WorkspaceType = 'dashboard' | 'report' | 'analysis' | 'collaboration' | 'presentation';

export interface WorkspaceResource {
  id: string;
  type: ResourceType;
  name: string;
  url: string;
  permissions: Permission[];
  metadata: Record<string, any>;
}

export interface WorkspaceSettings {
  visibility: 'public' | 'private' | 'team' | 'project';
  editMode: 'collaborative' | 'locked' | 'approval';
  versionControl: boolean;
  autoSave: boolean;
  backupFrequency: 'never' | 'hourly' | 'daily' | 'weekly';
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: MilestoneStatus;
  progress: number;
  dependencies: string[];
  assigneeId?: string;
  deliverables: Deliverable[];
}

export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  type: DeliverableType;
  status: DeliverableStatus;
  assigneeId: string;
  dueDate: Date;
  attachments: Attachment[];
}

export type DeliverableType = 'document' | 'report' | 'dashboard' | 'presentation' | 'code' | 'design';
export type DeliverableStatus = 'draft' | 'review' | 'approved' | 'rejected' | 'completed';

export interface ProjectMetadata {
  budget?: number;
  estimatedHours?: number;
  actualHours?: number;
  roi?: number;
  riskLevel: 'low' | 'medium' | 'high';
  category: string;
  client?: string;
}

export interface ProjectSettings {
  timeTracking: boolean;
  budgetTracking: boolean;
  approvalWorkflow: boolean;
  notifications: boolean;
  publicAccess: boolean;
  guestCollaboration: boolean;
}

// Communication and Collaboration
export interface Channel {
  id: string;
  name: string;
  description: string;
  type: ChannelType;
  visibility: ChannelVisibility;
  teamId?: string;
  projectId?: string;
  organizationId: string;
  members: ChannelMember[];
  messages: Message[];
  settings: ChannelSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type ChannelType = 'text' | 'voice' | 'video' | 'announcement' | 'general' | 'random';
export type ChannelVisibility = 'public' | 'private' | 'archived';

export interface ChannelMember {
  userId: string;
  role: ChannelRole;
  joinedAt: Date;
  lastRead?: Date;
  notifications: boolean;
}

export type ChannelRole = 'owner' | 'admin' | 'member' | 'guest';

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  authorId: string;
  channelId: string;
  parentId?: string;
  mentions: string[];
  attachments: Attachment[];
  reactions: Reaction[];
  editHistory: EditHistory[];
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export type MessageType = 'text' | 'file' | 'image' | 'video' | 'audio' | 'link' | 'system';

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata: Record<string, any>;
}

export interface Reaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface EditHistory {
  content: string;
  editedAt: Date;
  reason?: string;
}

export interface ChannelSettings {
  allowFiles: boolean;
  allowImages: boolean;
  allowVideos: boolean;
  allowLinks: boolean;
  messageRetention: number;
  slowMode: number;
  mentionEveryone: boolean;
}

// Activity and Audit
export interface Activity {
  id: string;
  type: ActivityType;
  action: string;
  description: string;
  actorId: string;
  targetId?: string;
  targetType?: string;
  organizationId: string;
  projectId?: string;
  teamId?: string;
  metadata: ActivityMetadata;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export type ActivityType = 
  | 'user' 
  | 'role' 
  | 'permission' 
  | 'project' 
  | 'team' 
  | 'workspace' 
  | 'message' 
  | 'file' 
  | 'integration' 
  | 'security';

export interface ActivityMetadata {
  changes?: Record<string, { from: any; to: any }>;
  context?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
}

export interface AuditLog {
  id: string;
  event: AuditEvent;
  userId: string;
  organizationId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  result: AuditResult;
  details: AuditDetails;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
}

export type AuditEvent = 
  | 'login' 
  | 'logout' 
  | 'permission_change' 
  | 'data_access' 
  | 'data_export' 
  | 'configuration_change' 
  | 'security_event';

export type AuditResult = 'success' | 'failure' | 'warning';

export interface AuditDetails {
  description: string;
  changes?: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  compliance: ComplianceInfo[];
}

export interface ComplianceInfo {
  standard: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial';
}

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

// Notifications and Alerts
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  senderId?: string;
  organizationId: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  channels: NotificationChannel[];
  status: NotificationStatus;
  metadata: NotificationMetadata;
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export type NotificationType = 
  | 'mention' 
  | 'assignment' 
  | 'approval' 
  | 'deadline' 
  | 'security' 
  | 'system' 
  | 'invitation' 
  | 'announcement';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'webhook';

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface NotificationMetadata {
  actionUrl?: string;
  actionText?: string;
  expiresAt?: Date;
  groupId?: string;
  templateId?: string;
  variables?: Record<string, any>;
}

// Integration and API
export interface Integration {
  id: string;
  name: string;
  type: IntegrationType;
  provider: string;
  status: IntegrationStatus;
  organizationId: string;
  configuration: IntegrationConfig;
  credentials: IntegrationCredentials;
  permissions: Permission[];
  usage: IntegrationUsage;
  createdAt: Date;
  updatedAt: Date;
  lastSync?: Date;
}

export type IntegrationType = 
  | 'sso' 
  | 'directory' 
  | 'communication' 
  | 'storage' 
  | 'analytics' 
  | 'crm' 
  | 'project_management' 
  | 'custom';

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'pending' | 'expired';

export interface IntegrationConfig {
  endpoints: Record<string, string>;
  settings: Record<string, any>;
  mappings: FieldMapping[];
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly' | 'manual';
  dataFilters: DataFilter[];
}

export interface IntegrationCredentials {
  type: 'oauth' | 'api_key' | 'basic_auth' | 'certificate';
  data: Record<string, any>;
  expiresAt?: Date;
}

export interface FieldMapping {
  source: string;
  target: string;
  transformation?: string;
  required: boolean;
}

export interface DataFilter {
  field: string;
  operator: string;
  value: any;
  active: boolean;
}

export interface IntegrationUsage {
  apiCalls: number;
  dataTransferred: number;
  lastActivity: Date;
  errorCount: number;
  successRate: number;
}

// Search and Discovery
export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  url: string;
  score: number;
  highlights: SearchHighlight[];
  metadata: SearchMetadata;
  permissions: Permission[];
}

export type SearchResultType = 
  | 'user' 
  | 'team' 
  | 'project' 
  | 'workspace' 
  | 'message' 
  | 'file' 
  | 'report' 
  | 'dashboard';

export interface SearchHighlight {
  field: string;
  fragments: string[];
}

export interface SearchMetadata {
  createdAt: Date;
  updatedAt: Date;
  author: string;
  tags: string[];
  category: string;
  size?: number;
}

export interface SearchQuery {
  query: string;
  filters: SearchFilter[];
  sort: SearchSort[];
  pagination: SearchPagination;
  facets: string[];
}

export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'range' | 'in';
  value: any;
}

export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchPagination {
  page: number;
  size: number;
  total?: number;
}
