/**
 * Advanced Analytics Types
 * Comprehensive type definitions for sophisticated data visualization and business intelligence
 */

export interface ChartDataPoint {
  id: string;
  label: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
  category?: string;
  color?: string;
}

export interface TimeSeriesDataPoint extends ChartDataPoint {
  timestamp: Date;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
  previousValue?: number;
}

export interface ChartConfiguration {
  id: string;
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'heatmap' | 'funnel' | 'gauge';
  title: string;
  description?: string;
  data: ChartDataPoint[] | TimeSeriesDataPoint[];
  dimensions: {
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
  };
  axes?: {
    x?: AxisConfiguration;
    y?: AxisConfiguration;
  };
  styling?: ChartStyling;
  interactions?: ChartInteractions;
  animation?: AnimationConfiguration;
  responsive?: boolean;
}

export interface AxisConfiguration {
  label: string;
  scale: 'linear' | 'log' | 'time' | 'ordinal';
  domain?: [number, number] | string[];
  format?: string;
  tickCount?: number;
  gridLines?: boolean;
}

export interface ChartStyling {
  colorScheme?: string[];
  theme?: 'light' | 'dark' | 'custom';
  strokeWidth?: number;
  opacity?: number;
  borderRadius?: number;
  gradient?: boolean;
  customCSS?: Record<string, string>;
}

export interface ChartInteractions {
  hover?: boolean;
  click?: boolean;
  zoom?: boolean;
  pan?: boolean;
  brush?: boolean;
  tooltip?: TooltipConfiguration;
  legend?: LegendConfiguration;
}

export interface TooltipConfiguration {
  enabled: boolean;
  template?: string;
  position?: 'mouse' | 'fixed';
  customRenderer?: (data: ChartDataPoint) => string;
}

export interface LegendConfiguration {
  enabled: boolean;
  position: 'top' | 'right' | 'bottom' | 'left';
  orientation?: 'horizontal' | 'vertical';
  interactive?: boolean;
}

export interface AnimationConfiguration {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  delay?: number;
  stagger?: number;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text' | 'custom';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  configuration: ChartConfiguration | MetricConfiguration | TableConfiguration | TextConfiguration;
  dataSource: DataSourceConfiguration;
  refreshInterval?: number; // seconds
  isVisible: boolean;
  permissions?: string[];
  lastUpdated?: Date;
}

export interface MetricConfiguration {
  id: string;
  label: string;
  value: number;
  format: 'number' | 'currency' | 'percentage' | 'duration';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  target?: {
    value: number;
    label: string;
  };
  thresholds?: {
    good: number;
    warning: number;
    critical: number;
  };
  icon?: string;
  color?: string;
}

export interface TableConfiguration {
  id: string;
  columns: TableColumn[];
  data: Record<string, any>[];
  pagination?: {
    enabled: boolean;
    pageSize: number;
    currentPage: number;
  };
  sorting?: {
    enabled: boolean;
    defaultSort?: { column: string; direction: 'asc' | 'desc' };
  };
  filtering?: {
    enabled: boolean;
    filters: TableFilter[];
  };
  actions?: TableAction[];
}

export interface TableColumn {
  id: string;
  label: string;
  dataKey: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'badge' | 'action';
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  format?: string;
  render?: (value: any, row: Record<string, any>) => React.ReactNode;
}

export interface TableFilter {
  id: string;
  column: string;
  type: 'text' | 'select' | 'date' | 'range';
  value: any;
  options?: { label: string; value: any }[];
}

export interface TableAction {
  id: string;
  label: string;
  icon?: string;
  onClick: (row: Record<string, any>) => void;
  condition?: (row: Record<string, any>) => boolean;
}

