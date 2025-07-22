// Predictive Customer Behavior Engine Types
// Comprehensive TypeScript interfaces for AI-powered customer behavior prediction, churn analysis, and proactive engagement

export interface CustomerBehaviorProfile {
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  lastUpdated: Date;
  behaviorMetrics: BehaviorMetrics;
  predictiveScores: PredictiveScores;
  engagementHistory: EngagementEvent[];
  purchasePatterns: PurchasePattern[];
  riskFactors: RiskFactor[];
  recommendations: ProactiveRecommendation[];
  segments: CustomerSegment[];
}

export interface BehaviorMetrics {
  sessionCount: number;
  averageSessionDuration: number;
  pageViewsPerSession: number;
  bounceRate: number;
  timeOnSite: number;
  clickThroughRate: number;
  emailOpenRate: number;
  emailClickRate: number;
  socialEngagement: number;
  supportTickets: number;
  lastActivityDate: Date;
  activityFrequency: ActivityFrequency;
  devicePreferences: DevicePreference[];
  channelPreferences: ChannelPreference[];
}

export type ActivityFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'irregular' | 'dormant';

export interface DevicePreference {
  deviceType: DeviceType;
  usage: number;
  conversionRate: number;
  averageOrderValue: number;
}

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'smart-tv' | 'other';

export interface ChannelPreference {
  channel: MarketingChannel;
  engagement: number;
  conversionRate: number;
  costPerAcquisition: number;
  lifetimeValue: number;
}

export type MarketingChannel = 
  | 'organic-search' 
  | 'paid-search' 
  | 'social-media' 
  | 'email' 
  | 'direct' 
  | 'referral' 
  | 'affiliate' 
  | 'display';

export interface PredictiveScores {
  churnRisk: ChurnRiskScore;
  lifetimeValue: LifetimeValuePrediction;
  nextPurchase: NextPurchasePrediction;
  upsellPotential: UpsellPotential;
  crossSellOpportunities: CrossSellOpportunity[];
  engagementProbability: EngagementProbability;
  satisfactionScore: SatisfactionScore;
  loyaltyIndex: LoyaltyIndex;
}

export interface ChurnRiskScore {
  score: number; // 0-100, higher = more likely to churn
  confidence: number; // 0-1, confidence in prediction
  timeframe: ChurnTimeframe;
  primaryFactors: ChurnFactor[];
  interventionRecommendations: InterventionStrategy[];
  lastCalculated: Date;
}

export type ChurnTimeframe = '7-days' | '30-days' | '90-days' | '180-days' | '1-year';

export interface ChurnFactor {
  factor: ChurnFactorType;
  impact: number; // -1 to 1, negative = increases churn risk
  confidence: number;
  description: string;
}

export type ChurnFactorType = 
  | 'declining-engagement' 
  | 'support-issues' 
  | 'pricing-sensitivity' 
  | 'competitor-activity' 
  | 'seasonal-patterns' 
  | 'product-satisfaction' 
  | 'delivery-issues' 
  | 'payment-problems';

export interface InterventionStrategy {
  strategy: InterventionType;
  priority: Priority;
  estimatedImpact: number; // 0-1, reduction in churn probability
  cost: number;
  effort: EffortLevel;
  timeline: string;
  description: string;
  successRate: number;
}

export type InterventionType = 
  | 'personalized-discount' 
  | 'loyalty-program' 
  | 'customer-service-outreach' 
  | 'product-recommendation' 
  | 'content-personalization' 
  | 'win-back-campaign' 
  | 'feedback-survey' 
  | 'exclusive-access';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type EffortLevel = 'low' | 'medium' | 'high';

export interface LifetimeValuePrediction {
  predictedValue: number;
  confidence: number;
  timeframe: ValueTimeframe;
  currentValue: number;
  growthPotential: number;
  factors: ValueFactor[];
  scenarios: ValueScenario[];
}

export type ValueTimeframe = '6-months' | '1-year' | '2-years' | '5-years' | 'lifetime';

export interface ValueFactor {
  factor: ValueFactorType;
  impact: number;
  weight: number;
  description: string;
}

export type ValueFactorType = 
  | 'purchase-frequency' 
  | 'average-order-value' 
  | 'product-affinity' 
  | 'brand-loyalty' 
  | 'referral-activity' 
  | 'engagement-level' 
  | 'support-satisfaction';

export interface ValueScenario {
  scenario: ScenarioType;
  probability: number;
  predictedValue: number;
  keyAssumptions: string[];
}

