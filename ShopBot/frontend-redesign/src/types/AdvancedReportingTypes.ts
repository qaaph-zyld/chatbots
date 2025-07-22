/**
 * Advanced Reporting & Insights Types
 * Comprehensive analytics and business intelligence interfaces
 * Part of Phase 3: Market Leadership - Advanced Reporting & Insights
 */

// Core Reporting Types
export interface ReportConfiguration {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  dataSource: DataSource[];
  filters: ReportFilter[];
  visualization: VisualizationConfig;
  schedule?: ScheduleConfig;
  recipients: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
  tags: string[];
}

export type ReportType = 
  | 'dashboard' 
  | 'summary' 
  | 'detailed' 
  | 'comparative' 
  | 'trend' 
  | 'forecast' 
  | 'cohort' 
  | 'funnel' 
  | 'retention' 
  | 'attribution';

export type ReportCategory = 
  | 'revenue' 
  | 'customer' 
  | 'product' 
  | 'marketing' 
  | 'operations' 
  | 'performance' 
  | 'compliance' 
  | 'executive';

// Data Source Configuration
export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connection: ConnectionConfig;
  schema: DataSchema;
  refreshRate: RefreshRate;
  lastSync: Date;
  status: DataSourceStatus;
}

export type DataSourceType = 
  | 'database' 
  | 'api' 
  | 'file' 
  | 'stream' 
  | 'webhook' 
  | 'integration';

export type DataSourceStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

export interface ConnectionConfig {
  endpoint?: string;
  credentials?: Record<string, any>;
  headers?: Record<string, string>;
  timeout: number;
  retryAttempts: number;
}

export interface DataSchema {
  tables: TableSchema[];
  relationships: Relationship[];
  metrics: MetricDefinition[];
  dimensions: DimensionDefinition[];
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  primaryKey: string[];
  indexes: string[];
}

export interface ColumnDefinition {
  name: string;
  type: DataType;
  nullable: boolean;
  description?: string;
}

export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'json' | 'array';

export interface Relationship {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  foreignKey: string;
  primaryKey: string;
}

// Metrics and Dimensions
export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  formula: string;
  aggregation: AggregationType;
  format: MetricFormat;
  category: string;
  tags: string[];
}

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median' | 'percentile';

export interface MetricFormat {
  type: 'number' | 'currency' | 'percentage' | 'duration' | 'bytes';
  precision: number;
  prefix?: string;
  suffix?: string;
  currency?: string;
}

export interface DimensionDefinition {
  id: string;
  name: string;
  description: string;
  type: DimensionType;
  hierarchy?: string[];
  format?: string;
}

export type DimensionType = 'categorical' | 'temporal' | 'geographical' | 'numerical';

// Filtering and Querying
export interface ReportFilter {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  type: FilterType;
  label: string;
  required: boolean;
}

export type FilterOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'between' 
  | 'in' 
  | 'not_in' 
  | 'contains' 
  | 'starts_with' 
  | 'ends_with' 
  | 'is_null' 
  | 'is_not_null';

export type FilterType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean';

// Visualization Configuration
export interface VisualizationConfig {
  type: ChartType;
  layout: LayoutConfig;
  styling: StylingConfig;
  interactions: InteractionConfig;
  annotations: AnnotationConfig[];
}

export type ChartType = 
  | 'line' 
  | 'bar' 
  | 'column' 
  | 'area' 
  | 'pie' 
  | 'donut' 
  | 'scatter' 
  | 'bubble' 
  | 'heatmap' 
  | 'treemap' 
  | 'funnel' 
  | 'gauge' 
  | 'table' 
  | 'pivot' 
  | 'kpi' 
  | 'map';

