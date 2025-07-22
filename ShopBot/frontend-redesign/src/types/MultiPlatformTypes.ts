// Multi-platform Integration Types
// Comprehensive TypeScript interfaces for cross-platform integration, API management, and unified customer profiles

export interface PlatformConnection {
  id: string;
  name: string;
  type: PlatformType;
  status: ConnectionStatus;
  apiEndpoint: string;
  apiKey: string;
  webhookUrl?: string;
  lastSync: Date;
  syncFrequency: SyncFrequency;
  configuration: PlatformConfiguration;
  metrics: ConnectionMetrics;
  features: PlatformFeature[];
}

export type PlatformType = 
  | 'shopify' 
  | 'woocommerce' 
  | 'magento' 
  | 'bigcommerce' 
  | 'squarespace' 
  | 'wordpress' 
  | 'custom';

export type ConnectionStatus = 
  | 'connected' 
  | 'disconnected' 
  | 'syncing' 
  | 'error' 
  | 'pending' 
  | 'maintenance';

export type SyncFrequency = 
  | 'real-time' 
  | 'every-5-minutes' 
  | 'hourly' 
  | 'daily' 
  | 'weekly' 
  | 'manual';

export interface PlatformConfiguration {
  autoSync: boolean;
  syncProducts: boolean;
  syncOrders: boolean;
  syncCustomers: boolean;
  syncInventory: boolean;
  webhooksEnabled: boolean;
  rateLimitPerMinute: number;
  timeoutSeconds: number;
  retryAttempts: number;
  customFields: Record<string, any>;
}

export interface ConnectionMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastErrorMessage?: string;
  uptime: number;
  dataTransferred: number;
  rateLimitHits: number;
}

export interface PlatformFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiredPermissions: string[];
  configuration?: Record<string, any>;
}

// Unified Customer Profile
export interface UnifiedCustomerProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateCreated: Date;
  lastUpdated: Date;
  platforms: CustomerPlatformData[];
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lifetimeValue: number;
  segments: CustomerSegment[];
  preferences: CustomerPreferences;
  interactions: CustomerInteraction[];
}

export interface CustomerPlatformData {
  platformId: string;
  platformType: PlatformType;
  customerId: string;
  orders: PlatformOrder[];
  lastOrderDate?: Date;
  totalSpent: number;
  orderCount: number;
  status: CustomerStatus;
}

export type CustomerStatus = 
  | 'active' 
  | 'inactive' 
  | 'vip' 
  | 'at-risk' 
  | 'churned' 
  | 'new';

export interface PlatformOrder {
  id: string;
  platformOrderId: string;
  date: Date;
  total: number;
  currency: string;
  status: OrderStatus;
  items: OrderItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
}

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  sku?: string;
  variant?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CustomerSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  color: string;
  priority: number;
}

export interface SegmentCriteria {
  minOrderValue?: number;
  maxOrderValue?: number;
  minOrderCount?: number;
  maxOrderCount?: number;
  daysSinceLastOrder?: number;
  platforms?: PlatformType[];
  tags?: string[];
}

export interface CustomerPreferences {
  communicationChannel: CommunicationChannel;
  frequency: NotificationFrequency;
  categories: string[];
  priceRange: PriceRange;
  brands: string[];
  timezone: string;
  language: string;
}

export type CommunicationChannel = 
  | 'email' 
  | 'sms' 
  | 'push' 
  | 'chat' 
  | 'none';

export type NotificationFrequency = 
  | 'immediate' 
  | 'daily' 
  | 'weekly' 
  | 'monthly' 
  | 'never';

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface CustomerInteraction {
  id: string;
  type: InteractionType;
  date: Date;
  platform: PlatformType;
  details: string;
  outcome?: InteractionOutcome;
  satisfaction?: number;
}

export type InteractionType = 
  | 'chat' 
  | 'email' 
  | 'phone' 
  | 'support-ticket' 
  | 'product-view' 
  | 'cart-abandonment' 
  | 'purchase';

export type InteractionOutcome = 
  | 'resolved' 
  | 'escalated' 
  | 'pending' 
  | 'converted' 
  | 'abandoned';

// API Integration
export interface APIIntegration {
  id: string;
  name: string;
  endpoint: string;
  method: HTTPMethod;
  headers: Record<string, string>;
  authentication: AuthenticationConfig;
  rateLimit: RateLimitConfig;
  timeout: number;
  retryConfig: RetryConfig;
  validation: ValidationConfig;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface AuthenticationConfig {
  type: AuthenticationType;
  credentials: Record<string, string>;
  tokenRefreshUrl?: string;
  expirationTime?: number;
}

export type AuthenticationType = 
  | 'api-key' 
  | 'oauth2' 
  | 'basic' 
  | 'bearer' 
  | 'custom';

export interface RateLimitConfig {
  requestsPerMinute: number;
  burstLimit: number;
  backoffStrategy: BackoffStrategy;
}

export type BackoffStrategy = 
  | 'linear' 
  | 'exponential' 
  | 'fixed' 
  | 'none';

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export interface ValidationConfig {
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
  customValidators?: string[];
}

// Dashboard and Widgets
export interface MultiPlatformDashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  configuration: WidgetConfiguration;
  data: any;
  lastUpdated: Date;
  refreshInterval: number;
}

export type WidgetType = 
  | 'platform-status' 
  | 'sync-progress' 
  | 'customer-overview' 
  | 'order-summary' 
  | 'performance-metrics' 
  | 'error-log' 
  | 'api-usage';