export type ScenarioType = 'conservative' | 'realistic' | 'optimistic';

export interface NextPurchasePrediction {
  probability: number;
  timeframe: PurchaseTimeframe;
  confidence: number;
  predictedAmount: number;
  predictedCategories: ProductCategory[];
  triggers: PurchaseTrigger[];
  optimalTiming: OptimalTiming;
}

export type PurchaseTimeframe = '1-week' | '2-weeks' | '1-month' | '3-months' | '6-months';

export interface ProductCategory {
  category: string;
  probability: number;
  averageValue: number;
  seasonality: SeasonalityPattern;
}

export interface SeasonalityPattern {
  pattern: SeasonalityType;
  peakMonths: number[];
  multiplier: number;
}

export type SeasonalityType = 'none' | 'seasonal' | 'holiday' | 'event-driven' | 'cyclical';

export interface PurchaseTrigger {
  trigger: TriggerType;
  effectiveness: number;
  optimalTiming: string;
  personalizedMessage: string;
}

export type TriggerType = 
  | 'price-drop' 
  | 'inventory-alert' 
  | 'personalized-recommendation' 
  | 'seasonal-promotion' 
  | 'milestone-celebration' 
  | 'abandoned-cart' 
  | 'restock-notification';

export interface OptimalTiming {
  dayOfWeek: number; // 0-6, Sunday = 0
  hourOfDay: number; // 0-23
  timezone: string;
  confidence: number;
  factors: TimingFactor[];
}

export interface TimingFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface UpsellPotential {
  score: number; // 0-100
  confidence: number;
  opportunities: UpsellOpportunity[];
  optimalProducts: ProductRecommendation[];
  estimatedRevenue: number;
}

export interface UpsellOpportunity {
  productId: string;
  productName: string;
  category: string;
  probability: number;
  revenueIncrease: number;
  reasoning: string;
  timing: string;
}

export interface CrossSellOpportunity {
  productId: string;
  productName: string;
  category: string;
  probability: number;
  bundleValue: number;
  complementaryProducts: string[];
  reasoning: string;
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  category: string;
  price: number;
  probability: number;
  reasoning: string;
  personalizedMessage: string;
}

export interface EngagementProbability {
  email: number;
  sms: number;
  push: number;
  social: number;
  chat: number;
  optimalChannel: MarketingChannel;
  optimalFrequency: EngagementFrequency;
}

export type EngagementFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';

export interface SatisfactionScore {
  score: number; // 0-100
  confidence: number;
  factors: SatisfactionFactor[];
  trends: SatisfactionTrend[];
  benchmarks: SatisfactionBenchmark[];
}

export interface SatisfactionFactor {
  factor: SatisfactionFactorType;
  score: number;
  weight: number;
  trend: TrendDirection;
}

export type SatisfactionFactorType = 
  | 'product-quality' 
  | 'customer-service' 
  | 'delivery-speed' 
  | 'pricing' 
  | 'user-experience' 
  | 'brand-trust';

export interface SatisfactionTrend {
  period: string;
  score: number;
  change: number;
  factors: string[];
}

export interface SatisfactionBenchmark {
  segment: string;
  averageScore: number;
  percentile: number;
}

export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