export interface LayoutConfig {
  width: number;
  height: number;
  margin: Margin;
  responsive: boolean;
  grid: GridConfig;
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GridConfig {
  show: boolean;
  color: string;
  opacity: number;
  strokeWidth: number;
}

export interface StylingConfig {
  colors: ColorScheme;
  fonts: FontConfig;
  theme: ThemeConfig;
}

export interface ColorScheme {
  primary: string[];
  secondary: string[];
  accent: string[];
  neutral: string[];
  semantic: SemanticColors;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface FontConfig {
  family: string;
  sizes: FontSizes;
  weights: FontWeights;
}

export interface FontSizes {
  small: number;
  medium: number;
  large: number;
  xlarge: number;
}

export interface FontWeights {
  light: number;
  normal: number;
  medium: number;
  bold: number;
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  background: string;
  surface: string;
  border: string;
  text: TextColors;
}

export interface TextColors {
  primary: string;
  secondary: string;
  disabled: string;
  inverse: string;
}

export interface InteractionConfig {
  hover: boolean;
  click: boolean;
  zoom: boolean;
  pan: boolean;
  brush: boolean;
  tooltip: TooltipConfig;
  legend: LegendConfig;
}

export interface TooltipConfig {
  enabled: boolean;
  format: string;
  position: 'auto' | 'top' | 'bottom' | 'left' | 'right';
  style: Record<string, any>;
}

export interface LegendConfig {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  orientation: 'horizontal' | 'vertical';
  style: Record<string, any>;
}

export interface AnnotationConfig {
  id: string;
  type: 'line' | 'area' | 'point' | 'text' | 'image';
  position: AnnotationPosition;
  content: string;
  style: Record<string, any>;
}

export interface AnnotationPosition {
  x: number | string;
  y: number | string;
  anchor: 'start' | 'middle' | 'end';
}

// Scheduling and Automation
export interface ScheduleConfig {
  enabled: boolean;
  frequency: ScheduleFrequency;
  time: string;
  timezone: string;
  days?: number[];
  dates?: number[];
  endDate?: Date;
}

export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type RefreshRate = 'real-time' | '1min' | '5min' | '15min' | '30min' | '1hour' | '6hour' | '12hour' | '24hour';

// Advanced Analytics
export interface AnalyticsInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  impact: ImpactLevel;
  category: InsightCategory;
  data: InsightData;
  recommendations: Recommendation[];
  createdAt: Date;
  expiresAt?: Date;
}

export type InsightType = 
  | 'anomaly' 
  | 'trend' 
  | 'correlation' 
  | 'forecast' 
  | 'opportunity' 
  | 'risk' 
  | 'performance' 
  | 'behavior';

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export type InsightCategory = 
  | 'revenue' 
  | 'customer' 
  | 'product' 
  | 'marketing' 
  | 'operations' 
  | 'quality' 
  | 'security';

export interface InsightData {
  metrics: Record<string, number>;
  dimensions: Record<string, string>;
  timeRange: DateRange;
  comparison?: ComparisonData;
  visualization?: VisualizationConfig;
}

export interface ComparisonData {
  baseline: Record<string, number>;
  current: Record<string, number>;
  change: Record<string, number>;
  changePercent: Record<string, number>;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: Priority;
  effort: EffortLevel;
  impact: ImpactLevel;
  category: string;
  estimatedROI?: number;
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type EffortLevel = 'low' | 'medium' | 'high';

// Date and Time Utilities
export interface DateRange {
  start: Date;
  end: Date;
  timezone?: string;
}

export interface TimeGranularity {
  unit: TimeUnit;
  value: number;
}

export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

// Export and Sharing
export interface ExportConfig {
  format: ExportFormat;
  options: ExportOptions;
  destination: ExportDestination;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'png' | 'svg';

export interface ExportOptions {
  includeData: boolean;
  includeCharts: boolean;
  includeFilters: boolean;
  includeMetadata: boolean;
  compression?: 'none' | 'zip' | 'gzip';
  quality?: number;
}

export interface ExportDestination {
  type: 'download' | 'email' | 'cloud' | 'api';
  target: string;
  credentials?: Record<string, any>;
}

// Dashboard Configuration
export interface DashboardConfig {
  id: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: GlobalFilter[];
  theme: ThemeConfig;
  permissions: DashboardPermissions;
  sharing: SharingConfig;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'masonry';
  columns: number;
  gap: number;
  responsive: boolean;
  breakpoints: Record<string, number>;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  dataSource: string;
  filters: ReportFilter[];
}

export type WidgetType = 
  | 'chart' 
  | 'table' 
  | 'kpi' 
  | 'text' 
  | 'image' 
  | 'iframe' 
  | 'filter' 
  | 'navigation';

export interface WidgetPosition {
  x: number;
  y: number;
  z?: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetConfig {
  visualization?: VisualizationConfig;
  data?: Record<string, any>;
  style?: Record<string, any>;
  interactions?: Record<string, any>;
}

export interface GlobalFilter {
  id: string;
  name: string;
  type: FilterType;
  scope: string[];
  defaultValue?: any;
  required: boolean;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  share: string[];
  export: string[];
  delete: string[];
}

export interface SharingConfig {
  enabled: boolean;
  public: boolean;
  password?: string;
  expiresAt?: Date;
  allowComments: boolean;
  allowDownload: boolean;
}

// Performance and Optimization
export interface QueryPerformance {
  executionTime: number;
  dataSize: number;
  cacheHit: boolean;
  optimizations: string[];
  bottlenecks: string[];
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  strategy: CacheStrategy;
  invalidation: InvalidationRule[];
}

export type CacheStrategy = 'lru' | 'lfu' | 'ttl' | 'manual';

export interface InvalidationRule {
  trigger: 'time' | 'data_change' | 'manual';
  condition: string;
  action: 'invalidate' | 'refresh';
}

// Error Handling and Monitoring
export interface ReportError {
  id: string;
  type: ErrorType;
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  reportId?: string;
}

export type ErrorType = 
  | 'data_source' 
  | 'query' 
  | 'visualization' 
  | 'export' 
  | 'permission' 
  | 'system';

export interface MonitoringMetrics {
  reportCount: number;
  activeUsers: number;
  queryVolume: number;
  averageLoadTime: number;
  errorRate: number;
  cacheHitRate: number;
  dataFreshness: Record<string, Date>;
}