export interface TextConfiguration {
  id: string;
  content: string;
  format: 'plain' | 'markdown' | 'html';
  styling?: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface DataSourceConfiguration {
  id: string;
  type: 'api' | 'websocket' | 'static' | 'calculated';
  endpoint?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  transform?: (data: any) => ChartDataPoint[] | any[];
  cache?: {
    enabled: boolean;
    duration: number; // seconds
  };
  realTime?: {
    enabled: boolean;
    interval: number; // seconds
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  permissions: DashboardPermissions;
  settings: DashboardSettings;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom';
  columns: number;
  rowHeight: number;
  gap: number;
  responsive?: {
    breakpoints: Record<string, { columns: number; rowHeight: number }>;
  };
}

export interface DashboardFilter {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text';
  options?: { label: string; value: any }[];
  defaultValue?: any;
  affectedWidgets: string[];
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  admin: string[];
  public?: boolean;
}

export interface DashboardSettings {
  autoRefresh: {
    enabled: boolean;
    interval: number; // seconds
  };
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
  showTitles: boolean;
  showDescriptions: boolean;
  enableExport: boolean;
  enableSharing: boolean;
}

export interface AnalyticsInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  category: string;
  data: {
    metric: string;
    value: number;
    change: number;
    period: string;
    context?: Record<string, any>;
  };
  actions?: InsightAction[];
  createdAt: Date;
  expiresAt?: Date;
}

export interface InsightAction {
  id: string;
  label: string;
  type: 'navigate' | 'filter' | 'export' | 'alert' | 'custom';
  payload: Record<string, any>;
  icon?: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  type: 'scheduled' | 'on-demand' | 'alert-based';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  dashboard: string; // Dashboard ID
  filters?: Record<string, any>;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    timezone: string;
    recipients: string[];
  };
  lastGenerated?: Date;
  nextGeneration?: Date;
  status: 'active' | 'paused' | 'failed';
}

export interface RealTimeMetrics {
  activeUsers: number;
  pageViews: number;
  conversions: number;
  revenue: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number }>;
  topSources: Array<{ source: string; users: number }>;
  conversionFunnel: Array<{ stage: string; users: number; rate: number }>;
  timestamp: Date;
}

export interface AdvancedAnalyticsConfig {
  apiEndpoint: string;
  websocketEndpoint?: string;
  refreshInterval: number;
  maxDataPoints: number;
  enableRealTime: boolean;
  enableInsights: boolean;
  enableReports: boolean;
  caching: {
    enabled: boolean;
    duration: number;
    strategy: 'memory' | 'localStorage' | 'sessionStorage';
  };
  performance: {
    lazyLoading: boolean;
    virtualization: boolean;
    debounceMs: number;
  };
}

// Hook Types
export interface UseAnalyticsResult {
  data: ChartDataPoint[] | TimeSeriesDataPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

export interface UseDashboardResult {
  dashboard: Dashboard | null;
  widgets: DashboardWidget[];
  loading: boolean;
  error: string | null;
  updateWidget: (widgetId: string, updates: Partial<DashboardWidget>) => void;
  addWidget: (widget: Omit<DashboardWidget, 'id'>) => void;
  removeWidget: (widgetId: string) => void;
  saveDashboard: () => Promise<void>;
}

export interface UseInsightsResult {
  insights: AnalyticsInsight[];
  loading: boolean;
  error: string | null;
  dismissInsight: (insightId: string) => void;
  executeAction: (insightId: string, actionId: string) => void;
}

// Component Props Types
export interface AdvancedChartProps {
  configuration: ChartConfiguration;
  data?: ChartDataPoint[] | TimeSeriesDataPoint[];
  onDataPointClick?: (dataPoint: ChartDataPoint) => void;
  onChartReady?: (chartInstance: any) => void;
  className?: string;
}

export interface DashboardWidgetProps {
  widget: DashboardWidget;
  onUpdate?: (updates: Partial<DashboardWidget>) => void;
  onRemove?: () => void;
  isEditing?: boolean;
  className?: string;
}

export interface AnalyticsDashboardProps {
  dashboardId?: string;
  initialDashboard?: Dashboard;
  editable?: boolean;
  onDashboardChange?: (dashboard: Dashboard) => void;
  className?: string;
}

export interface InsightsPanelProps {
  insights: AnalyticsInsight[];
  onInsightAction?: (insight: AnalyticsInsight, action: InsightAction) => void;
  onInsightDismiss?: (insightId: string) => void;
  maxInsights?: number;
  className?: string;
}

// API Response Types
export interface AnalyticsAPIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  metadata?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  insights?: AnalyticsInsight[];
}

export interface CreateDashboardRequest {
  name: string;
  description?: string;
  widgets: Omit<DashboardWidget, 'id'>[];
  layout: DashboardLayout;
  filters?: DashboardFilter[];
  settings?: Partial<DashboardSettings>;
}

export interface UpdateDashboardRequest {
  name?: string;
  description?: string;
  widgets?: DashboardWidget[];
  layout?: DashboardLayout;
  filters?: DashboardFilter[];
  settings?: Partial<DashboardSettings>;
}

export interface GenerateReportRequest {
  dashboardId: string;
  format: 'pdf' | 'excel' | 'csv';
  filters?: Record<string, any>;
  dateRange?: {
    start: Date;
    end: Date;
  };
  recipients?: string[];
}
