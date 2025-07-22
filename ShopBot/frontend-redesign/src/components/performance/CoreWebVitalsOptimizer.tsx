'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Zap, 
  Smartphone, 
  Monitor, 
  Wifi, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw
} from 'lucide-react';

// Core Web Vitals metrics interface
interface WebVitalsMetrics {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
}

// Performance optimization recommendations
interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  category: 'loading' | 'interactivity' | 'visual-stability' | 'mobile';
  implemented: boolean;
  estimatedImprovement: string;
}

// Mobile-specific metrics
interface MobileMetrics {
  touchTargetSize: number;
  viewportOptimized: boolean;
  mobilePageSpeed: number;
  touchResponsiveness: number;
}

const OPTIMIZATION_RECOMMENDATIONS: OptimizationRecommendation[] = [
  {
    id: '1',
    title: 'Implement Image Lazy Loading',
    description: 'Load images only when they enter the viewport to reduce initial page load time',
    impact: 'high',
    effort: 'low',
    category: 'loading',
    implemented: true,
    estimatedImprovement: '25% faster LCP'
  },
  {
    id: '2',
    title: 'Enable Code Splitting',
    description: 'Split JavaScript bundles to load only necessary code for each page',
    impact: 'high',
    effort: 'medium',
    category: 'loading',
    implemented: true,
    estimatedImprovement: '40% smaller initial bundle'
  },
  {
    id: '3',
    title: 'Optimize Critical CSS',
    description: 'Inline critical CSS and defer non-critical styles to improve render time',
    impact: 'medium',
    effort: 'medium',
    category: 'loading',
    implemented: false,
    estimatedImprovement: '15% faster FCP'
  },
  {
    id: '4',
    title: 'Implement Service Worker Caching',
    description: 'Cache static assets and API responses for faster subsequent loads',
    impact: 'high',
    effort: 'high',
    category: 'loading',
    implemented: false,
    estimatedImprovement: '60% faster repeat visits'
  },
  {
    id: '5',
    title: 'Optimize Touch Targets',
    description: 'Ensure all interactive elements meet minimum 44px touch target size',
    impact: 'high',
    effort: 'low',
    category: 'mobile',
    implemented: true,
    estimatedImprovement: '30% better mobile UX'
  },
  {
    id: '6',
    title: 'Reduce Layout Shifts',
    description: 'Reserve space for dynamic content to prevent unexpected layout changes',
    impact: 'medium',
    effort: 'medium',
    category: 'visual-stability',
    implemented: true,
    estimatedImprovement: '50% better CLS score'
  }
];

export interface CoreWebVitalsOptimizerProps {
  className?: string;
  onMetricsUpdate?: (metrics: WebVitalsMetrics) => void;
}