export interface WidgetPosition {
  x: number;
  y: number;
  row: number;
  column: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface WidgetConfiguration {
  platforms?: string[];
  timeRange?: TimeRange;
  metrics?: string[];
  filters?: Record<string, any>;
  displayOptions?: DisplayOptions;
}

export interface TimeRange {
  start: Date;
  end: Date;
  preset?: TimePreset;
}

export type TimePreset = 
  | 'last-hour' 
  | 'last-24-hours' 
  | 'last-7-days' 
  | 'last-30-days' 
  | 'last-90-days' 
  | 'custom';

export interface DisplayOptions {
  showLegend: boolean;
  showGrid: boolean;
  colorScheme: string;
  chartType?: ChartType;
  aggregation?: AggregationType;
}

export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'pie' 
  | 'donut' 
  | 'area' 
  | 'scatter';

export type AggregationType = 
  | 'sum' 
  | 'average' 
  | 'count' 
  | 'min' 
  | 'max' 
  | 'median';

// Service Interfaces
export interface MultiPlatformService {
  // Platform Management
  connectPlatform(config: PlatformConnection): Promise<boolean>;
  disconnectPlatform(platformId: string): Promise<boolean>;
  getPlatforms(): PlatformConnection[];
  getPlatform(platformId: string): PlatformConnection | null;
  updatePlatformConfig(platformId: string, config: Partial<PlatformConfiguration>): Promise<boolean>;
  
  // Data Synchronization
  syncPlatform(platformId: string): Promise<SyncResult>;
  syncAllPlatforms(): Promise<SyncResult[]>;
  getLastSyncStatus(platformId: string): SyncStatus;
  
  // Customer Management
  getUnifiedCustomerProfile(customerId: string): Promise<UnifiedCustomerProfile | null>;
  searchCustomers(query: CustomerSearchQuery): Promise<UnifiedCustomerProfile[]>;
  updateCustomerProfile(customerId: string, updates: Partial<UnifiedCustomerProfile>): Promise<boolean>;
  
  // API Integration
  executeAPICall(integrationId: string, payload?: any): Promise<APIResponse>;
  validateAPIIntegration(integration: APIIntegration): Promise<ValidationResult>;
  
  // Analytics and Reporting
  getPlatformMetrics(platformId: string, timeRange: TimeRange): Promise<PlatformMetrics>;
  getCustomerInsights(customerId: string): Promise<CustomerInsights>;
  generateReport(type: ReportType, parameters: ReportParameters): Promise<Report>;
}

export interface SyncResult {
  platformId: string;
  success: boolean;
  recordsProcessed: number;
  errors: SyncError[];
  duration: number;
  timestamp: Date;
}

export interface SyncError {
  type: ErrorType;
  message: string;
  recordId?: string;
  details?: Record<string, any>;
}

export type ErrorType = 
  | 'authentication' 
  | 'rate-limit' 
  | 'validation' 
  | 'network' 
  | 'server' 
  | 'data-format';

export interface SyncStatus {
  isRunning: boolean;
  progress: number;
  startTime?: Date;
  estimatedCompletion?: Date;
  currentOperation?: string;
}

export interface CustomerSearchQuery {
  email?: string;
  name?: string;
  platform?: PlatformType;
  segment?: string;
  orderValueMin?: number;
  orderValueMax?: number;
  lastOrderDays?: number;
  limit?: number;
  offset?: number;
}

export interface APIResponse {
  success: boolean;
  data: any;
  statusCode: number;
  headers: Record<string, string>;
  responseTime: number;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface PlatformMetrics {
  platformId: string;
  timeRange: TimeRange;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  customerCount: number;
  conversionRate: number;
  apiCalls: number;
  errorRate: number;
  responseTime: number;
}

export interface CustomerInsights {
  customerId: string;
  riskScore: number;
  lifetimeValuePrediction: number;
  nextPurchaseProbability: number;
  recommendedActions: RecommendedAction[];
  behaviorPatterns: BehaviorPattern[];
  segmentChanges: SegmentChange[];
}

export interface RecommendedAction {
  type: ActionType;
  priority: Priority;
  description: string;
  expectedImpact: string;
  effort: EffortLevel;
}

export type ActionType = 
  | 'email-campaign' 
  | 'discount-offer' 
  | 'product-recommendation' 
  | 'support-outreach' 
  | 'loyalty-program';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type EffortLevel = 'low' | 'medium' | 'high';

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  confidence: number;
  trend: TrendDirection;
}

export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

export interface SegmentChange {
  fromSegment: string;
  toSegment: string;
  date: Date;
  reason: string;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  generatedAt: Date;
  parameters: ReportParameters;
  data: any;
  summary: ReportSummary;
  exportFormats: ExportFormat[];
}

export type ReportType = 
  | 'platform-performance' 
  | 'customer-analysis' 
  | 'revenue-breakdown' 
  | 'sync-status' 
  | 'api-usage' 
  | 'custom';

export interface ReportParameters {
  timeRange: TimeRange;
  platforms?: string[];
  metrics?: string[];
  groupBy?: string;
  filters?: Record<string, any>;
}

export interface ReportSummary {
  totalRecords: number;
  keyInsights: string[];
  recommendations: string[];
  trends: TrendSummary[];
}

export interface TrendSummary {
  metric: string;
  change: number;
  direction: TrendDirection;
  significance: string;
}

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json';
