/**
 * Real-time Performance Monitoring Dashboard
 * Comprehensive performance tracking with Core Web Vitals, regression detection, and optimization insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
  Zap,
  Eye,
  Clock,
  Target,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Download,
  Maximize2
} from 'lucide-react';
import {
  CoreWebVitalsMetrics,
  PerformanceRegression,
  PerformanceAlert,
  RealTimePerformanceData,
  PerformanceThresholds,
  PerformanceBudget,
  PerformanceRecommendation
} from '../../types/PerformanceMonitoringTypes';
import PerformanceMonitoringService from '../../services/PerformanceMonitoringService';

interface RealTimePerformanceDashboardProps {
  className?: string;
  refreshInterval?: number;
  showAdvanced?: boolean;
  compactMode?: boolean;
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  threshold: { good: number; needsImprovement: number; poor: number };
  trend?: 'up' | 'down' | 'stable';
  change?: number;
  icon: React.ReactNode;
  compactMode?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  threshold,
  trend,
  change,
  icon,
  compactMode = false
}) => {
  const getStatus = (value: number, threshold: { good: number; needsImprovement: number; poor: number }) => {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  };

  const status = getStatus(value, threshold);
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    'needs-improvement': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    poor: 'text-red-600 bg-red-50 border-red-200'
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return null;
  };

  if (compactMode) {
    return (
      <div className={`p-3 rounded-lg border ${statusColors[status]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-lg font-bold">{value.toFixed(unit === 'score' ? 3 : 0)}</span>
            <span className="text-xs">{unit}</span>
            {getTrendIcon()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {getTrendIcon()}
      </div>
      
      <div className="space-y-3">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold">{value.toFixed(unit === 'score' ? 3 : 0)}</span>
          <span className="text-sm text-gray-500">{unit}</span>
        </div>
        
        {change !== undefined && (
          <div className="flex items-center space-x-1 text-sm">
            <span className={change > 0 ? 'text-red-600' : 'text-green-600'}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}% vs last period
            </span>
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Good: ≤{threshold.good}{unit}</span>
            <span>Poor: >{threshold.needsImprovement}{unit}</span>
          </div>
          <Progress 
            value={Math.min(100, (value / threshold.poor) * 100)} 
            className="h-2"
          />
        </div>
      </div>
    </div>
  );
};

const RegressionAlert: React.FC<{ regression: PerformanceRegression; onStatusChange: (id: string, status: string) => void }> = ({
  regression,
  onStatusChange
}) => {
  const severityColors = {
    critical: 'border-red-500 bg-red-50',
    major: 'border-orange-500 bg-orange-50',
    minor: 'border-yellow-500 bg-yellow-50'
  };

  const severityIcons = {
    critical: <XCircle className="h-5 w-5 text-red-500" />,
    major: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    minor: <AlertCircle className="h-5 w-5 text-yellow-500" />
  };

  return (
    <div className={`p-4 rounded-lg border ${severityColors[regression.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {severityIcons[regression.severity]}
          <div>
            <h4 className="font-semibold text-gray-900">{regression.description}</h4>
            <p className="text-sm text-gray-600 mt-1">
              {regression.metric} changed by {regression.changePercent.toFixed(1)}% 
              ({regression.baselineValue.toFixed(0)} → {regression.currentValue.toFixed(0)})
            </p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>Affected: ~{regression.affectedUsers} users</span>
              <span>Detected: {regression.detectedAt.toLocaleDateString()}</span>
              <span className="capitalize">{regression.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onStatusChange(regression.id, 'investigating')}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            disabled={regression.status === 'investigating'}
          >
            Investigate
          </button>
          <button
            onClick={() => onStatusChange(regression.id, 'resolved')}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            disabled={regression.status === 'resolved'}
          >
            Resolve
          </button>
        </div>
      </div>
      
      {regression.recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Recommendations:</h5>
          <ul className="space-y-1">
            {regression.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                <Target className="h-3 w-3 mt-0.5 text-blue-500" />
                <span>{rec.title}: {rec.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const RealTimePerformanceDashboard: React.FC<RealTimePerformanceDashboardProps> = ({
  className = '',
  refreshInterval = 30000,
  showAdvanced = true,
  compactMode = false
}) => {
  const [performanceService] = useState(() => new PerformanceMonitoringService());
  const [realTimeData, setRealTimeData] = useState<RealTimePerformanceData | null>(null);
  const [coreWebVitals, setCoreWebVitals] = useState<CoreWebVitalsMetrics | null>(null);
  const [regressions, setRegressions] = useState<PerformanceRegression[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Default thresholds
  const thresholds: PerformanceThresholds = {
    lcp: { good: 2500, needsImprovement: 4000, poor: 4000 },
    fid: { good: 100, needsImprovement: 300, poor: 300 },
    cls: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000, poor: 3000 },
    ttfb: { good: 800, needsImprovement: 1800, poor: 1800 },
    tbt: { good: 200, needsImprovement: 600, poor: 600 },
    si: { good: 3400, needsImprovement: 5800, poor: 5800 }
  };

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate data fetching
      const mockRealTimeData: RealTimePerformanceData = performanceService.getRealTimeData();
      const mockCoreWebVitals: CoreWebVitalsMetrics = {
        lcp: 2200 + Math.random() * 1000,
        fid: 80 + Math.random() * 100,
        cls: 0.08 + Math.random() * 0.1,
        fcp: 1600 + Math.random() * 800,
        ttfb: 600 + Math.random() * 400,
        tbt: 150 + Math.random() * 200,
        si: 3000 + Math.random() * 1500,
        timestamp: new Date(),
        url: window.location.href,
        deviceType: 'desktop',
        viewport: { width: window.innerWidth, height: window.innerHeight },
        networkCondition: '4g'
      };

      const mockRegressions: PerformanceRegression[] = [
        {
          id: '1',
          metric: 'lcp',
          severity: 'major',
          description: 'LCP increased significantly on product pages',
          currentValue: 3200,
          baselineValue: 2400,
          changePercent: 33.3,
          threshold: 20,
          detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          url: '/product/*',
          deviceType: 'mobile',
          affectedUsers: 1250,
          potentialCauses: ['Large hero images', 'Slow API responses', 'Third-party scripts'],
          recommendations: [
            {
              id: '1',
              title: 'Optimize Images',
              description: 'Compress and resize product images',
              impact: 'high',
              effort: 'medium',
              category: 'images',
              implementation: { steps: [], resources: [] },
              estimatedImprovement: { metric: 'lcp', value: 800, unit: 'ms' },
              priority: 9,
              isImplemented: false
            }
          ],
          status: 'detected'
        }
      ];

      const mockRecommendations: PerformanceRecommendation[] = [
        {
          id: '1',
          title: 'Enable Image Compression',
          description: 'Implement WebP format with fallbacks for better compression',
          impact: 'high',
          effort: 'medium',
          category: 'images',
          implementation: {
            steps: ['Audit current images', 'Convert to WebP', 'Add fallback support'],
            resources: ['https://web.dev/serve-images-webp/']
          },
          estimatedImprovement: { metric: 'lcp', value: 600, unit: 'ms' },
          priority: 9,
          isImplemented: false
        },
        {
          id: '2',
          title: 'Implement Code Splitting',
          description: 'Split JavaScript bundles to reduce initial load time',
          impact: 'high',
          effort: 'high',
          category: 'javascript',
          implementation: {
            steps: ['Analyze bundle size', 'Implement dynamic imports', 'Test performance impact'],
            resources: ['https://web.dev/reduce-javascript-payloads-with-code-splitting/']
          },
          estimatedImprovement: { metric: 'fid', value: 40, unit: 'ms' },
          priority: 8,
          isImplemented: false
        }
      ];

      setRealTimeData(mockRealTimeData);
      setCoreWebVitals(mockCoreWebVitals);
      setRegressions(mockRegressions);
      setAlerts(performanceService.getAlerts());
      setRecommendations(mockRecommendations);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Failed to refresh performance data:', error);
    } finally {
      setLoading(false);
    }
  }, [performanceService]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  const handleRegressionStatusChange = (id: string, status: string) => {
    setRegressions(prev => prev.map(reg => 
      reg.id === id ? { ...reg, status: status as any } : reg
    ));
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      realTimeData,
      coreWebVitals,
      regressions,
      alerts: alerts.slice(0, 10)
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !realTimeData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-lg">Loading performance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 overflow-auto' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-time Performance Monitoring</h2>
          <p className="text-gray-600 mt-1">
            Live performance metrics and regression detection
            {lastUpdated && (
              <span className="ml-2 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Maximize2 className="h-4 w-4" />
            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Status Bar */}
      {realTimeData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{realTimeData.activeUsers}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{realTimeData.averageLoadTime.toFixed(0)}ms</div>
            <div className="text-sm text-gray-600">Avg Load Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{(realTimeData.errorRate * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Error Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{realTimeData.throughput}</div>
            <div className="text-sm text-gray-600">Requests/Hour</div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="regressions">Regressions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Core Web Vitals Summary */}
          {coreWebVitals && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Largest Contentful Paint"
                value={coreWebVitals.lcp}
                unit="ms"
                threshold={thresholds.lcp}
                trend="up"
                change={5.2}
                icon={<Eye className="h-5 w-5" />}
                compactMode={compactMode}
              />
              <MetricCard
                title="First Input Delay"
                value={coreWebVitals.fid}
                unit="ms"
                threshold={thresholds.fid}
                trend="stable"
                icon={<Zap className="h-5 w-5" />}
                compactMode={compactMode}
              />
              <MetricCard
                title="Cumulative Layout Shift"
                value={coreWebVitals.cls}
                unit="score"
                threshold={thresholds.cls}
                trend="down"
                change={-2.1}
                icon={<BarChart3 className="h-5 w-5" />}
                compactMode={compactMode}
              />
            </div>
          )}

          {/* Device and Network Breakdown */}
          {realTimeData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white border rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Device Breakdown</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      <span>Desktop</span>
                    </div>
                    <span className="font-medium">{realTimeData.deviceBreakdown.desktop}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <span>Mobile</span>
                    </div>
                    <span className="font-medium">{realTimeData.deviceBreakdown.mobile}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tablet className="h-4 w-4 text-gray-500" />
                      <span>Tablet</span>
                    </div>
                    <span className="font-medium">{realTimeData.deviceBreakdown.tablet}%</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Wifi className="h-5 w-5" />
                  <span>Network Breakdown</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(realTimeData.networkBreakdown).map(([network, percentage]) => (
                    <div key={network} className="flex items-center justify-between">
                      <span className="capitalize">{network}</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="vitals" className="space-y-6">
          {coreWebVitals && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MetricCard
                title="First Contentful Paint"
                value={coreWebVitals.fcp}
                unit="ms"
                threshold={thresholds.fcp}
                icon={<Clock className="h-5 w-5" />}
              />
              <MetricCard
                title="Time to First Byte"
                value={coreWebVitals.ttfb}
                unit="ms"
                threshold={thresholds.ttfb}
                icon={<Activity className="h-5 w-5" />}
              />
              <MetricCard
                title="Total Blocking Time"
                value={coreWebVitals.tbt}
                unit="ms"
                threshold={thresholds.tbt}
                icon={<AlertTriangle className="h-5 w-5" />}
              />
              <MetricCard
                title="Speed Index"
                value={coreWebVitals.si}
                unit="score"
                threshold={thresholds.si}
                icon={<TrendingUp className="h-5 w-5" />}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="regressions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Regressions</h3>
            <span className="text-sm text-gray-500">{regressions.length} active regressions</span>
          </div>
          
          {regressions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Regressions Detected</h3>
              <p className="text-gray-500">All performance metrics are within expected ranges.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {regressions.map(regression => (
                <RegressionAlert
                  key={regression.id}
                  regression={regression}
                  onStatusChange={handleRegressionStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Recommendations</h3>
            <span className="text-sm text-gray-500">{recommendations.length} recommendations</span>
          </div>
          
          <div className="space-y-4">
            {recommendations.map(rec => (
              <div key={rec.id} className="p-6 border rounded-lg bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rec.impact === 'high' ? 'bg-red-100 text-red-700' :
                        rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rec.impact} impact
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rec.effort === 'high' ? 'bg-red-100 text-red-700' :
                        rec.effort === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rec.effort} effort
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{rec.description}</p>
                    <div className="text-sm text-gray-500">
                      Estimated improvement: {rec.estimatedImprovement.value} {rec.estimatedImprovement.unit} in {rec.estimatedImprovement.metric.toUpperCase()}
                    </div>
                  </div>
                  <div className="ml-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Implement
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimePerformanceDashboard;
