'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, BarChart } from '@/components/charts';
import { 
  usePerformanceMetrics, 
  PerformanceMetric, 
  CoreWebVital 
} from '@/lib/performance/PerformanceMonitor';
import { 
  usePerformanceRegressions, 
  BaselineMetric, 
  RegressionResult 
} from '@/lib/performance/PerformanceRegressionDetector';
import { 
  AlertCircle, 
  TrendingDown, 
  BarChart2, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the PerformanceRegressionDashboard component
 */
export interface PerformanceRegressionDashboardProps {
  /** Whether to render in compact mode */
  compact?: boolean;
  /** Custom class name for the component */
  className?: string;
}

// Helper functions
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const formatValue = (value: number, unit: string): string => {
  if (unit === 'ms') {
    return `${value.toFixed(2)}ms`;
  } else if (unit === '%') {
    return `${value.toFixed(2)}%`;
  } else if (unit === '') {
    return value.toFixed(4);
  }
  return `${value.toFixed(2)}${unit}`;
};

const getSeverityColor = (severity: 'minor' | 'moderate' | 'severe'): string => {
  switch (severity) {
    case 'severe':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case 'moderate':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
    case 'minor':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

const getWebVitalRatingColor = (rating: 'good' | 'needs-improvement' | 'poor'): string => {
  switch (rating) {
    case 'good':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    case 'needs-improvement':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'poor':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

export function PerformanceRegressionDashboard({ 
  compact = false,
  className
}: PerformanceRegressionDashboardProps): React.ReactElement {
  // Get performance metrics and regressions
  const { metrics, webVitals } = usePerformanceMetrics();
  const { regressions, baselines, updateAllBaselines, clearRegressions } = usePerformanceRegressions();
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRegression, setSelectedRegression] = useState<RegressionResult | null>(null);
  const [isUpdatingBaselines, setIsUpdatingBaselines] = useState(false);
  
  // Prepare chart data for web vitals over time
  const prepareWebVitalsChartData = () => {
    // Group web vitals by name
    const vitalsByName: Record<string, CoreWebVital[]> = {};
    webVitals.forEach(vital => {
      if (!vitalsByName[vital.name]) {
        vitalsByName[vital.name] = [];
      }
      vitalsByName[vital.name].push(vital);
    });
    
    // Get the last 20 entries for each vital
    const datasets = Object.entries(vitalsByName).map(([name, vitals]) => {
      // Sort by timestamp
      const sortedVitals = [...vitals].sort((a, b) => a.timestamp - b.timestamp);
      // Take last 20
      const recentVitals = sortedVitals.slice(-20);
      
      return {
        label: name,
        data: recentVitals.map(v => v.value),
        borderColor: getVitalColor(name),
        backgroundColor: getVitalColor(name, 0.2),
      };
    });
    
    // Create labels (timestamps)
    const allVitals = Object.values(vitalsByName).flat();
    const sortedTimestamps = [...new Set(allVitals.map(v => v.timestamp))].sort();
    const recentTimestamps = sortedTimestamps.slice(-20);
    const labels = recentTimestamps.map(t => new Date(t).toLocaleTimeString());
    
    return {
      labels,
      datasets
    };
  };
  
  // Get color for vital
  const getVitalColor = (name: string, alpha = 1) => {
    const colors: Record<string, string> = {
      'LCP': `rgba(220, 38, 38, ${alpha})`,
      'FID': `rgba(234, 88, 12, ${alpha})`,
      'CLS': `rgba(234, 179, 8, ${alpha})`,
      'TTFB': `rgba(22, 163, 74, ${alpha})`,
      'FCP': `rgba(59, 130, 246, ${alpha})`,
    };
    
    return colors[name] || `rgba(99, 102, 241, ${alpha})`;
  };
  
  // Prepare regression chart data
  const prepareRegressionChartData = () => {
    // Group regressions by metric name
    const regressionsByMetric: Record<string, number> = {};
    regressions.forEach(regression => {
      regressionsByMetric[regression.metricName] = (regressionsByMetric[regression.metricName] || 0) + 1;
    });
    
    // Sort by count
    const sortedRegressions = Object.entries(regressionsByMetric)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10
    
    return {
      labels: sortedRegressions.map(([name]) => name),
      datasets: [
        {
          label: 'Regression Count',
          data: sortedRegressions.map(([, count]) => count),
          backgroundColor: 'rgba(220, 38, 38, 0.5)',
          borderColor: 'rgba(220, 38, 38, 1)',
        }
      ]
    };
  };
  
  // Update baselines
  const handleUpdateBaselines = async () => {
    setIsUpdatingBaselines(true);
    try {
      await updateAllBaselines();
    } finally {
      setIsUpdatingBaselines(false);
    }
  };
  
  // Regression statistics
  const regressionStats = {
    total: regressions.length,
    severe: regressions.filter(r => r.severity === 'severe').length,
    moderate: regressions.filter(r => r.severity === 'moderate').length,
    minor: regressions.filter(r => r.severity === 'minor').length,
    recent24h: regressions.filter(r => r.timestamp > Date.now() - 24 * 60 * 60 * 1000).length
  };
  
  // Web vital statistics
  const webVitalStats = {
    LCP: {
      good: webVitals.filter(v => v.name === 'LCP' && v.rating === 'good').length,
      needsImprovement: webVitals.filter(v => v.name === 'LCP' && v.rating === 'needs-improvement').length,
      poor: webVitals.filter(v => v.name === 'LCP' && v.rating === 'poor').length,
    },
    FID: {
      good: webVitals.filter(v => v.name === 'FID' && v.rating === 'good').length,
      needsImprovement: webVitals.filter(v => v.name === 'FID' && v.rating === 'needs-improvement').length,
      poor: webVitals.filter(v => v.name === 'FID' && v.rating === 'poor').length,
    },
    CLS: {
      good: webVitals.filter(v => v.name === 'CLS' && v.rating === 'good').length,
      needsImprovement: webVitals.filter(v => v.name === 'CLS' && v.rating === 'needs-improvement').length,
      poor: webVitals.filter(v => v.name === 'CLS' && v.rating === 'poor').length,
    }
  };

  // Render compact mode
  if (compact) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance Health</CardTitle>
            <CardDescription className="text-xs">Regression monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <div className="text-center">
                <div className="text-sm font-medium">{regressionStats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-red-500">{regressionStats.severe}</div>
                <div className="text-xs text-muted-foreground">Severe</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-orange-500">{regressionStats.moderate}</div>
                <div className="text-xs text-muted-foreground">Moderate</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-yellow-500">{regressionStats.minor}</div>
                <div className="text-xs text-muted-foreground">Minor</div>
              </div>
            </div>
            
            {regressionStats.severe > 0 && (
              <Alert variant="destructive" className="py-2 text-xs mb-2">
                <AlertCircle className="h-3 w-3" />
                <AlertTitle className="text-xs">Critical Issues</AlertTitle>
                <AlertDescription className="text-xs">
                  {regressionStats.severe} severe performance regressions detected
                </AlertDescription>
              </Alert>
            )}
            
            <div className="h-24">
              <LineChart data={prepareWebVitalsChartData()} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render full mode
  return (
    <div className={cn("container mx-auto py-6", className)}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Performance Regression Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleUpdateBaselines}
            disabled={isUpdatingBaselines}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdatingBaselines ? 'animate-spin' : ''}`} />
            {isUpdatingBaselines ? 'Updating...' : 'Update Baselines'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearRegressions}
            className="flex items-center gap-1"
          >
            <Clock className="h-4 w-4" />
            Clear Regressions
          </Button>
        </div>
      </div>
      
      {regressionStats.severe > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical Performance Regressions Detected</AlertTitle>
          <AlertDescription>
            {regressionStats.severe} severe performance regressions have been detected. 
            Please review the details in the Regressions tab.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="regressions">Regressions</TabsTrigger>
          <TabsTrigger value="baselines">Baselines</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Regressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regressionStats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Severe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <div className="text-2xl font-bold">{regressionStats.severe}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Moderate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                  <div className="text-2xl font-bold">{regressionStats.moderate}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Minor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  <div className="text-2xl font-bold">{regressionStats.minor}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{regressionStats.recent24h}</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Web Vitals Over Time</CardTitle>
                <CardDescription>Recent measurements</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <LineChart data={prepareWebVitalsChartData()} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Regressions by Metric</CardTitle>
                <CardDescription>Most problematic metrics</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <BarChart data={prepareRegressionChartData()} />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>LCP Status</CardTitle>
                <CardDescription>Largest Contentful Paint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Good</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      {webVitalStats.LCP.good}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Needs Improvement</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                      {webVitalStats.LCP.needsImprovement}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Poor</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {webVitalStats.LCP.poor}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>FID Status</CardTitle>
                <CardDescription>First Input Delay</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Good</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      {webVitalStats.FID.good}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Needs Improvement</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                      {webVitalStats.FID.needsImprovement}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Poor</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {webVitalStats.FID.poor}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>CLS Status</CardTitle>
                <CardDescription>Cumulative Layout Shift</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Good</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      {webVitalStats.CLS.good}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Needs Improvement</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                      {webVitalStats.CLS.needsImprovement}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Poor</span>
                    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                      {webVitalStats.CLS.poor}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Regressions Tab */}
        <TabsContent value="regressions">
          <Card>
            <CardHeader>
              <CardTitle>Performance Regressions</CardTitle>
              <CardDescription>
                Detected performance regressions compared to established baselines
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {regressions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">No Regressions Detected</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All performance metrics are within expected ranges
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Severity</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead className="w-[120px]">Current</TableHead>
                        <TableHead className="w-[120px]">Baseline</TableHead>
                        <TableHead className="w-[100px]">Change</TableHead>
                        <TableHead className="w-[100px]">Confidence</TableHead>
                        <TableHead className="w-[180px]">Detected</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regressions.map((regression) => (
                        <TableRow 
                          key={`${regression.metricName}-${regression.timestamp}`}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedRegression(regression)}
                        >
                          <TableCell>
                            <Badge className={getSeverityColor(regression.severity)}>
                              {regression.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {regression.metricName}
                          </TableCell>
                          <TableCell>
                            {formatValue(regression.currentValue, regression.unit)}
                          </TableCell>
                          <TableCell>
                            {formatValue(regression.baselineValue, regression.unit)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {regression.percentChange > 0 ? (
                                <ArrowUpCircle className="h-4 w-4 text-red-500 mr-1" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4 text-green-500 mr-1" />
                              )}
                              {Math.abs(regression.percentChange).toFixed(1)}%
                            </div>
                          </TableCell>
                          <TableCell>
                            {(regression.confidence * 100).toFixed(0)}%
                          </TableCell>
                          <TableCell>
                            {formatDate(regression.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            
            {selectedRegression !== null && (
              <CardFooter className="flex flex-col items-start border-t p-4">
                <div className="w-full space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Regression Details</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedRegression(null)}
                    >
                      Close
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Metric</h4>
                      <p>{selectedRegression.metricName}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Detected At</h4>
                      <p>{formatDate(selectedRegression.timestamp)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Current Value</h4>
                      <p>{formatValue(selectedRegression.currentValue, selectedRegression.unit)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Baseline Value</h4>
                      <p>{formatValue(selectedRegression.baselineValue, selectedRegression.unit)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Change</h4>
                      <div className="flex items-center">
                        {selectedRegression.percentChange > 0 ? (
                          <ArrowUpCircle className="h-4 w-4 text-red-500 mr-1" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-green-500 mr-1" />
                        )}
                        {Math.abs(selectedRegression.percentChange).toFixed(2)}% 
                        ({formatValue(selectedRegression.absoluteChange, selectedRegression.unit)})
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Statistical Significance</h4>
                      <p>Z-Score: {selectedRegression.zScore.toFixed(2)} (Confidence: {(selectedRegression.confidence * 100).toFixed(0)}%)</p>
                    </div>
                  </div>
                  
                  <Alert variant={selectedRegression.severity === 'severe' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Recommendation</AlertTitle>
                    <AlertDescription>
                      {selectedRegression.severity === 'severe' 
                        ? 'This is a critical regression that requires immediate attention. Investigate recent code changes that might have affected this metric.'
                        : selectedRegression.severity === 'moderate'
                          ? 'This regression is significant and should be investigated in the near future.'
                          : 'This is a minor regression that should be monitored for further degradation.'
                      }
                    </AlertDescription>
                  </Alert>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Baselines Tab */}
        <TabsContent value="baselines">
          <Card>
            <CardHeader>
              <CardTitle>Performance Baselines</CardTitle>
              <CardDescription>
                Established performance baselines used for regression detection
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {baselines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Baselines Established</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Collect more performance data to establish baselines
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={handleUpdateBaselines}
                    disabled={isUpdatingBaselines}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingBaselines ? 'animate-spin' : ''}`} />
                    {isUpdatingBaselines ? 'Updating...' : 'Update Baselines'}
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead className="w-[100px]">Mean</TableHead>
                        <TableHead className="w-[100px]">Median</TableHead>
                        <TableHead className="w-[100px]">P95</TableHead>
                        <TableHead className="w-[100px]">Std Dev</TableHead>
                        <TableHead className="w-[100px]">Samples</TableHead>
                        <TableHead className="w-[180px]">Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {baselines.map((baseline) => (
                        <TableRow key={baseline.name}>
                          <TableCell className="font-medium">
                            {baseline.name}
                          </TableCell>
                          <TableCell>
                            {formatValue(baseline.mean, baseline.unit)}
                          </TableCell>
                          <TableCell>
                            {formatValue(baseline.median, baseline.unit)}
                          </TableCell>
                          <TableCell>
                            {formatValue(baseline.p95, baseline.unit)}
                          </TableCell>
                          <TableCell>
                            {formatValue(baseline.stdDev, baseline.unit)}
                          </TableCell>
                          <TableCell>
                            {baseline.sampleSize}
                          </TableCell>
                          <TableCell>
                            {formatDate(baseline.lastUpdated)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={handleUpdateBaselines}
                disabled={isUpdatingBaselines}
                className="ml-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingBaselines ? 'animate-spin' : ''}`} />
                {isUpdatingBaselines ? 'Updating...' : 'Update Baselines'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
