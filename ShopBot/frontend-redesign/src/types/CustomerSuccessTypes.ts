/**
 * Customer Success Prediction Types
 * AI-powered customer success forecasting and proactive engagement
 * Part of Phase 3: Market Leadership - Advanced Reporting & Insights
 */

// Core Customer Success Types
export interface CustomerSuccessProfile {
  id: string;
  customerId: string;
  customerName: string;
  email: string;
  segment: CustomerSegment;
  tier: CustomerTier;
  healthScore: HealthScore;
  riskLevel: RiskLevel;
  successProbability: number;
  churnProbability: number;
  expansionProbability: number;
  engagementScore: number;
  satisfactionScore: number;
  adoptionScore: number;
  valueRealizationScore: number;
  createdAt: Date;
  updatedAt: Date;
  lastInteraction: Date;
  nextReviewDate: Date;
}

export type CustomerSegment = 'enterprise' | 'mid-market' | 'smb' | 'startup';
export type CustomerTier = 'platinum' | 'gold' | 'silver' | 'bronze';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface HealthScore {
  overall: number;
  product: number;
  engagement: number;
  support: number;
  financial: number;
  trend: ScoreTrend;
  lastUpdated: Date;
}

export type ScoreTrend = 'improving' | 'stable' | 'declining' | 'critical';

// Prediction Models
export interface SuccessPredictionModel {
  id: string;
  name: string;
  type: ModelType;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  features: PredictionFeature[];
  trainingData: TrainingDataset;
  lastTrained: Date;
  isActive: boolean;
}

export type ModelType = 'classification' | 'regression' | 'ensemble' | 'neural_network';

export interface PredictionFeature {
  name: string;
  type: FeatureType;
  importance: number;
  description: string;
  category: FeatureCategory;
}

export type FeatureType = 'numerical' | 'categorical' | 'boolean' | 'temporal' | 'text';
export type FeatureCategory = 'usage' | 'engagement' | 'support' | 'financial' | 'demographic';

export interface TrainingDataset {
  size: number;
  startDate: Date;
  endDate: Date;
  features: string[];
  target: string;
  splitRatio: number;
  validationAccuracy: number;
}

// Proactive Engagement
export interface EngagementStrategy {
  id: string;
  name: string;
  description: string;
  triggers: EngagementTrigger[];
  actions: EngagementAction[];
  conditions: EngagementCondition[];
  priority: Priority;
  frequency: EngagementFrequency;
  channels: CommunicationChannel[];
  templates: MessageTemplate[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EngagementTrigger {
  id: string;
  type: TriggerType;
  condition: string;
  threshold: number;
  operator: ComparisonOperator;
  timeWindow: TimeWindow;
  isActive: boolean;
}

export type TriggerType = 
  | 'health_score_drop' 
  | 'usage_decline' 
  | 'support_ticket_increase' 
  | 'payment_delay' 
  | 'feature_adoption_low' 
  | 'engagement_drop' 
  | 'satisfaction_decline' 
  | 'renewal_risk';

export type ComparisonOperator = 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between';

export interface TimeWindow {
  value: number;
  unit: TimeUnit;
}

export type TimeUnit = 'hours' | 'days' | 'weeks' | 'months';

export interface EngagementAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  parameters: Record<string, any>;
  delay: number;
  priority: Priority;
  assignee?: string;
  dueDate?: Date;
  isAutomated: boolean;
}

export type ActionType = 
  | 'send_email' 
  | 'schedule_call' 
  | 'create_task' 
  | 'send_notification' 
  | 'trigger_workflow' 
  | 'update_health_score' 
  | 'assign_csm' 
  | 'create_support_ticket';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface EngagementCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
  logicalOperator?: LogicalOperator;
}

export type LogicalOperator = 'and' | 'or' | 'not';

export type EngagementFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'on_trigger';

export type CommunicationChannel = 'email' | 'sms' | 'phone' | 'in_app' | 'slack' | 'teams';

export interface MessageTemplate {
  id: string;
  name: string;
  channel: CommunicationChannel;
  subject?: string;
  content: string;
  variables: TemplateVariable[];
  personalization: PersonalizationRule[];
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  defaultValue?: string;
  required: boolean;
  description: string;
}

