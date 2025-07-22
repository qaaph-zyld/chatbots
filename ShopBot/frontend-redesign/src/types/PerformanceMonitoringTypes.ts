/**
 * Real-time Performance Monitoring Types
 * Comprehensive type definitions for performance tracking, regression detection, and optimization
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: 'ms' | 'score' | 'bytes' | 'percentage' | 'count';
  timestamp: Date;
  url: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  connectionType: '4g' | '3g' | 'wifi' | 'ethernet';
  userAgent: string;
  sessionId: string;
  userId?: string;
}

export interface CoreWebVitalsMetrics {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift (score)
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
  tbt: number; // Total Blocking Time (ms)
  si: number; // Speed Index (score)
  timestamp: Date;
  url: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  viewport: { width: number; height: number };
  networkCondition: string;
}

export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number; poor: number };
  fid: { good: number; needsImprovement: number; poor: number };
  cls: { good: number; needsImprovement: number; poor: number };
  fcp: { good: number; needsImprovement: number; poor: number };
  ttfb: { good: number; needsImprovement: number; poor: number };
  tbt: { good: number; needsImprovement: number; poor: number };
  si: { good: number; needsImprovement: number; poor: number };
}

export interface PerformanceRegression {
  id: string;
  metric: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
  currentValue: number;
  baselineValue: number;
  changePercent: number;
  threshold: number;
  detectedAt: Date;
  url: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  affectedUsers: number;
  potentialCauses: string[];
  recommendations: PerformanceRecommendation[];
  status: 'detected' | 'investigating' | 'fixing' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolvedAt?: Date;
  resolution?: string;
}

export interface PerformanceRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: 'images' | 'javascript' | 'css' | 'fonts' | 'network' | 'rendering' | 'caching';
  implementation: {
    steps: string[];
    codeExample?: string;
    resources: string[];
  };
  estimatedImprovement: {
    metric: string;
    value: number;
    unit: string;
  };
  priority: number;
  isImplemented: boolean;
  implementedAt?: Date;
}

export interface PerformanceBudget {
  id: string;
  name: string;
  description: string;
  metrics: {
    [key: string]: {
      budget: number;
      unit: string;
      tolerance: number; // percentage
    };
  };
  pages: string[];
  deviceTypes: ('desktop' | 'mobile' | 'tablet')[];
  isActive: boolean;
  violations: PerformanceBudgetViolation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceBudgetViolation {
  id: string;
  budgetId: string;
  metric: string;
  budgetValue: number;
  actualValue: number;
  overagePercent: number;
  url: string;
  deviceType: string;
  detectedAt: Date;
  severity: 'warning' | 'error';
  isResolved: boolean;
  resolvedAt?: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'regression' | 'budget_violation' | 'threshold_breach' | 'anomaly';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  url: string;
  deviceType: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  notificationChannels: ('email' | 'slack' | 'webhook' | 'dashboard')[];
  recipients: string[];
}

export interface PerformanceReport {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    [key: string]: {
      current: number;
      previous: number;
      change: number;
      trend: 'improving' | 'degrading' | 'stable';
    };
  };
  summary: {
    overallScore: number;
    totalPages: number;
    totalSessions: number;
    regressions: number;
    improvements: number;
    budgetViolations: number;
  };
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
  generatedAt: Date;
  format: 'json' | 'pdf' | 'html';
}

export interface PerformanceInsight {
  id: string;
  type: 'trend' | 'correlation' | 'anomaly' | 'opportunity';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  data: {
    metric: string;
    value: number;
    change: number;
    timeframe: string;
    context?: Record<string, any>;
  };
  visualizations?: {
    type: 'chart' | 'heatmap' | 'comparison';
    config: Record<string, any>;
  }[];
  actions: InsightAction[];
}

export interface InsightAction {
  id: string;
  label: string;
  type: 'investigate' | 'optimize' | 'monitor' | 'alert';
  payload: Record<string, any>;
  priority: number;
}

export interface RealTimePerformanceData {
  timestamp: Date;
  activeUsers: number;
  averageLoadTime: number;
  errorRate: number;
  throughput: number;
  coreWebVitals: {
    lcp: { p75: number; p90: number; p95: number };
    fid: { p75: number; p90: number; p95: number };
    cls: { p75: number; p90: number; p95: number };
  };
  topSlowPages: Array<{
    url: string;
    loadTime: number;
    sessions: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  networkBreakdown: {
    '4g': number;
    '3g': number;
    wifi: number;
    ethernet: number;
  };
}

export interface PerformanceMonitoringConfig {
  sampling: {
    rate: number; // 0-1
    strategy: 'random' | 'user_based' | 'session_based';
  };
  thresholds: PerformanceThresholds;
  budgets: PerformanceBudget[];
  alerts: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    recipients: string[];
    throttling: {
      enabled: boolean;
      windowMs: number;
      maxAlerts: number;
    };
  };
  regression: {
    enabled: boolean;
    lookbackDays: number;
    sensitivityThreshold: number; // percentage
    minSampleSize: number;
  };
  reporting: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    includeRecommendations: boolean;
  };
  storage: {
    retentionDays: number;
    aggregationIntervals: ('1m' | '5m' | '1h' | '1d')[];
  };
}

export interface PerformanceOptimization {
  id: string;
  name: string;
  description: string;
  category: 'critical_rendering_path' | 'resource_optimization' | 'caching' | 'code_splitting' | 'lazy_loading';
  implementation: {
    type: 'automatic' | 'manual' | 'configuration';
    steps: OptimizationStep[];
    rollbackSteps?: OptimizationStep[];
  };
  impact: {
    estimatedImprovement: Record<string, number>;
    affectedMetrics: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  prerequisites: string[];
  testing: {
    required: boolean;
    testCases: string[];
    rolloutStrategy: 'immediate' | 'gradual' | 'feature_flag';
  };
  status: 'planned' | 'in_progress' | 'testing' | 'deployed' | 'rolled_back';
  createdAt: Date;
  implementedAt?: Date;
  results?: OptimizationResults;
}

export interface OptimizationStep {
  id: string;
  description: string;
  type: 'code_change' | 'configuration' | 'infrastructure' | 'process';
  details: Record<string, any>;
  estimatedDuration: number; // minutes
  dependencies: string[];
}

export interface OptimizationResults {
  beforeMetrics: Record<string, number>;
  afterMetrics: Record<string, number>;
  improvements: Record<string, { absolute: number; percentage: number }>;
  testDuration: number; // days
  sampleSize: number;
  confidence: number;
  rolloutPercentage: number;
  unexpectedEffects: string[];
}

export interface PerformanceMonitoringDashboard {
  id: string;
  name: string;
  widgets: PerformanceWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  settings: DashboardSettings;
  permissions: DashboardPermissions;
}

export interface PerformanceWidget {
  id: string;
  type: 'metric' | 'chart' | 'alert_list' | 'regression_list' | 'budget_status' | 'recommendation_list';
  title: string;
  configuration: WidgetConfiguration;
  position: { x: number; y: number; width: number; height: number };
  refreshInterval: number; // seconds
  dataSource: PerformanceDataSource;
}

export interface WidgetConfiguration {
  metric?: string;
  timeRange?: { start: Date; end: Date };
  groupBy?: string[];
  filters?: Record<string, any>;
  visualization?: {
    type: 'line' | 'bar' | 'gauge' | 'number' | 'trend';
    options: Record<string, any>;
  };
  thresholds?: {
    good: number;
    warning: number;
    critical: number;
  };
}

export interface PerformanceDataSource {
  type: 'real_time' | 'historical' | 'aggregated';
  endpoint?: string;
  query?: string;
  cacheSettings?: {
    enabled: boolean;
    ttl: number; // seconds
  };
}

export interface DashboardLayout {
  type: 'grid' | 'flex';
  columns: number;
  rowHeight: number;
  gap: number;
  responsive: boolean;
}

export interface DashboardFilter {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date_range' | 'text';
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
  affectedWidgets: string[];
}

export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  theme: 'light' | 'dark';
  density: 'compact' | 'comfortable';
  showLegends: boolean;
  enableExport: boolean;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  admin: string[];
}

// Hook Types
export interface UsePerformanceMonitoringResult {
  metrics: PerformanceMetric[];
  coreWebVitals: CoreWebVitalsMetrics | null;
  regressions: PerformanceRegression[];
  alerts: PerformanceAlert[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

export interface UseRealTimePerformanceResult {
  data: RealTimePerformanceData | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export interface UsePerformanceBudgetResult {
  budgets: PerformanceBudget[];
  violations: PerformanceBudgetViolation[];
  createBudget: (budget: Omit<PerformanceBudget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBudget: (id: string, updates: Partial<PerformanceBudget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Component Props Types
export interface PerformanceMonitoringDashboardProps {
  dashboardId?: string;
  initialDashboard?: PerformanceMonitoringDashboard;
  editable?: boolean;
  realTime?: boolean;
  onDashboardChange?: (dashboard: PerformanceMonitoringDashboard) => void;
  className?: string;
}

export interface CoreWebVitalsWidgetProps {
  metrics: CoreWebVitalsMetrics | null;
  thresholds: PerformanceThresholds;
  timeRange?: { start: Date; end: Date };
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'all';
  showTrends?: boolean;
  className?: string;
}

export interface RegressionAlertProps {
  regressions: PerformanceRegression[];
  onRegressionClick?: (regression: PerformanceRegression) => void;
  onStatusChange?: (id: string, status: PerformanceRegression['status']) => void;
  maxItems?: number;
  className?: string;
}

export interface PerformanceBudgetStatusProps {
  budgets: PerformanceBudget[];
  violations: PerformanceBudgetViolation[];
  onBudgetClick?: (budget: PerformanceBudget) => void;
  onViolationClick?: (violation: PerformanceBudgetViolation) => void;
  showOnlyViolations?: boolean;
  className?: string;
}

// API Response Types
export interface PerformanceAPIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    total: number;
    page: number;
    limit: number;
    timeRange: { start: Date; end: Date };
  };
}

export interface CreatePerformanceBudgetRequest {
  name: string;
  description?: string;
  metrics: Record<string, { budget: number; unit: string; tolerance: number }>;
  pages: string[];
  deviceTypes: ('desktop' | 'mobile' | 'tablet')[];
}

export interface UpdatePerformanceBudgetRequest {
  name?: string;
  description?: string;
  metrics?: Record<string, { budget: number; unit: string; tolerance: number }>;
  pages?: string[];
  deviceTypes?: ('desktop' | 'mobile' | 'tablet')[];
  isActive?: boolean;
}

export interface PerformanceAnalysisRequest {
  timeRange: { start: Date; end: Date };
  metrics: string[];
  groupBy?: string[];
  filters?: Record<string, any>;
  includeRegressions?: boolean;
  includeRecommendations?: boolean;
}
