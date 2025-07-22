/**
 * Analytics Dashboard
 * Real-time dashboard with customizable widgets and advanced data visualization
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Clock,
  Zap,
  RefreshCw,
  Settings,
  Plus,
  Maximize2,
  Minimize2,
  Filter,
  Download,
  Share,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import AdvancedChart from './AdvancedChart';
import {
  Dashboard,
  DashboardWidget,
  ChartConfiguration,
  MetricConfiguration,
  RealTimeMetrics,
  AnalyticsInsight,
  AnalyticsDashboardProps
} from '../../types/AdvancedAnalyticsTypes';

export function AnalyticsDashboard({
  dashboardId,
  initialDashboard,
  editable = false,
  onDashboardChange,
  className = ''
}: AnalyticsDashboardProps) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(initialDashboard || null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Initialize dashboard
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        
        if (dashboardId && !initialDashboard) {
          // Load dashboard from API
          const response = await fetch(`/api/analytics/dashboards/${dashboardId}`);
          const data = await response.json();
          setDashboard(data.dashboard);
          setWidgets(data.dashboard.widgets);
        } else if (initialDashboard) {
          setDashboard(initialDashboard);
          setWidgets(initialDashboard.widgets);
        } else {
          // Create default dashboard
          const defaultDashboard = createDefaultDashboard();
          setDashboard(defaultDashboard);
          setWidgets(defaultDashboard.widgets);
        }

        // Load initial insights
        setInsights(generateMockInsights());
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [dashboardId, initialDashboard]);

  // Real-time data updates
  useEffect(() => {
    if (!autoRefresh) return;

    const updateRealTimeData = () => {
      // Simulate real-time metrics
      setRealTimeMetrics({
        activeUsers: Math.floor(Math.random() * 500) + 100,
        pageViews: Math.floor(Math.random() * 10000) + 5000,
        conversions: Math.floor(Math.random() * 100) + 50,
        revenue: Math.floor(Math.random() * 50000) + 25000,
        averageSessionDuration: Math.floor(Math.random() * 300) + 120,
        bounceRate: Math.random() * 0.3 + 0.2,
        topPages: [
          { page: '/homepage', views: Math.floor(Math.random() * 1000) + 500 },
          { page: '/pricing', views: Math.floor(Math.random() * 800) + 400 },
          { page: '/features', views: Math.floor(Math.random() * 600) + 300 }
        ],
        topSources: [
          { source: 'Organic Search', users: Math.floor(Math.random() * 500) + 200 },
          { source: 'Direct', users: Math.floor(Math.random() * 300) + 150 },
          { source: 'Social Media', users: Math.floor(Math.random() * 200) + 100 }
        ],
        conversionFunnel: [
          { stage: 'Visitors', users: 1000, rate: 1.0 },
          { stage: 'Interested', users: 400, rate: 0.4 },
          { stage: 'Considering', users: 150, rate: 0.375 },
          { stage: 'Converted', users: 48, rate: 0.32 }
        ],
        timestamp: new Date()
      });

      // Update widget data
      setWidgets(prevWidgets => 
        prevWidgets.map(widget => ({
          ...widget,
          lastUpdated: new Date()
        }))
      );
    };

    updateRealTimeData(); // Initial update
    const interval = setInterval(updateRealTimeData, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Dashboard metrics calculations
  const dashboardMetrics = useMemo(() => {
    if (!realTimeMetrics) return null;

    const conversionRate = realTimeMetrics.conversions / realTimeMetrics.pageViews;
    const revenuePerVisitor = realTimeMetrics.revenue / realTimeMetrics.pageViews;
    const avgSessionMinutes = Math.floor(realTimeMetrics.averageSessionDuration / 60);

    return {
      totalVisitors: realTimeMetrics.activeUsers,
      totalPageViews: realTimeMetrics.pageViews,
      conversionRate: (conversionRate * 100).toFixed(2),
      totalRevenue: realTimeMetrics.revenue,
      revenuePerVisitor: revenuePerVisitor.toFixed(2),
      avgSessionDuration: `${avgSessionMinutes}m ${realTimeMetrics.averageSessionDuration % 60}s`,
      bounceRate: (realTimeMetrics.bounceRate * 100).toFixed(1)
    };
  }, [realTimeMetrics]);

  // Widget management functions
  const updateWidget = useCallback((widgetId: string, updates: Partial<DashboardWidget>) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId ? { ...widget, ...updates } : widget
    ));
    
    if (dashboard) {
      const updatedDashboard = {
        ...dashboard,
        widgets: widgets.map(widget => 
          widget.id === widgetId ? { ...widget, ...updates } : widget
        )
      };
      onDashboardChange?.(updatedDashboard);
    }
  }, [widgets, dashboard, onDashboardChange]);

  const addWidget = useCallback((widget: Omit<DashboardWidget, 'id'>) => {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setWidgets(prev => [...prev, newWidget]);
    
    if (dashboard) {
      const updatedDashboard = {
        ...dashboard,
        widgets: [...widgets, newWidget]
      };
      onDashboardChange?.(updatedDashboard);
    }
  }, [widgets, dashboard, onDashboardChange]);

  const removeWidget = useCallback((widgetId: string) => {
    setWidgets(prev => prev.filter(widget => widget.id !== widgetId));
    
    if (dashboard) {
      const updatedDashboard = {
        ...dashboard,
        widgets: widgets.filter(widget => widget.id !== widgetId)
      };
      onDashboardChange?.(updatedDashboard);
    }
  }, [widgets, dashboard, onDashboardChange]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics dashboard: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2" />
            {dashboard?.name || 'Analytics Dashboard'}
          </h2>
          <p className="text-gray-600">{dashboard?.description || 'Real-time business intelligence and insights'}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={autoRefresh ? 'default' : 'secondary'} className="flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            {autoRefresh ? 'Live' : 'Paused'}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {editable && (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Users"
            value={dashboardMetrics.totalVisitors.toLocaleString()}
            trend={{ direction: 'up', percentage: 12.5, period: 'vs last hour' }}
            icon={<Users className="h-4 w-4" />}
            color="blue"
          />
          <MetricCard
            title="Page Views"
            value={dashboardMetrics.totalPageViews.toLocaleString()}
            trend={{ direction: 'up', percentage: 8.3, period: 'vs last hour' }}
            icon={<Eye className="h-4 w-4" />}
            color="green"
          />
          <MetricCard
            title="Conversion Rate"
            value={`${dashboardMetrics.conversionRate}%`}
            trend={{ direction: 'down', percentage: 2.1, period: 'vs last hour' }}
            icon={<TrendingUp className="h-4 w-4" />}
            color="purple"
          />
          <MetricCard
            title="Revenue"
            value={`$${(dashboardMetrics.totalRevenue / 1000).toFixed(1)}K`}
            trend={{ direction: 'up', percentage: 15.7, period: 'vs last hour' }}
            icon={<DollarSign className="h-4 w-4" />}
            color="orange"
          />
        </div>
      )}

      {/* Insights Panel */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Automated insights and recommendations based on your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className={`h-2 w-2 rounded-full mt-2 ${
                    insight.impact === 'high' ? 'bg-red-500' : 
                    insight.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.confidence}% confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {insight.impact} impact
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Trends</CardTitle>
                <CardDescription>Visitor patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <AdvancedChart
                  configuration={{
                    id: 'traffic-trends',
                    type: 'line',
                    title: '',
                    data: generateTimeSeriesData('traffic', 24),
                    dimensions: { width: 400, height: 300 },
                    styling: { colorScheme: ['#3b82f6'], strokeWidth: 2 },
                    interactions: { tooltip: { enabled: true } },
                    animation: { enabled: true, duration: 750, easing: 'ease-in-out' }
                  }}
                />
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey through conversion stages</CardDescription>
              </CardHeader>
              <CardContent>
                {realTimeMetrics?.conversionFunnel && (
                  <div className="space-y-4">
                    {realTimeMetrics.conversionFunnel.map((stage, index) => (
                      <div key={stage.stage} className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">{stage.stage}</span>
                            <span className="text-sm text-gray-600">
                              {stage.users.toLocaleString()} users ({(stage.rate * 100).toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={stage.rate * 100} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                {realTimeMetrics?.topPages && (
                  <div className="space-y-3">
                    {realTimeMetrics.topPages.map((page, index) => (
                      <div key={page.page} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className="font-medium text-gray-900">{page.page}</span>
                        </div>
                        <span className="text-sm text-gray-600">{page.views.toLocaleString()} views</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                <AdvancedChart
                  configuration={{
                    id: 'traffic-sources',
                    type: 'donut',
                    title: '',
                    data: realTimeMetrics?.topSources.map(source => ({
                      id: source.source,
                      label: source.source,
                      value: source.users,
                      timestamp: new Date()
                    })) || [],
                    dimensions: { width: 300, height: 300 },
                    styling: { colorScheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] },
                    interactions: { tooltip: { enabled: true } }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Traffic */}
            <Card>
              <CardHeader>
                <CardTitle>Hourly Traffic Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedChart
                  configuration={{
                    id: 'hourly-traffic',
                    type: 'bar',
                    title: '',
                    data: generateHourlyData(),
                    dimensions: { width: 400, height: 300 },
                    styling: { colorScheme: ['#3b82f6'] },
                    interactions: { tooltip: { enabled: true } }
                  }}
                />
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedChart
                  configuration={{
                    id: 'device-breakdown',
                    type: 'pie',
                    title: '',
                    data: [
                      { id: 'desktop', label: 'Desktop', value: 45, timestamp: new Date() },
                      { id: 'mobile', label: 'Mobile', value: 40, timestamp: new Date() },
                      { id: 'tablet', label: 'Tablet', value: 15, timestamp: new Date() }
                    ],
                    dimensions: { width: 300, height: 300 },
                    styling: { colorScheme: ['#3b82f6', '#10b981', '#f59e0b'] }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Analytics</CardTitle>
              <CardDescription>Track conversion performance and optimization opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Conversion analytics will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Monitor revenue trends and financial performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Revenue analytics will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

function MetricCard({ title, value, trend, icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-1">
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : trend.direction === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <div className="h-3 w-3 bg-gray-400 rounded-full mr-1" />
                )}
                <span className={`text-xs ${
                  trend.direction === 'up' ? 'text-green-600' : 
                  trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trend.percentage}% {trend.period}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Utility functions
function createDefaultDashboard(): Dashboard {
  return {
    id: 'default',
    name: 'ShopBot Analytics',
    description: 'Real-time business intelligence dashboard',
    widgets: [],
    layout: { type: 'grid', columns: 12, rowHeight: 100, gap: 16 },
    filters: [],
    permissions: { view: ['all'], edit: ['admin'], admin: ['admin'] },
    settings: {
      autoRefresh: { enabled: true, interval: 30 },
      theme: 'light',
      density: 'comfortable',
      showTitles: true,
      showDescriptions: true,
      enableExport: true,
      enableSharing: true
    },
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function generateTimeSeriesData(type: string, hours: number) {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseValue = type === 'traffic' ? 100 : 50;
    const variation = Math.random() * 50;
    
    data.push({
      id: `${type}_${i}`,
      label: timestamp.toLocaleTimeString(),
      value: baseValue + variation,
      timestamp
    });
  }
  
  return data;
}

function generateHourlyData() {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push({
      id: `hour_${i}`,
      label: `${i}:00`,
      value: Math.floor(Math.random() * 200) + 50,
      timestamp: new Date()
    });
  }
  return hours;
}

function generateMockInsights(): AnalyticsInsight[] {
  return [
    {
      id: 'insight_1',
      type: 'trend',
      title: 'Traffic Surge Detected',
      description: 'Page views increased by 34% in the last hour, primarily from organic search.',
      confidence: 92,
      impact: 'high',
      category: 'traffic',
      data: { metric: 'page_views', value: 1340, change: 34, period: 'last_hour' },
      actions: [
        { id: 'view_traffic', label: 'View Traffic Details', type: 'navigate', payload: { tab: 'traffic' } }
      ],
      createdAt: new Date()
    },
    {
      id: 'insight_2',
      type: 'anomaly',
      title: 'Conversion Rate Drop',
      description: 'Conversion rate decreased by 8% compared to yesterday. Consider reviewing checkout flow.',
      confidence: 87,
      impact: 'medium',
      category: 'conversions',
      data: { metric: 'conversion_rate', value: 2.3, change: -8, period: 'yesterday' },
      actions: [
        { id: 'view_conversions', label: 'Analyze Conversions', type: 'navigate', payload: { tab: 'conversions' } }
      ],
      createdAt: new Date()
    },
    {
      id: 'insight_3',
      type: 'recommendation',
      title: 'Mobile Optimization Opportunity',
      description: 'Mobile bounce rate is 15% higher than desktop. Consider mobile UX improvements.',
      confidence: 78,
      impact: 'medium',
      category: 'optimization',
      data: { metric: 'mobile_bounce_rate', value: 65, change: 15, period: 'vs_desktop' },
      actions: [
        { id: 'mobile_analysis', label: 'Mobile Analysis', type: 'navigate', payload: { page: 'mobile_analysis' } }
      ],
      createdAt: new Date()
    }
  ];
}

export default AnalyticsDashboard;