export type VariableType = 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';

export interface PersonalizationRule {
  condition: string;
  replacement: string;
  priority: number;
}

// Success Metrics and KPIs
export interface SuccessMetrics {
  id: string;
  customerId: string;
  period: MetricsPeriod;
  metrics: CustomerMetrics;
  benchmarks: BenchmarkData;
  goals: SuccessGoal[];
  achievements: Achievement[];
  recommendations: SuccessRecommendation[];
  createdAt: Date;
}

export interface MetricsPeriod {
  start: Date;
  end: Date;
  type: PeriodType;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface CustomerMetrics {
  usage: UsageMetrics;
  engagement: EngagementMetrics;
  satisfaction: SatisfactionMetrics;
  financial: FinancialMetrics;
  support: SupportMetrics;
}

export interface UsageMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  featuresUsed: number;
  totalFeatures: number;
  adoptionRate: number;
  powerUserActions: number;
  lastLoginDate: Date;
  loginFrequency: number;
}

export interface EngagementMetrics {
  emailOpenRate: number;
  emailClickRate: number;
  webinarAttendance: number;
  communityParticipation: number;
  feedbackSubmissions: number;
  referrals: number;
  socialShares: number;
}

export interface SatisfactionMetrics {
  nps: number;
  csat: number;
  ces: number;
  surveyResponses: number;
  testimonials: number;
  reviews: ReviewData[];
}

export interface ReviewData {
  platform: string;
  rating: number;
  date: Date;
  sentiment: SentimentScore;
}

export interface SentimentScore {
  overall: number;
  positive: number;
  neutral: number;
  negative: number;
}

export interface FinancialMetrics {
  mrr: number;
  arr: number;
  ltv: number;
  expansionRevenue: number;
  paymentHistory: PaymentRecord[];
  invoiceStatus: InvoiceStatus;
}

export interface PaymentRecord {
  date: Date;
  amount: number;
  status: PaymentStatus;
  method: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'failed';
export type InvoiceStatus = 'current' | 'overdue' | 'disputed';

export interface SupportMetrics {
  ticketCount: number;
  averageResolutionTime: number;
  escalationRate: number;
  satisfactionScore: number;
  selfServiceUsage: number;
  knowledgeBaseViews: number;
}

export interface BenchmarkData {
  industry: IndustryBenchmarks;
  segment: SegmentBenchmarks;
  cohort: CohortBenchmarks;
}

export interface IndustryBenchmarks {
  averageHealthScore: number;
  averageChurnRate: number;
  averageExpansionRate: number;
  averageNPS: number;
}

export interface SegmentBenchmarks {
  segment: CustomerSegment;
  averageMetrics: CustomerMetrics;
  topPerformers: TopPerformerData[];
}

export interface TopPerformerData {
  customerId: string;
  metric: string;
  value: number;
  percentile: number;
}

export interface CohortBenchmarks {
  cohortDate: Date;
  size: number;
  averageMetrics: CustomerMetrics;
  retentionRate: number;
  expansionRate: number;
}

export interface SuccessGoal {
  id: string;
  name: string;
  description: string;
  metric: string;
  target: number;
  current: number;
  progress: number;
  deadline: Date;
  status: GoalStatus;
  priority: Priority;
}

export type GoalStatus = 'not_started' | 'in_progress' | 'at_risk' | 'completed' | 'overdue';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  date: Date;
  value: number;
  milestone: boolean;
}

export type AchievementCategory = 'usage' | 'engagement' | 'growth' | 'satisfaction' | 'advocacy';

export interface SuccessRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  impact: ImpactLevel;
  effort: EffortLevel;
  priority: Priority;
  category: RecommendationCategory;
  actions: RecommendedAction[];
  expectedOutcome: string;
  timeline: string;
  resources: string[];
}

export type RecommendationType = 
  | 'feature_adoption' 
  | 'engagement_improvement' 
  | 'risk_mitigation' 
  | 'expansion_opportunity' 
  | 'satisfaction_boost';

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
export type EffortLevel = 'low' | 'medium' | 'high';

