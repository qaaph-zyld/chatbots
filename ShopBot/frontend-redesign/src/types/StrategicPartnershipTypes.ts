/**
 * Strategic Partnership Integration Types
 * Enterprise partnership management and integration interfaces
 * Part of Phase 3: Market Leadership - Enterprise Tools & Strategic Integration
 */

// Core Partnership Management
export interface Partnership {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: PartnershipType;
  status: PartnershipStatus;
  tier: PartnershipTier;
  category: PartnershipCategory;
  
  // Partner Information
  partner: PartnerProfile;
  contact: PartnerContact;
  
  // Partnership Details
  agreement: PartnershipAgreement;
  integration: IntegrationConfig;
  collaboration: CollaborationSettings;
  
  // Business Metrics
  metrics: PartnershipMetrics;
  revenue: RevenueSharing;
  
  // Operational
  settings: PartnershipSettings;
  activities: PartnershipActivity[];
  
  // Metadata
  organizationId: string;
  createdBy: string;
  assignedTo: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  renewalDate?: Date;
}

export type PartnershipType = 
  | 'technology' | 'channel' | 'strategic' | 'vendor' | 'supplier' 
  | 'reseller' | 'distributor' | 'integration' | 'consulting' | 'alliance';

export type PartnershipStatus = 
  | 'prospecting' | 'negotiating' | 'active' | 'inactive' 
  | 'suspended' | 'terminated' | 'renewal' | 'expired';

export type PartnershipTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type PartnershipCategory = 
  | 'ecommerce' | 'payment' | 'logistics' | 'marketing' | 'analytics' 
  | 'crm' | 'erp' | 'communication' | 'security' | 'infrastructure';

export interface PartnerProfile {
  companyName: string;
  legalName: string;
  website: string;
  industry: string;
  size: CompanySize;
  headquarters: Address;
  founded: Date;
  description: string;
  logo?: string;
  businessModel: BusinessModel;
  targetMarket: string[];
  geographicPresence: string[];
  revenue?: number;
  employees?: number;
  publiclyTraded: boolean;
}

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type BusinessModel = 'b2b' | 'b2c' | 'b2b2c' | 'marketplace' | 'saas' | 'platform';

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface PartnerContact {
  primary: ContactPerson;
  technical: ContactPerson;
  business: ContactPerson;
  legal?: ContactPerson;
}

export interface ContactPerson {
  name: string;
  title: string;
  email: string;
  phone?: string;
  department: string;
  role: ContactRole;
  timezone: string;
}

export type ContactRole = 'primary' | 'technical' | 'business' | 'legal' | 'billing' | 'support';

// Partnership Agreement
export interface PartnershipAgreement {
  type: AgreementType;
  startDate: Date;
  endDate?: Date;
  duration: number;
  autoRenewal: boolean;
  terms: AgreementTerms;
  documents: AgreementDocument[];
  signatures: AgreementSignature[];
}

export type AgreementType = 'mou' | 'nda' | 'reseller' | 'distributor' | 'technology' | 'strategic';

export interface AgreementTerms {
  exclusivity: boolean;
  territory: string[];
  minimumCommitment?: number;
  performanceRequirements: PerformanceRequirement[];
}

export interface PerformanceRequirement {
  metric: string;
  target: number;
  measurement: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
}

export interface AgreementDocument {
  id: string;
  name: string;
  type: string;
  version: string;
  url: string;
  status: 'draft' | 'review' | 'approved' | 'executed';
}

export interface AgreementSignature {
  signatory: string;
  title: string;
  organization: string;
  signedAt: Date;
  method: 'electronic' | 'digital' | 'wet_signature';
}

