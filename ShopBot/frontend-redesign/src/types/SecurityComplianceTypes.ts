/**
 * Security & Compliance Framework Types
 * Comprehensive type definitions for security monitoring, compliance validation, and threat detection
 */

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'application' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  rules: SecurityRule[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  compliance: ComplianceStandard[];
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: 'validation' | 'sanitization' | 'encryption' | 'access_control' | 'monitoring';
  condition: string;
  action: SecurityAction;
  parameters: Record<string, any>;
  isEnabled: boolean;
  priority: number;
}

export interface SecurityAction {
  type: 'allow' | 'deny' | 'log' | 'alert' | 'sanitize' | 'encrypt' | 'redirect';
  parameters: Record<string, any>;
  notification?: {
    channels: ('email' | 'slack' | 'webhook' | 'dashboard')[];
    recipients: string[];
    template: string;
  };
}

export interface ComplianceStandard {
  name: 'GDPR' | 'CCPA' | 'HIPAA' | 'SOX' | 'PCI_DSS' | 'ISO_27001' | 'WCAG_2_1';
  version: string;
  requirements: ComplianceRequirement[];
  status: 'compliant' | 'non_compliant' | 'partial' | 'pending_review';
  lastAudit: Date;
  nextAudit: Date;
}

export interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  mandatory: boolean;
  status: 'met' | 'not_met' | 'partial' | 'not_applicable';
  evidence: ComplianceEvidence[];
  remediation?: RemediationPlan;
  lastChecked: Date;
}

export interface ComplianceEvidence {
  id: string;
  type: 'document' | 'code' | 'configuration' | 'test_result' | 'audit_log';
  title: string;
  description: string;
  url?: string;
  content?: string;
  createdAt: Date;
  validUntil?: Date;
}

export interface RemediationPlan {
  id: string;
  title: string;
  description: string;
  steps: RemediationStep[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: number; // hours
  assignedTo?: string;
  dueDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface RemediationStep {
  id: string;
  description: string;
  type: 'code_change' | 'configuration' | 'documentation' | 'training' | 'process';
  estimatedTime: number; // minutes
  dependencies: string[];
  isCompleted: boolean;
  completedAt?: Date;
}

export interface SecurityVulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  category: 'xss' | 'csrf' | 'sql_injection' | 'authentication' | 'authorization' | 'data_exposure' | 'configuration' | 'dependency';
  cwe?: string; // Common Weakness Enumeration
  cvss?: number; // Common Vulnerability Scoring System
  affectedComponents: string[];
  exploitability: 'none' | 'low' | 'medium' | 'high';
  impact: 'none' | 'low' | 'medium' | 'high';
  detectedAt: Date;
  source: 'automated_scan' | 'manual_review' | 'external_report' | 'penetration_test';
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive' | 'accepted_risk';
  remediation?: RemediationPlan;
  references: string[];
}

export interface SecurityScanResult {
  id: string;
  scanType: 'static_analysis' | 'dynamic_analysis' | 'dependency_check' | 'configuration_audit' | 'penetration_test';
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    infoIssues: number;
  };
  vulnerabilities: SecurityVulnerability[];
  recommendations: SecurityRecommendation[];
  metadata: {
    scanner: string;
    version: string;
    configuration: Record<string, any>;
    coverage: number; // percentage
  };
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'immediate' | 'short_term' | 'long_term';
  priority: number;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  implementation: {
    steps: string[];
    codeExample?: string;
    resources: string[];
    tools?: string[];
  };
  compliance: ComplianceStandard[];
  isImplemented: boolean;
  implementedAt?: Date;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'data_breach' | 'unauthorized_access' | 'malware' | 'phishing' | 'dos_attack' | 'insider_threat' | 'configuration_error';
  status: 'detected' | 'investigating' | 'contained' | 'resolved' | 'closed';
  detectedAt: Date;
  reportedBy: string;
  assignedTo?: string;
  affectedSystems: string[];
  affectedUsers: number;
  timeline: IncidentTimelineEntry[];
  evidence: IncidentEvidence[];
  response: IncidentResponse;
  postMortem?: PostMortemReport;
}

export interface IncidentTimelineEntry {
  id: string;
  timestamp: Date;
  event: string;
  description: string;
  author: string;
  type: 'detection' | 'analysis' | 'containment' | 'eradication' | 'recovery' | 'communication';
}