export interface LoyaltyIndex {
  score: number; // 0-100
  tier: LoyaltyTier;
  factors: LoyaltyFactor[];
  progression: LoyaltyProgression;
  rewards: LoyaltyReward[];
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LoyaltyFactor {
  factor: LoyaltyFactorType;
  score: number;
  weight: number;
  description: string;
}

export type LoyaltyFactorType = 
  | 'purchase-consistency' 
  | 'brand-advocacy' 
  | 'referral-activity' 
  | 'engagement-depth' 
  | 'feedback-participation' 
  | 'premium-adoption';

export interface LoyaltyProgression {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier;
  progressPercentage: number;
  requirementsToNext: LoyaltyRequirement[];
  estimatedTimeToNext: string;
}

export interface LoyaltyRequirement {
  requirement: string;
  current: number;
  target: number;
  progress: number;
}

export interface LoyaltyReward {
  rewardId: string;
  title: string;
  description: string;
  value: number;
  eligibility: boolean;
  expirationDate?: Date;
}

export interface EngagementEvent {
  eventId: string;
  timestamp: Date;
  eventType: EngagementEventType;
  channel: MarketingChannel;
  details: EngagementDetails;
  outcome: EngagementOutcome;
  value: number;
}

export type EngagementEventType = 
  | 'email-open' 
  | 'email-click' 
  | 'website-visit' 
  | 'product-view' 
  | 'cart-addition' 
  | 'purchase' 
  | 'support-contact' 
  | 'review-submission' 
  | 'referral-made';

export interface EngagementDetails {
  subject?: string;
  content?: string;
  duration?: number;
  pages?: string[];
  products?: string[];
  campaign?: string;
}

export type EngagementOutcome = 'positive' | 'neutral' | 'negative' | 'conversion';

export interface PurchasePattern {
  patternId: string;
  patternType: PurchasePatternType;
  frequency: PatternFrequency;
  averageValue: number;
  categories: string[];
  seasonality: SeasonalityPattern;
  confidence: number;
  lastOccurrence: Date;
  nextPredicted: Date;
}

export type PurchasePatternType = 
  | 'regular-replenishment' 
  | 'seasonal-buying' 
  | 'impulse-purchasing' 
  | 'research-driven' 
  | 'promotion-responsive' 
  | 'brand-loyal' 
  | 'price-sensitive';

export interface PatternFrequency {
  interval: number;
  unit: TimeUnit;
  variance: number;
}

export type TimeUnit = 'days' | 'weeks' | 'months' | 'years';

export interface RiskFactor {
  factorId: string;
  factorType: RiskFactorType;
  severity: RiskSeverity;
  impact: number;
  probability: number;
  description: string;
  mitigationStrategies: MitigationStrategy[];
  lastAssessed: Date;
}

export type RiskFactorType = 
  | 'churn-risk' 
  | 'payment-risk' 
  | 'fraud-risk' 
  | 'satisfaction-decline' 
  | 'engagement-drop' 
  | 'competitor-threat';

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface MitigationStrategy {
  strategyId: string;
  name: string;
  description: string;
  effectiveness: number;
  cost: number;
  timeline: string;
  requirements: string[];
}

export interface ProactiveRecommendation {
  recommendationId: string;
  type: RecommendationType;
  priority: Priority;
  title: string;
  description: string;
  expectedImpact: ExpectedImpact;
  implementation: ImplementationPlan;
  success: SuccessMetrics;
  createdAt: Date;
  expiresAt?: Date;
}

export type RecommendationType = 
  | 'retention-campaign' 
  | 'upsell-opportunity' 
  | 'cross-sell-suggestion' 
  | 'engagement-boost' 
  | 'satisfaction-improvement' 
  | 'loyalty-enhancement' 
  | 'risk-mitigation';

export interface ExpectedImpact {
  revenueIncrease: number;
  churnReduction: number;
  engagementImprovement: number;
  satisfactionIncrease: number;
  confidence: number;
}

export interface ImplementationPlan {
  steps: ImplementationStep[];
  timeline: string;
  resources: ResourceRequirement[];
  dependencies: string[];
}

export interface ImplementationStep {
  stepId: string;
  name: string;
  description: string;
  duration: string;
  assignee?: string;
  status: StepStatus;
}

export type StepStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

export interface ResourceRequirement {
  resource: ResourceType;
  quantity: number;
  cost: number;
  availability: boolean;
}

export type ResourceType = 'budget' | 'personnel' | 'technology' | 'content' | 'data';

export interface SuccessMetrics {
  primaryMetric: string;
  targetValue: number;
  currentValue: number;
  measurementPeriod: string;
  benchmarks: Benchmark[];
}

export interface Benchmark {
  name: string;
  value: number;
  source: string;
}

export interface CustomerSegment {
  segmentId: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  size: number;
  characteristics: SegmentCharacteristics;
  performance: SegmentPerformance;
}

export interface SegmentCriteria {
  rules: SegmentRule[];
  logic: SegmentLogic;
}

export interface SegmentRule {
  field: string;
  operator: SegmentOperator;
  value: any;
  weight: number;
}

export type SegmentOperator = 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'in-range';
export type SegmentLogic = 'and' | 'or';

export interface SegmentCharacteristics {
  averageAge: number;
  genderDistribution: GenderDistribution;
  locationDistribution: LocationDistribution;
  behaviorTraits: BehaviorTrait[];
  preferences: SegmentPreferences;
}

export interface GenderDistribution {
  male: number;
  female: number;
  other: number;
  unknown: number;
}

export interface LocationDistribution {
  countries: CountryDistribution[];
  regions: RegionDistribution[];
  urbanRural: UrbanRuralDistribution;
}

export interface CountryDistribution {
  country: string;
  percentage: number;
  count: number;
}

export interface RegionDistribution {
  region: string;
  percentage: number;
  count: number;
}

export interface UrbanRuralDistribution {
  urban: number;
  suburban: number;
  rural: number;
}

export interface BehaviorTrait {
  trait: string;
  prevalence: number;
  impact: number;
}

export interface SegmentPreferences {
  channels: ChannelPreference[];
  content: ContentPreference[];
  timing: TimingPreference[];
  products: ProductPreference[];
}

export interface ContentPreference {
  contentType: ContentType;
  engagement: number;
  effectiveness: number;
}

export type ContentType = 
  | 'educational' 
  | 'promotional' 
  | 'entertainment' 
  | 'user-generated' 
  | 'testimonials' 
  | 'how-to' 
  | 'news';

export interface TimingPreference {
  dayOfWeek: number;
  hourOfDay: number;
  timezone: string;
  effectiveness: number;
}

export interface ProductPreference {
  category: string;
  affinity: number;
  frequency: number;
  averageValue: number;
}

export interface SegmentPerformance {
  conversionRate: number;
  averageOrderValue: number;
  lifetimeValue: number;
  churnRate: number;
  engagementRate: number;
  satisfactionScore: number;
  growthRate: number;
}

// Service Interfaces
export interface PredictiveAnalyticsService {
  // Customer Analysis
  analyzeCustomerBehavior(customerId: string): Promise<CustomerBehaviorProfile>;
  updateBehaviorProfile(customerId: string, events: EngagementEvent[]): Promise<boolean>;
  getBehaviorInsights(customerId: string): Promise<BehaviorInsight[]>;
  