// Integration Configuration
export interface IntegrationConfig {
  enabled: boolean;
  type: IntegrationType;
  method: IntegrationMethod;
  endpoints: IntegrationEndpoint[];
  authentication: AuthenticationConfig;
  dataMapping: DataMapping[];
  syncFrequency: SyncFrequency;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export type IntegrationType = 'api' | 'webhook' | 'file_transfer' | 'database' | 'real_time';
export type IntegrationMethod = 'rest_api' | 'graphql' | 'soap' | 'websocket' | 'sftp';

export interface IntegrationEndpoint {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  purpose: string;
  timeout: number;
}

export interface AuthenticationConfig {
  type: 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2';
  credentials: Record<string, string>;
}

export interface DataMapping {
  source: DataSource;
  target: DataTarget;
  transformation: DataTransformation[];
}

export interface DataSource {
  system: string;
  entity: string;
  fields: FieldMapping[];
}

export interface DataTarget {
  system: string;
  entity: string;
  fields: FieldMapping[];
}

export interface FieldMapping {
  source: string;
  target: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
}

export interface DataTransformation {
  type: 'format' | 'calculate' | 'lookup' | 'filter';
  configuration: Record<string, any>;
}

export type SyncFrequency = 'real_time' | 'hourly' | 'daily' | 'weekly' | 'on_demand';

export interface SecurityConfig {
  encryption: boolean;
  accessControl: boolean;
  audit: boolean;
  ipWhitelist: string[];
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  alerts: AlertConfig[];
}

export interface AlertConfig {
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
}

// Collaboration Settings
export interface CollaborationSettings {
  communication: CommunicationSettings;
  projectManagement: ProjectManagementSettings;
  knowledgeSharing: KnowledgeSharingSettings;
}

export interface CommunicationSettings {
  channels: CommunicationChannel[];
  meetings: MeetingSettings;
  notifications: boolean;
}

export interface CommunicationChannel {
  type: 'slack' | 'teams' | 'email' | 'phone';
  name: string;
  participants: string[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
}

export interface MeetingSettings {
  regular: RegularMeeting[];
  adhoc: boolean;
  recording: boolean;
}

export interface RegularMeeting {
  name: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  duration: number;
  participants: string[];
}

export interface ProjectManagementSettings {
  platform: 'jira' | 'asana' | 'trello' | 'custom';
  methodology: 'agile' | 'waterfall' | 'hybrid';
  tracking: ProjectTracking;
}

export interface ProjectTracking {
  milestones: boolean;
  deliverables: boolean;
  risks: boolean;
  issues: boolean;
}

export interface KnowledgeSharingSettings {
  repository: string;
  documentation: boolean;
  training: boolean;
  bestPractices: boolean;
}

// Business Metrics
export interface PartnershipMetrics {
  revenue: RevenueMetrics;
  performance: PerformanceMetrics;
  engagement: EngagementMetrics;
  satisfaction: SatisfactionMetrics;
}

export interface RevenueMetrics {
  totalRevenue: number;
  recurringRevenue: number;
  growthRate: number;
  averageDealSize: number;
  conversionRate: number;
}

export interface PerformanceMetrics {
  slaCompliance: number;
  responseTime: number;
  uptime: number;
  errorRate: number;
  throughput: number;
}

export interface EngagementMetrics {
  activeUsers: number;
  sessionDuration: number;
  featureAdoption: number;
  supportTickets: number;
  trainingCompletion: number;
}

export interface SatisfactionMetrics {
  nps: number;
  csat: number;
  renewalRate: number;
  expansionRate: number;
  churnRate: number;
}

export interface RevenueSharing {
  model: RevenueSharingModel;
  percentage: number;
  minimumThreshold?: number;
  paymentTerms: PaymentTerms;
  reporting: RevenueReporting;
}

export type RevenueSharingModel = 'percentage' | 'fixed_fee' | 'tiered' | 'hybrid';

export interface PaymentTerms {
  frequency: 'monthly' | 'quarterly' | 'annually';
  paymentMethod: 'wire' | 'ach' | 'check' | 'digital';
  currency: string;
  terms: string;
}

export interface RevenueReporting {
  frequency: 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'api';
  recipients: string[];
  automated: boolean;
}

// Partnership Activities
export interface PartnershipActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  assignedTo: string[];
  dueDate?: Date;
  completedDate?: Date;
  tags: string[];
  attachments: ActivityAttachment[];
  comments: ActivityComment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityType = 
  | 'onboarding' | 'training' | 'integration' | 'marketing' | 'sales' 
  | 'support' | 'review' | 'renewal' | 'compliance' | 'general';

export type ActivityStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ActivityAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ActivityComment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  edited: boolean;
  editedAt?: Date;
}

// Partnership Settings
export interface PartnershipSettings {
  visibility: PartnershipVisibility;
  notifications: NotificationSettings;
  automation: AutomationSettings;
  compliance: ComplianceSettings;
  reporting: ReportingSettings;
}

export type PartnershipVisibility = 'public' | 'internal' | 'restricted' | 'confidential';

export interface NotificationSettings {
  enabled: boolean;
  events: NotificationEvent[];
  channels: NotificationChannel[];
  recipients: NotificationRecipient[];
}

export type NotificationEvent = 
  | 'status_change' | 'milestone_reached' | 'issue_reported' | 'renewal_due' 
  | 'performance_alert' | 'document_signed' | 'payment_received';

export interface NotificationChannel {
  type: 'email' | 'sms' | 'slack' | 'webhook';
  enabled: boolean;
  configuration: Record<string, any>;
}

export interface NotificationRecipient {
  type: 'user' | 'role' | 'team' | 'external';
  identifier: string;
  events: NotificationEvent[];
}

export interface AutomationSettings {
  enabled: boolean;
  workflows: AutomationWorkflow[];
  triggers: AutomationTrigger[];
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: AutomationAction[];
  enabled: boolean;
}

export interface AutomationAction {
  type: 'email' | 'task' | 'notification' | 'update' | 'integration';
  configuration: Record<string, any>;
}

export interface AutomationTrigger {
  event: string;
  conditions: TriggerCondition[];
  enabled: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface ComplianceSettings {
  standards: ComplianceStandard[];
  assessments: ComplianceAssessment[];
  monitoring: boolean;
}

export interface ComplianceStandard {
  name: string;
  version: string;
  applicable: boolean;
  requirements: ComplianceRequirement[];
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
  evidence: string[];
  lastAssessed: Date;
}

export interface ComplianceAssessment {
  id: string;
  standard: string;
  assessor: string;
  date: Date;
  score: number;
  findings: AssessmentFinding[];
}

export interface AssessmentFinding {
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface ReportingSettings {
  enabled: boolean;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  format: 'pdf' | 'excel' | 'html' | 'json';
  recipients: string[];
  metrics: string[];
  automated: boolean;
}

// Partnership Analytics
export interface PartnershipAnalytics {
  overview: AnalyticsOverview;
  trends: AnalyticsTrend[];
  benchmarks: AnalyticsBenchmark[];
  forecasts: AnalyticsForecast[];
}

export interface AnalyticsOverview {
  totalPartnerships: number;
  activePartnerships: number;
  totalRevenue: number;
  averagePartnershipValue: number;
  topPerformingPartners: PartnerPerformance[];
}

export interface PartnerPerformance {
  partnerId: string;
  partnerName: string;
  revenue: number;
  growth: number;
  satisfaction: number;
  tier: PartnershipTier;
}

export interface AnalyticsTrend {
  metric: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  data: TrendDataPoint[];
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  change?: number;
}

export interface AnalyticsBenchmark {
  metric: string;
  industry: string;
  value: number;
  percentile: number;
  source: string;
}

export interface AnalyticsForecast {
  metric: string;
  period: number; // months
  predictions: ForecastPrediction[];
  confidence: number;
  methodology: string;
}

export interface ForecastPrediction {
  date: Date;
  value: number;
  lowerBound: number;
  upperBound: number;
}