export interface IncidentEvidence {
  id: string;
  type: 'log' | 'screenshot' | 'network_capture' | 'file' | 'memory_dump';
  title: string;
  description: string;
  url?: string;
  hash?: string;
  collectedAt: Date;
  collectedBy: string;
}

export interface IncidentResponse {
  containmentActions: string[];
  eradicationActions: string[];
  recoveryActions: string[];
  communicationPlan: {
    internal: string[];
    external: string[];
    regulatory: string[];
  };
  lessonsLearned: string[];
}

export interface PostMortemReport {
  id: string;
  summary: string;
  rootCause: string;
  timeline: string;
  impact: {
    users: number;
    systems: string[];
    downtime: number; // minutes
    financialLoss?: number;
    reputationalImpact: 'low' | 'medium' | 'high';
  };
  response: {
    detectionTime: number; // minutes
    responseTime: number; // minutes
    resolutionTime: number; // minutes
    effectiveness: 'poor' | 'fair' | 'good' | 'excellent';
  };
  improvements: PostMortemImprovement[];
  createdAt: Date;
  reviewedBy: string[];
}

export interface PostMortemImprovement {
  id: string;
  description: string;
  category: 'prevention' | 'detection' | 'response' | 'recovery' | 'communication';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  dueDate: Date;
  status: 'planned' | 'in_progress' | 'completed';
}

export interface SecurityMetrics {
  timestamp: Date;
  vulnerabilities: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    resolved: number;
    averageTimeToResolve: number; // hours
  };
  incidents: {
    total: number;
    open: number;
    resolved: number;
    averageDetectionTime: number; // minutes
    averageResponseTime: number; // minutes
  };
  compliance: {
    overallScore: number; // percentage
    standards: Array<{
      name: string;
      score: number;
      status: 'compliant' | 'non_compliant' | 'partial';
    }>;
  };
  scans: {
    total: number;
    passed: number;
    failed: number;
    lastScanDate: Date;
    coverage: number; // percentage
  };
  training: {
    completionRate: number; // percentage
    averageScore: number; // percentage
    lastTrainingDate: Date;
  };
}

export interface SecurityConfiguration {
  authentication: {
    mfa: {
      enabled: boolean;
      methods: ('totp' | 'sms' | 'email' | 'hardware')[];
      required: boolean;
    };
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      maxAge: number; // days
      historySize: number;
    };
    sessionManagement: {
      timeout: number; // minutes
      maxConcurrentSessions: number;
      secureTokens: boolean;
    };
  };
  dataProtection: {
    encryption: {
      atRest: boolean;
      inTransit: boolean;
      algorithm: string;
      keyRotation: number; // days
    };
    anonymization: {
      enabled: boolean;
      methods: string[];
    };
    retention: {
      defaultPeriod: number; // days
      policies: Array<{
        dataType: string;
        period: number;
        action: 'delete' | 'archive' | 'anonymize';
      }>;
    };
  };
  monitoring: {
    logging: {
      level: 'debug' | 'info' | 'warn' | 'error';
      retention: number; // days
      encryption: boolean;
    };
    alerting: {
      enabled: boolean;
      channels: ('email' | 'slack' | 'webhook')[];
      thresholds: Record<string, number>;
    };
    scanning: {
      frequency: 'daily' | 'weekly' | 'monthly';
      types: string[];
      automated: boolean;
    };
  };
}

export interface SecurityAuditLog {
  id: string;
  timestamp: Date;
  event: string;
  category: 'authentication' | 'authorization' | 'data_access' | 'configuration' | 'system';
  severity: 'info' | 'warn' | 'error' | 'critical';
  user?: string;
  ip?: string;
  userAgent?: string;
  resource?: string;
  action: string;
  result: 'success' | 'failure' | 'blocked';
  details: Record<string, any>;
  risk: 'low' | 'medium' | 'high';
}

export interface ThreatIntelligence {
  id: string;
  type: 'ip' | 'domain' | 'hash' | 'pattern' | 'signature';
  value: string;
  category: 'malware' | 'phishing' | 'botnet' | 'spam' | 'exploit' | 'suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  firstSeen: Date;
  lastSeen: Date;
  confidence: number; // 0-100
  tags: string[];
  references: string[];
  isActive: boolean;
}

export interface SecurityDashboard {
  id: string;
  name: string;
  widgets: SecurityWidget[];
  layout: DashboardLayout;
  permissions: DashboardPermissions;
  refreshInterval: number; // seconds
  alerting: {
    enabled: boolean;
    conditions: AlertCondition[];
  };
}