  // Predictive Scoring
  calculateChurnRisk(customerId: string): Promise<ChurnRiskScore>;
  predictLifetimeValue(customerId: string): Promise<LifetimeValuePrediction>;
  predictNextPurchase(customerId: string): Promise<NextPurchasePrediction>;
  
  // Recommendations
  generateProactiveRecommendations(customerId: string): Promise<ProactiveRecommendation[]>;
  getInterventionStrategies(customerId: string): Promise<InterventionStrategy[]>;
  optimizeEngagementTiming(customerId: string): Promise<OptimalTiming>;
  
  // Segmentation
  segmentCustomers(criteria: SegmentCriteria): Promise<CustomerSegment>;
  getCustomerSegments(customerId: string): Promise<CustomerSegment[]>;
  analyzeSegmentPerformance(segmentId: string): Promise<SegmentPerformance>;
  
  // Analytics and Reporting
  generateBehaviorReport(parameters: ReportParameters): Promise<BehaviorReport>;
  getModelPerformance(): Promise<ModelPerformance>;
  validatePredictions(timeframe: string): Promise<ValidationResults>;
}

export interface BehaviorInsight {
  insight: string;
  confidence: number;
  impact: number;
  actionable: boolean;
  recommendations: string[];
}

export interface ReportParameters {
  timeframe: TimeRange;
  segments?: string[];
  metrics?: string[];
  filters?: Record<string, any>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface BehaviorReport {
  reportId: string;
  title: string;
  generatedAt: Date;
  parameters: ReportParameters;
  insights: BehaviorInsight[];
  metrics: ReportMetric[];
  recommendations: string[];
}

export interface ReportMetric {
  name: string;
  value: number;
  change: number;
  trend: TrendDirection;
  benchmark?: number;
}

export interface ModelPerformance {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: Date;
  dataQuality: number;
  predictions: PredictionMetrics;
}

export interface PredictionMetrics {
  churnPrediction: ModelMetrics;
  lifetimeValue: ModelMetrics;
  nextPurchase: ModelMetrics;
  engagement: ModelMetrics;
}

export interface ModelMetrics {
  accuracy: number;
  meanAbsoluteError: number;
  rootMeanSquareError: number;
  confidenceInterval: number;
}

export interface ValidationResults {
  overallAccuracy: number;
  predictionBreakdown: PredictionValidation[];
  improvements: ModelImprovement[];
  recommendations: string[];
}

export interface PredictionValidation {
  predictionType: string;
  accuracy: number;
  falsePositives: number;
  falseNegatives: number;
  confidence: number;
}

export interface ModelImprovement {
  area: string;
  currentPerformance: number;
  targetPerformance: number;
  recommendations: string[];
  estimatedImpact: number;
}
