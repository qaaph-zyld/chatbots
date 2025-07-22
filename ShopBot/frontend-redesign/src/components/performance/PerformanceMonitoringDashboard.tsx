'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, BarChart } from '@/components/charts';
import { 
  usePerformanceMetrics, 
  PerformanceMetric, 
  CoreWebVital, 
  PerformanceAlert 
} from '@/lib/performance/PerformanceMonitor';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Activity, 
  Zap, 
  Cpu, 
  BarChart3, 
  Network 
} from 'lucide-react';

// Helper functions
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

const getWebVitalRatingColor = (rating: 'good' | 'needs-improvement' | 'poor'): string => {
  switch (rating) {
    case 'good': return 'bg-green-100 text-green-800';
    case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
    case 'poor': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getAlertSeverityColor = (severity: 'warning' | 'critical'): string => {
  return severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
};

const getWebVitalName = (name: string): string => {
  switch (name) {
    case 'LCP': return 'Largest Contentful Paint';
    case 'FID': return 'First Input Delay';
    case 'CLS': return 'Cumulative Layout Shift';
    case 'TTFB': return 'Time To First Byte';
    case 'FCP': return 'First Contentful Paint';
    default: return name;
  }
};

// Components
interface WebVitalCardProps {
  vital: CoreWebVital;
}

const WebVitalCard: React.FC<WebVitalCardProps> = ({ vital }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">{getWebVitalName(vital.name)}</CardTitle>
          <Badge className={getWebVitalRatingColor(vital.rating)}>
            {vital.rating === 'good' ? 'Good' : vital.rating === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
          </Badge>
        </div>
        <CardDescription className="text-xs">{formatTime(vital.timestamp)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatDuration(vital.value)}</div>
      </CardContent>
    </Card>
  );
};

interface AlertCardProps {
  alert: PerformanceAlert;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert }) => {
  return (
    <Alert className="mb-4">
      <AlertCircle className={alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'} />
      <AlertTitle className="flex items-center gap-2">
        {alert.metricName}
        <Badge className={getAlertSeverityColor(alert.severity)}>
          {alert.severity}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-1">
        <p>{alert.message}</p>
        <p className="text-xs text-gray-500 mt-1">
          {formatTime(alert.timestamp)} • Threshold: {alert.threshold}
        </p>
      </AlertDescription>
    </Alert>
  );
};

export function PerformanceMonitoringDashboard() {
  const { metrics, webVitals, alerts } = usePerformanceMetrics();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [timeRange, setTimeRange] = useState<'5min' | '15min' | '1hour' | '24hours'>('15min');
  
  // Filter metrics by time range
  const getTimeFilteredMetrics = () => {
    const now = Date.now();
    let timeThreshold: number;
    
    switch (timeRange) {
      case '5min': timeThreshold = 5 * 60 * 1000; break;
      case '15min': timeThreshold = 15 * 60 * 1000; break;
      case '1hour': timeThreshold = 60 * 60 * 1000; break;
      case '24hours': timeThreshold = 24 * 60 * 60 * 1000; break;
      default: timeThreshold = 15 * 60 * 1000;
    }
    
    return {
      filteredMetrics: metrics.filter(m => (now - m.timestamp) < timeThreshold),
      filteredWebVitals: webVitals.filter(v => (now - v.timestamp) < timeThreshold),
      filteredAlerts: alerts.filter(a => (now - a.timestamp) < timeThreshold),
    };
  };
  
  const { filteredMetrics, filteredWebVitals, filteredAlerts } = getTimeFilteredMetrics();
  
  // Group metrics by name for charts
  const groupedMetrics = filteredMetrics.reduce((acc, metric) => {
    if (!acc[metric.name]) {
      acc[metric.name] = [];
    }
    acc[metric.name].push(metric);
    return acc;
  }, {} as Record<string, PerformanceMetric[]>);
  
  // Get latest web vitals
  const latestWebVitals = Object.values(
    webVitals.reduce((acc, vital) => {
      if (!acc[vital.name] || vital.timestamp > acc[vital.name].timestamp) {
        acc[vital.name] = vital;
      }
      return acc;
    }, {} as Record<string, CoreWebVital>)
  );
  
  // Prepare chart data for metrics
  const prepareChartData = (metricName: string) => {
    const metrics = groupedMetrics[metricName] || [];
    
    // Sort by timestamp
    metrics.sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      labels: metrics.map(m => formatTime(m.timestamp)),
      datasets: [
        {
          label: `${metricName} (${metrics[0]?.unit || ''})`,
          data: metrics.map(m => m.value),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
        }
      ]
    };
  };
  
  // Calculate overall health score
  const calculateHealthScore = (): number => {
    if (latestWebVitals.length === 0) return 100;
    
    let score = 100;
    
    latestWebVitals.forEach(vital => {
      if (vital.rating === 'poor') {
        score -= 20;
      } else if (vital.rating === 'needs-improvement') {
        score -= 10;
      }
    });
    
    // Reduce score for recent alerts
    const recentAlerts = filteredAlerts.filter(a => (Date.now() - a.timestamp) < 15 * 60 * 1000);
    recentAlerts.forEach(alert => {
      if (alert.severity === 'critical') {
        score -= 15;
      } else {
        score -= 5;
      }
    });
    
    return Math.max(0, score);
  };
  
  const healthScore = calculateHealthScore();
  
  // Get health status
  const getHealthStatus = (): { label: string; color: string } => {
    if (healthScore >= 90) {
      return { label: 'Excellent', color: 'text-green-500' };
    } else if (healthScore >= 70) {
      return { label: 'Good', color: 'text-blue-500' };
    } else if (healthScore >= 50) {
      return { label: 'Fair', color: 'text-yellow-500' };
    } else {
      return { label: 'Poor', color: 'text-red-500' };
    }
  };
  
  const healthStatus = getHealthStatus();
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Performance Monitoring Dashboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Time Range:</span>
          <div className="flex gap-1">
            <Button 
              variant={timeRange === '5min' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('5min')}
            >
              5m
            </Button>
            <Button 
              variant={timeRange === '15min' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('15min')}
            >
              15m
            </Button>
            <Button 
              variant={timeRange === '1hour' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('1hour')}
            >
              1h
            </Button>
            <Button 
              variant={timeRange === '24hours' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setTimeRange('24hours')}
            >
              24h
            </Button>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="web-vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">{healthScore}</div>
                  <span className={`ml-2 ${healthStatus.color}`}>{healthStatus.label}</span>
                </div>
                <Progress value={healthScore} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Core Web Vitals</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {latestWebVitals.filter(v => v.rating === 'good').length}/{latestWebVitals.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {latestWebVitals.filter(v => v.rating === 'good').length === latestWebVitals.length 
                    ? 'All metrics are good' 
                    : 'Some metrics need improvement'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredAlerts.length}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredAlerts.filter(a => a.severity === 'critical').length} critical,{' '}
                  {filteredAlerts.filter(a => a.severity === 'warning').length} warnings
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metrics Collected</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredMetrics.length}</div>
                <p className="text-xs text-muted-foreground">
                  Across {Object.keys(groupedMetrics).length} categories
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Performance</CardTitle>
                <CardDescription>
                  Key metrics over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {Object.keys(groupedMetrics).length > 0 ? (
                  <LineChart 
                    data={prepareChartData(Object.keys(groupedMetrics)[0])} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No metrics data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
                <CardDescription>
                  Latest measurements for key user experience metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestWebVitals.length > 0 ? (
                    latestWebVitals.map((vital, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{getWebVitalName(vital.name)}</div>
                          <div className="text-sm text-gray-500">{formatDuration(vital.value)}</div>
                        </div>
                        <Badge className={getWebVitalRatingColor(vital.rating)}>
                          {vital.rating === 'good' ? 'Good' : vital.rating === 'needs-improvement' ? 'Needs Improvement' : 'Poor'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No Web Vitals data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {filteredAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>
                  Performance issues detected in the last {timeRange === '5min' ? '5 minutes' : timeRange === '15min' ? '15 minutes' : timeRange === '1hour' ? 'hour' : '24 hours'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAlerts.slice(0, 3).map((alert, index) => (
                    <AlertCard key={index} alert={alert} />
                  ))}
                  {filteredAlerts.length > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('alerts')}
                    >
                      View all {filteredAlerts.length} alerts
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Web Vitals Tab */}
        <TabsContent value="web-vitals">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                Detailed analysis of user experience metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {latestWebVitals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {latestWebVitals.map((vital, index) => (
                    <WebVitalCard key={index} vital={vital} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No Web Vitals data available</h3>
                  <p className="mt-2">Web Vitals data will appear here as users interact with your application</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Web Vitals Explained</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Largest Contentful Paint (LCP)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">First Input Delay (FID)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Measures interactivity. To provide a good user experience, pages should have a FID of 100 milliseconds or less.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cumulative Layout Shift (CLS)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1 or less.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">First Contentful Paint (FCP)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Measures the time from when the page starts loading to when any part of the page's content is rendered on the screen.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Detailed performance data collected from your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(groupedMetrics).length > 0 ? (
                <div className="space-y-8">
                  {Object.keys(groupedMetrics).map((metricName, index) => (
                    <div key={index} className="border-b pb-8 last:border-0 last:pb-0">
                      <h3 className="text-lg font-semibold mb-4">{metricName}</h3>
                      <div className="h-64">
                        <LineChart data={prepareChartData(metricName)} />
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm font-medium text-gray-500">Average</div>
                          <div className="text-lg font-semibold">
                            {formatDuration(
                              groupedMetrics[metricName].reduce((sum, m) => sum + m.value, 0) / 
                              groupedMetrics[metricName].length
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm font-medium text-gray-500">Min</div>
                          <div className="text-lg font-semibold">
                            {formatDuration(
                              Math.min(...groupedMetrics[metricName].map(m => m.value))
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="text-sm font-medium text-gray-500">Max</div>
                          <div className="text-lg font-semibold">
                            {formatDuration(
                              Math.max(...groupedMetrics[metricName].map(m => m.value))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No metrics data available</h3>
                  <p className="mt-2">Performance metrics will appear here as users interact with your application</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Performance Alerts</CardTitle>
              <CardDescription>
                Issues detected in your application's performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAlerts.length > 0 ? (
                <div className="space-y-4">
                  {filteredAlerts.map((alert, index) => (
                    <AlertCard key={index} alert={alert} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <CheckCircle2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No alerts detected</h3>
                  <p className="mt-2">Your application is performing well with no issues detected</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Performance Optimization Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Improve Loading Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Optimize and compress images</li>
                    <li>Implement lazy loading for below-the-fold content</li>
                    <li>Minimize and bundle JavaScript files</li>
                    <li>Use server-side rendering for initial content</li>
                    <li>Implement efficient caching strategies</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Enhance Interactivity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm">
                    <li>Minimize main thread work</li>
                    <li>Break up long tasks into smaller ones</li>
                    <li>Optimize event handlers</li>
                    <li>Implement debouncing and throttling</li>
                    <li>Use web workers for CPU-intensive tasks</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