export interface SecurityWidget {
  id: string;
  type: 'metric' | 'chart' | 'alert_list' | 'vulnerability_list' | 'compliance_status' | 'incident_timeline';
  title: string;
  configuration: WidgetConfiguration;
  position: { x: number; y: number; width: number; height: number };
  dataSource: SecurityDataSource;
}

export interface SecurityDataSource {
  type: 'real_time' | 'historical' | 'aggregated';
  endpoint?: string;
  query?: string;
  filters?: Record<string, any>;
  refreshRate?: number; // seconds
}

export interface AlertCondition {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  operator: '>' | '<' | '=' | '>=' | '<=';
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: SecurityAction[];
}

export interface DashboardLayout {
  type: 'grid' | 'flex';
  columns: number;
  rowHeight: number;
  gap: number;
  responsive: boolean;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  admin: string[];
}

export interface WidgetConfiguration {
  metric?: string;
  timeRange?: { start: Date; end: Date };
  groupBy?: string[];
  filters?: Record<string, any>;
  visualization?: {
    type: 'line' | 'bar' | 'pie' | 'gauge' | 'table' | 'heatmap';
    options: Record<string, any>;
  };
  thresholds?: {
    warning: number;
    critical: number;
  };
}

// Hook Types
export interface UseSecurityMonitoringResult {
  vulnerabilities: SecurityVulnerability[];
  incidents: SecurityIncident[];
  metrics: SecurityMetrics | null;
  auditLogs: SecurityAuditLog[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

export interface UseComplianceResult {
  standards: ComplianceStandard[];
  overallScore: number;
  requirements: ComplianceRequirement[];
  createEvidence: (requirementId: string, evidence: Omit<ComplianceEvidence, 'id' | 'createdAt'>) => Promise<void>;
  updateRequirementStatus: (id: string, status: ComplianceRequirement['status']) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface UseSecurityScanResult {
  scans: SecurityScanResult[];
  startScan: (type: SecurityScanResult['scanType'], config?: Record<string, any>) => Promise<string>;
  getScanResult: (id: string) => SecurityScanResult | null;
  loading: boolean;
  error: string | null;
}

// Component Props Types
export interface SecurityDashboardProps {
  dashboardId?: string;
  initialDashboard?: SecurityDashboard;
  editable?: boolean;
  realTime?: boolean;
  onDashboardChange?: (dashboard: SecurityDashboard) => void;
  className?: string;
}

export interface VulnerabilityListProps {
  vulnerabilities: SecurityVulnerability[];
  onVulnerabilityClick?: (vulnerability: SecurityVulnerability) => void;
  onStatusChange?: (id: string, status: SecurityVulnerability['status']) => void;
  filters?: {
    severity?: SecurityVulnerability['severity'][];
    category?: SecurityVulnerability['category'][];
    status?: SecurityVulnerability['status'][];
  };
  maxItems?: number;
  className?: string;
}

export interface ComplianceStatusProps {
  standards: ComplianceStandard[];
  onStandardClick?: (standard: ComplianceStandard) => void;
  onRequirementClick?: (requirement: ComplianceRequirement) => void;
  showDetails?: boolean;
  className?: string;
}

export interface IncidentTimelineProps {
  incidents: SecurityIncident[];
  onIncidentClick?: (incident: SecurityIncident) => void;
  timeRange?: { start: Date; end: Date };
  maxItems?: number;
  className?: string;
}

// API Response Types
export interface SecurityAPIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    total: number;
    page: number;
    limit: number;
    filters: Record<string, any>;
  };
}

export interface CreateSecurityPolicyRequest {
  name: string;
  description?: string;
  category: SecurityPolicy['category'];
  severity: SecurityPolicy['severity'];
  rules: Omit<SecurityRule, 'id'>[];
  compliance?: ComplianceStandard['name'][];
}

export interface UpdateSecurityPolicyRequest {
  name?: string;
  description?: string;
  severity?: SecurityPolicy['severity'];
  rules?: Omit<SecurityRule, 'id'>[];
  isActive?: boolean;
}

export interface SecurityScanRequest {
  type: SecurityScanResult['scanType'];
  targets: string[];
  configuration?: Record<string, any>;
  schedule?: {
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    startTime?: Date;
  };
}

export interface IncidentReportRequest {
  title: string;
  description: string;
  severity: SecurityIncident['severity'];
  category: SecurityIncident['category'];
  affectedSystems?: string[];
  evidence?: Omit<IncidentEvidence, 'id' | 'collectedAt' | 'collectedBy'>[];
}