export type RecommendationCategory = 
  | 'onboarding' 
  | 'training' 
  | 'support' 
  | 'product' 
  | 'relationship' 
  | 'commercial';

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  owner: string;
  dueDate: Date;
  status: ActionStatus;
  dependencies: string[];
}

export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';

// Automation and Workflows
export interface SuccessWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  isActive: boolean;
  executionCount: number;
  successRate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  id: string;
  type: TriggerType;
  configuration: Record<string, any>;
  isActive: boolean;
}

export interface WorkflowStep {
  id: string;
  order: number;
  type: StepType;
  name: string;
  configuration: Record<string, any>;
  conditions: StepCondition[];
  onSuccess: string[];
  onFailure: string[];
}

export type StepType = 
  | 'send_message' 
  | 'create_task' 
  | 'update_score' 
  | 'wait' 
  | 'condition' 
  | 'api_call' 
  | 'notification';

export interface StepCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

export interface WorkflowCondition {
  id: string;
  expression: string;
  description: string;
}

// Analytics and Reporting
export interface SuccessAnalytics {
  overview: AnalyticsOverview;
  trends: TrendAnalysis[];
  predictions: PredictionResult[];
  cohortAnalysis: CohortAnalysis[];
  segmentAnalysis: SegmentAnalysis[];
  riskAnalysis: RiskAnalysis;
}

export interface AnalyticsOverview {
  totalCustomers: number;
  healthyCustomers: number;
  atRiskCustomers: number;
  averageHealthScore: number;
  churnRate: number;
  expansionRate: number;
  npsScore: number;
  period: MetricsPeriod;
}

export interface TrendAnalysis {
  metric: string;
  period: MetricsPeriod;
  dataPoints: DataPoint[];
  trend: TrendDirection;
  changePercent: number;
  significance: number;
}

export interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';

export interface PredictionResult {
  customerId: string;
  predictionType: PredictionType;
  probability: number;
  confidence: number;
  factors: PredictionFactor[];
  recommendedActions: string[];
  timeline: string;
}

export type PredictionType = 'churn' | 'expansion' | 'renewal' | 'advocacy';

export interface PredictionFactor {
  name: string;
  impact: number;
  direction: 'positive' | 'negative';
  description: string;
}

export interface CohortAnalysis {
  cohortDate: Date;
  size: number;
  retentionRates: RetentionRate[];
  revenueMetrics: CohortRevenue;
  healthProgression: HealthProgression[];
}

export interface RetentionRate {
  period: number;
  rate: number;
  customers: number;
}

export interface CohortRevenue {
  initialMRR: number;
  currentMRR: number;
  expansionRevenue: number;
  churnedRevenue: number;
}

export interface HealthProgression {
  period: number;
  averageHealth: number;
  healthDistribution: HealthDistribution;
}

export interface HealthDistribution {
  healthy: number;
  atRisk: number;
  critical: number;
}

export interface SegmentAnalysis {
  segment: CustomerSegment;
  customerCount: number;
  averageMetrics: CustomerMetrics;
  topChallenges: Challenge[];
  successFactors: SuccessFactor[];
  recommendations: SegmentRecommendation[];
}

export interface Challenge {
  name: string;
  frequency: number;
  impact: ImpactLevel;
  description: string;
}

export interface SuccessFactor {
  name: string;
  correlation: number;
  description: string;
  category: string;
}

export interface SegmentRecommendation {
  title: string;
  description: string;
  expectedImpact: string;
  implementation: string;
}

export interface RiskAnalysis {
  totalAtRisk: number;
  riskDistribution: RiskDistribution;
  topRiskFactors: RiskFactor[];
  preventionStrategies: PreventionStrategy[];
  earlyWarningSignals: WarningSignal[];
}

export interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface RiskFactor {
  name: string;
  frequency: number;
  severity: number;
  description: string;
  mitigation: string;
}

export interface PreventionStrategy {
  name: string;
  description: string;
  effectiveness: number;
  implementation: string;
  resources: string[];
}

export interface WarningSignal {
  name: string;
  description: string;
  threshold: number;
  leadTime: number;
  accuracy: number;
}