export const CoreWebVitalsOptimizer: React.FC<CoreWebVitalsOptimizerProps> = ({
  className,
  onMetricsUpdate
}) => {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    lcp: 2.1, // Good: < 2.5s
    fid: 45,  // Good: < 100ms
    cls: 0.08, // Good: < 0.1
    fcp: 1.4, // Good: < 1.8s
    ttfb: 180 // Good: < 600ms
  });

  const [mobileMetrics, setMobileMetrics] = useState<MobileMetrics>({
    touchTargetSize: 48,
    viewportOptimized: true,
    mobilePageSpeed: 92,
    touchResponsiveness: 95
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Simulate real-time metrics collection
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate slight variations in metrics
      setMetrics(prev => ({
        lcp: Math.max(1.8, Math.min(3.0, prev.lcp + (Math.random() - 0.5) * 0.1)),
        fid: Math.max(20, Math.min(120, prev.fid + (Math.random() - 0.5) * 10)),
        cls: Math.max(0.05, Math.min(0.15, prev.cls + (Math.random() - 0.5) * 0.02)),
        fcp: Math.max(1.0, Math.min(2.5, prev.fcp + (Math.random() - 0.5) * 0.1)),
        ttfb: Math.max(100, Math.min(400, prev.ttfb + (Math.random() - 0.5) * 20))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Notify parent of metrics changes
  useEffect(() => {
    onMetricsUpdate?.(metrics);
  }, [metrics, onMetricsUpdate]);

  const getScoreColor = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.needsImprovement) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return 'Good';
    if (value <= thresholds.needsImprovement) return 'Needs Improvement';
    return 'Poor';
  };

  const getBadgeVariant = (value: number, thresholds: { good: number; needsImprovement: number }) => {
    if (value <= thresholds.good) return 'default';
    if (value <= thresholds.needsImprovement) return 'secondary';
    return 'destructive';
  };

  const runOptimization = useCallback(async () => {
    setIsOptimizing(true);
    
    // Simulate optimization process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Improve metrics slightly
    setMetrics(prev => ({
      lcp: Math.max(1.5, prev.lcp * 0.9),
      fid: Math.max(20, prev.fid * 0.8),
      cls: Math.max(0.05, prev.cls * 0.7),
      fcp: Math.max(1.0, prev.fcp * 0.85),
      ttfb: Math.max(100, prev.ttfb * 0.9)
    }));

    setMobileMetrics(prev => ({
      ...prev,
      mobilePageSpeed: Math.min(100, prev.mobilePageSpeed + 3),
      touchResponsiveness: Math.min(100, prev.touchResponsiveness + 2)
    }));

    setIsOptimizing(false);
  }, []);

  const filteredRecommendations = OPTIMIZATION_RECOMMENDATIONS.filter(rec => 
    selectedCategory === 'all' || rec.category === selectedCategory
  );

  const implementedCount = OPTIMIZATION_RECOMMENDATIONS.filter(rec => rec.implemented).length;
  const totalCount = OPTIMIZATION_RECOMMENDATIONS.length;
  const implementationProgress = (implementedCount / totalCount) * 100;

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-6${className ? ` ${className}` : ''}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-yellow-500" />
          Performance Optimization Center
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Monitor Core Web Vitals, optimize mobile experience, and implement performance best practices.
        </p>
      </div>

      {/* Core Web Vitals Dashboard */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Core Web Vitals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* LCP */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">Largest Contentful Paint (LCP)</div>
                <div className="text-sm text-gray-600">Loading performance</div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${getScoreColor(metrics.lcp, { good: 2.5, needsImprovement: 4.0 })}`}>
                  {metrics.lcp.toFixed(1)}s
                </div>
                <Badge variant={getBadgeVariant(metrics.lcp, { good: 2.5, needsImprovement: 4.0 })}>
                  {getScoreBadge(metrics.lcp, { good: 2.5, needsImprovement: 4.0 })}
                </Badge>
              </div>
            </div>

            {/* FID */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">First Input Delay (FID)</div>
                <div className="text-sm text-gray-600">Interactivity</div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${getScoreColor(metrics.fid, { good: 100, needsImprovement: 300 })}`}>
                  {metrics.fid.toFixed(0)}ms
                </div>
                <Badge variant={getBadgeVariant(metrics.fid, { good: 100, needsImprovement: 300 })}>
                  {getScoreBadge(metrics.fid, { good: 100, needsImprovement: 300 })}
                </Badge>
              </div>
            </div>

            {/* CLS */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <div className="font-medium">Cumulative Layout Shift (CLS)</div>
                <div className="text-sm text-gray-600">Visual stability</div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${getScoreColor(metrics.cls, { good: 0.1, needsImprovement: 0.25 })}`}>
                  {metrics.cls.toFixed(3)}
                </div>
                <Badge variant={getBadgeVariant(metrics.cls, { good: 0.1, needsImprovement: 0.25 })}>
                  {getScoreBadge(metrics.cls, { good: 0.1, needsImprovement: 0.25 })}
                </Badge>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{metrics.fcp.toFixed(1)}s</div>
                <div className="text-xs text-gray-600">First Contentful Paint</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{metrics.ttfb.toFixed(0)}ms</div>
                <div className="text-xs text-gray-600">Time to First Byte</div>
              </div>
            </div>

            <Button 
              onClick={runOptimization} 
              disabled={isOptimizing}
              className="w-full"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Optimization
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Mobile Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Mobile Page Speed</span>
                <span className="text-xl font-bold text-green-600">{mobileMetrics.mobilePageSpeed}/100</span>
              </div>
              <Progress value={mobileMetrics.mobilePageSpeed} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Touch Responsiveness</span>
                <span className="text-xl font-bold text-blue-600">{mobileMetrics.touchResponsiveness}/100</span>
              </div>
              <Progress value={mobileMetrics.touchResponsiveness} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{mobileMetrics.touchTargetSize}px</div>
                <div className="text-xs text-gray-600">Min Touch Target</div>
                <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-1" />
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">Optimized</div>
                <div className="text-xs text-gray-600">Viewport Config</div>
                <CheckCircle className="h-4 w-4 text-green-600 mx-auto mt-1" />
              </div>
            </div>

            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Mobile performance is excellent! All touch targets meet accessibility standards.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Optimization Implementation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Overall Progress</span>
              <span className="text-lg font-bold">{implementedCount}/{totalCount} optimizations</span>
            </div>
            <Progress value={implementationProgress} className="h-3" />
            <div className="text-sm text-gray-600">
              {implementationProgress.toFixed(0)}% of recommended optimizations implemented
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
          <div className="flex gap-2">
            {['all', 'loading', 'interactivity', 'visual-stability', 'mobile'].map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {filteredRecommendations.map((recommendation) => (
              <Card key={recommendation.id} className={`border-l-4 ${
                recommendation.implemented ? 'border-l-green-500' : 'border-l-yellow-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{recommendation.title}</h4>
                    {recommendation.implemented ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-2">
                      <Badge variant={recommendation.impact === 'high' ? 'default' : 'secondary'}>
                        {recommendation.impact} impact
                      </Badge>
                      <Badge variant="outline">
                        {recommendation.effort} effort
                      </Badge>
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {recommendation.estimatedImprovement}
                    </div>
                  </div>

                  {recommendation.implemented && (
                    <div className="text-sm text-green-600 font-medium">
                      ✓ Implemented
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">92%</div>
              <div className="text-sm text-green-600">Performance Score</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">1.8s</div>
              <div className="text-sm text-blue-600">Average Load Time</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <Smartphone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">95%</div>
              <div className="text-sm text-purple-600">Mobile Friendly Score</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoreWebVitalsOptimizer;
