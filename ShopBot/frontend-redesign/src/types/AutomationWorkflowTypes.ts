/**
 * Advanced Automation Workflow Types
 * Intelligent workflow automation and orchestration interfaces
 * Part of Phase 3: Market Leadership - Enterprise Tools & Strategic Integration
 */

// Core Workflow Management
export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  status: WorkflowStatus;
  type: WorkflowType;
  category: WorkflowCategory;
  organizationId: string;
  createdBy: string;
  assignedTo?: string[];
  tags: string[];
  
  // Workflow Definition
  definition: WorkflowDefinition;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  
  // Execution & Monitoring
  executions: WorkflowExecution[];
  metrics: WorkflowMetrics;
  settings: WorkflowSettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  nextScheduled?: Date;
}

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived' | 'error';
export type WorkflowType = 'sequential' | 'parallel' | 'conditional' | 'loop' | 'event_driven' | 'scheduled';
export type WorkflowCategory = 
  | 'customer_engagement' 
  | 'data_processing' 
  | 'reporting' 
  | 'notification' 
  | 'integration' 
  | 'approval' 
  | 'maintenance' 
  | 'security';

export interface WorkflowDefinition {
  schema: string;
  variables: WorkflowVariable[];
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  errorHandling: ErrorHandlingConfig;
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface WorkflowVariable {
  name: string;
  type: VariableType;
  defaultValue?: any;
  required: boolean;
  description: string;
  validation?: ValidationRule[];
}

export type VariableType = 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'file';

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface WorkflowInput {
  name: string;
  type: VariableType;
  source: InputSource;
  mapping?: string;
  transformation?: string;
  required: boolean;
}

export type InputSource = 'trigger' | 'previous_step' | 'variable' | 'external' | 'user_input';

export interface WorkflowOutput {
  name: string;
  type: VariableType;
  destination: OutputDestination;
  format?: string;
  condition?: string;
}

export type OutputDestination = 'next_step' | 'variable' | 'external' | 'notification' | 'storage';

export interface ErrorHandlingConfig {
  strategy: ErrorStrategy;
  maxRetries: number;
  retryDelay: number;
  fallbackAction?: string;
  notifyOnError: boolean;
  errorNotificationRecipients: string[];
}

export type ErrorStrategy = 'stop' | 'continue' | 'retry' | 'fallback' | 'escalate';

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: BackoffStrategy;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
}

export type BackoffStrategy = 'fixed' | 'linear' | 'exponential' | 'random';

// Workflow Triggers
export interface WorkflowTrigger {
  id: string;
  name: string;
  type: TriggerType;
  enabled: boolean;
  conditions: TriggerCondition[];
  schedule?: ScheduleConfig;
  event?: EventConfig;
  webhook?: WebhookConfig;
  manual?: ManualConfig;
}

export type TriggerType = 'manual' | 'scheduled' | 'event' | 'webhook' | 'api' | 'file' | 'data_change';

export interface TriggerCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

export type ConditionOperator = 
  | 'equals' | 'not_equals' | 'greater_than' | 'less_than' 
  | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in'
  | 'exists' | 'not_exists' | 'matches_pattern';

export type LogicalOperator = 'and' | 'or' | 'not';

export interface ScheduleConfig {
  type: ScheduleType;
  cron?: string;
  interval?: number;
  timezone: string;
  startDate?: Date;
  endDate?: Date;
  maxExecutions?: number;
}

export type ScheduleType = 'once' | 'recurring' | 'cron' | 'interval';

export interface EventConfig {
  source: EventSource;
  eventType: string;
  filters: EventFilter[];
  debounceMs?: number;
}

export type EventSource = 'system' | 'user' | 'external' | 'integration' | 'api';

export interface EventFilter {
  property: string;
  operator: ConditionOperator;
  value: any;
}

export interface WebhookConfig {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  authentication?: AuthConfig;
  payloadTemplate?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface AuthConfig {
  type: AuthType;
  credentials: Record<string, string>;
}

export type AuthType = 'none' | 'basic' | 'bearer' | 'api_key' | 'oauth2';

export interface ManualConfig {
  requireApproval: boolean;
  approvers: string[];
  approvalTimeout: number;
  allowSelfApproval: boolean;
}

// Workflow Steps
export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: StepType;
  position: StepPosition;
  enabled: boolean;
  
  // Step Configuration
  action: StepAction;
  inputs: StepInput[];
  outputs: StepOutput[];
  conditions: StepCondition[];
  
  // Execution Settings
  timeout: number;
  retryPolicy: RetryPolicy;
  runInParallel: boolean;
  dependencies: string[];
  
  // UI Configuration
  uiConfig?: StepUIConfig;
}

export type StepType = 
  | 'action' | 'condition' | 'loop' | 'parallel' | 'delay' 
  | 'approval' | 'notification' | 'integration' | 'script' | 'human_task';

export interface StepPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StepAction {
  type: ActionType;
  configuration: ActionConfig;
  script?: string;
  integration?: IntegrationConfig;
}

export type ActionType = 
  | 'http_request' | 'database_query' | 'file_operation' | 'email' | 'sms'
  | 'slack_message' | 'teams_message' | 'create_record' | 'update_record'
  | 'delete_record' | 'run_script' | 'call_api' | 'transform_data';

export interface ActionConfig {
  [key: string]: any;
}

export interface IntegrationConfig {
  integrationId: string;
  operation: string;
  parameters: Record<string, any>;
}

export interface StepInput {
  name: string;
  type: VariableType;
  source: string;
  mapping?: string;
  required: boolean;
}

export interface StepOutput {
  name: string;
  type: VariableType;
  destination: string;
  transformation?: string;
}

export interface StepCondition {
  expression: string;
  onTrue?: string;
  onFalse?: string;
}

export interface StepUIConfig {
  icon: string;
  color: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  connectors: StepConnector[];
}

export interface StepConnector {
  id: string;
  type: 'input' | 'output';
  position: 'top' | 'bottom' | 'left' | 'right';
  label?: string;
}

// Workflow Conditions
export interface WorkflowCondition {
  id: string;
  name: string;
  expression: string;
  description: string;
  type: ConditionType;
  variables: string[];
}

export type ConditionType = 'pre_execution' | 'post_execution' | 'step_condition' | 'error_condition';

// Workflow Execution
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  version: string;
  status: ExecutionStatus;
  triggeredBy: ExecutionTrigger;
  
  // Execution Details
  startTime: Date;
  endTime?: Date;
  duration?: number;
  
  // Data & Context
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  variables: Record<string, any>;
  context: ExecutionContext;
  
  // Step Executions
  stepExecutions: StepExecution[];
  
  // Error & Logging
  error?: ExecutionError;
  logs: ExecutionLog[];
  
  // Metadata
  executedBy: string;
  environment: string;
  tags: string[];
}

export type ExecutionStatus = 
  | 'pending' | 'running' | 'paused' | 'completed' 
  | 'failed' | 'cancelled' | 'timeout' | 'skipped';

export interface ExecutionTrigger {
  type: TriggerType;
  source: string;
  data?: Record<string, any>;
  timestamp: Date;
}

export interface ExecutionContext {
  userId?: string;
  organizationId: string;
  environment: string;
  correlationId: string;
  parentExecutionId?: string;
  metadata: Record<string, any>;
}

export interface StepExecution {
  stepId: string;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  error?: ExecutionError;
  retryCount: number;
  logs: ExecutionLog[];
}

export interface ExecutionError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  stepId?: string;
  timestamp: Date;
}

export interface ExecutionLog {
  level: LogLevel;
  message: string;
  timestamp: Date;
  stepId?: string;
  data?: Record<string, any>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Workflow Metrics & Analytics
export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
  
  // Performance Metrics
  performance: PerformanceMetrics;
  
  // Usage Analytics
  usage: UsageAnalytics;
  
  // Error Analytics
  errors: ErrorAnalytics;
  
  // Trend Data
  trends: TrendData[];
}

export interface PerformanceMetrics {
  averageExecutionTime: number;
  medianExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;
  throughput: number;
  concurrentExecutions: number;
}

export interface UsageAnalytics {
  executionsByTrigger: Record<string, number>;
  executionsByUser: Record<string, number>;
  executionsByHour: Record<string, number>;
  executionsByDay: Record<string, number>;
  mostUsedSteps: StepUsage[];
}

export interface StepUsage {
  stepType: StepType;
  count: number;
  averageDuration: number;
  successRate: number;
}

export interface ErrorAnalytics {
  errorsByType: Record<string, number>;
  errorsByStep: Record<string, number>;
  errorTrends: ErrorTrend[];
  commonErrors: CommonError[];
}

export interface ErrorTrend {
  date: Date;
  errorCount: number;
  errorRate: number;
}

export interface CommonError {
  code: string;
  message: string;
  count: number;
  lastOccurrence: Date;
  affectedSteps: string[];
}

export interface TrendData {
  date: Date;
  executions: number;
  successRate: number;
  averageDuration: number;
  errorCount: number;
}

// Workflow Settings & Configuration
export interface WorkflowSettings {
  // Execution Settings
  maxConcurrentExecutions: number;
  executionTimeout: number;
  retryPolicy: RetryPolicy;
  
  // Notification Settings
  notifications: NotificationSettings;
  
  // Security Settings
  security: WorkflowSecuritySettings;
  
  // Monitoring Settings
  monitoring: MonitoringSettings;
  
  // Integration Settings
  integrations: WorkflowIntegrationSettings;
}

export interface NotificationSettings {
  onSuccess: boolean;
  onFailure: boolean;
  onTimeout: boolean;
  recipients: NotificationRecipient[];
  channels: NotificationChannel[];
  templates: NotificationTemplate[];
}

export interface NotificationRecipient {
  type: RecipientType;
  identifier: string;
  conditions?: NotificationCondition[];
}

export type RecipientType = 'user' | 'role' | 'team' | 'email' | 'webhook';

export interface NotificationCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
}

export interface NotificationChannel {
  type: ChannelType;
  enabled: boolean;
  configuration: ChannelConfig;
}

export type ChannelType = 'email' | 'sms' | 'slack' | 'teams' | 'webhook' | 'in_app';

export interface ChannelConfig {
  [key: string]: any;
}

export interface NotificationTemplate {
  event: NotificationEvent;
  subject: string;
  body: string;
  variables: string[];
}

export type NotificationEvent = 'workflow_started' | 'workflow_completed' | 'workflow_failed' | 'step_failed' | 'approval_required';

export interface WorkflowSecuritySettings {
  requireApproval: boolean;
  approvers: string[];
  encryptData: boolean;
  auditExecution: boolean;
  allowedUsers: string[];
  allowedRoles: string[];
  ipWhitelist: string[];
}

export interface MonitoringSettings {
  enableMetrics: boolean;
  enableLogging: boolean;
  logLevel: LogLevel;
  metricsRetention: number;
  logsRetention: number;
  alerting: AlertingConfig;
}

export interface AlertingConfig {
  enabled: boolean;
  rules: AlertRule[];
  channels: AlertChannel[];
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AlertChannel {
  type: ChannelType;
  configuration: ChannelConfig;
  severityFilter: AlertSeverity[];
}

export interface WorkflowIntegrationSettings {
  allowedIntegrations: string[];
  apiRateLimit: number;
  webhookTimeout: number;
  externalCallTimeout: number;
}

// Workflow Templates & Library
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkflowCategory;
  version: string;
  author: string;
  
  // Template Definition
  definition: WorkflowDefinition;
  defaultSettings: WorkflowSettings;
  
  // Customization
  customizable: boolean;
  parameters: TemplateParameter[];
  
  // Metadata
  tags: string[];
  popularity: number;
  rating: number;
  downloads: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateParameter {
  name: string;
  type: VariableType;
  description: string;
  defaultValue?: any;
  required: boolean;
  options?: ParameterOption[];
}

export interface ParameterOption {
  label: string;
  value: any;
  description?: string;
}

// Workflow Builder & Designer
export interface WorkflowDesign {
  workflowId: string;
  canvas: CanvasConfig;
  elements: DesignElement[];
  connections: Connection[];
  layout: LayoutConfig;
}

export interface CanvasConfig {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  grid: GridConfig;
}

export interface GridConfig {
  enabled: boolean;
  size: number;
  color: string;
  snapToGrid: boolean;
}

export interface DesignElement {
  id: string;
  type: ElementType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: ElementProperties;
  style: ElementStyle;
}

export type ElementType = 'step' | 'trigger' | 'condition' | 'connector' | 'group' | 'annotation';

export interface ElementProperties {
  [key: string]: any;
}

export interface ElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePort?: string;
  targetPort?: string;
  type: ConnectionType;
  style: ConnectionStyle;
  conditions?: ConnectionCondition[];
}

export type ConnectionType = 'success' | 'error' | 'conditional' | 'parallel' | 'loop';

export interface ConnectionStyle {
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  animated?: boolean;
}

export interface ConnectionCondition {
  expression: string;
  label?: string;
}

export interface LayoutConfig {
  algorithm: LayoutAlgorithm;
  direction: LayoutDirection;
  spacing: { x: number; y: number };
  alignment: LayoutAlignment;
}

export type LayoutAlgorithm = 'manual' | 'hierarchical' | 'force_directed' | 'circular' | 'tree';
export type LayoutDirection = 'top_to_bottom' | 'bottom_to_top' | 'left_to_right' | 'right_to_left';
export type LayoutAlignment = 'start' | 'center' | 'end' | 'justify';
