/**
 * PerformanceRegressionDashboard.compact.tsx
 * 
 * This file contains the compact mode interface and types for the PerformanceRegressionDashboard component.
 * It provides TypeScript interfaces and utility functions for compact mode rendering.
 */

import { CoreWebVital, PerformanceMetric } from '@/lib/performance/PerformanceMonitor';
import { BaselineMetric, RegressionResult } from '@/lib/performance/PerformanceRegressionDetector';

/**
 * Props for the PerformanceRegressionDashboard component
 */
export interface PerformanceRegressionDashboardProps {
  /** Whether to render in compact mode */
  compact?: boolean;
  /** Custom class name for the component */
  className?: string;
}

/**
 * Configuration for chart rendering in compact mode
 */
export interface CompactChartConfig {
  /** Height of the chart in compact mode */
  height: number;
  /** Whether to show the legend in compact mode */
  showLegend: boolean;
  /** Whether to show tooltips in compact mode */
  showTooltips: boolean;
  /** Maximum number of data points to show in compact mode */
  maxDataPoints: number;
}

/**
 * Default configuration for compact mode charts
 */
export const DEFAULT_COMPACT_CHART_CONFIG: CompactChartConfig = {
  height: 120,
  showLegend: false,
  showTooltips: true,
  maxDataPoints: 10
};

/**
 * Prepare web vitals chart data for compact mode
 * 
 * @param webVitals Array of web vital metrics
 * @param config Compact chart configuration
 * @returns Formatted chart data for compact mode
 */
export const prepareCompactWebVitalsChartData = (
  webVitals: CoreWebVital[],
  config: CompactChartConfig = DEFAULT_COMPACT_CHART_CONFIG
) => {
  // Group web vitals by name
  const vitalsByName: Record<string, CoreWebVital[]> = {};
  webVitals.forEach(vital => {
    if (!vitalsByName[vital.name]) {
      vitalsByName[vital.name] = [];
    }
    vitalsByName[vital.name].push(vital);
  });
  
  // Get the limited number of entries for each vital
  const datasets = Object.entries(vitalsByName).map(([name, vitals]) => {
    // Sort by timestamp
    const sortedVitals = [...vitals].sort((a, b) => a.timestamp - b.timestamp);
    // Take limited number based on config
    const recentVitals = sortedVitals.slice(-config.maxDataPoints);
    
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
  const recentTimestamps = sortedTimestamps.slice(-config.maxDataPoints);
  const labels = recentTimestamps.map(t => new Date(t).toLocaleTimeString());
  
  return {
    labels,
    datasets
  };
};

/**
 * Prepare regression chart data for compact mode
 * 
 * @param regressions Array of regression results
 * @param config Compact chart configuration
 * @returns Formatted chart data for compact mode
 */
export const prepareCompactRegressionChartData = (
  regressions: RegressionResult[],
  config: CompactChartConfig = DEFAULT_COMPACT_CHART_CONFIG
) => {
  // Group regressions by metric name
  const regressionsByMetric: Record<string, number> = {};
  regressions.forEach(regression => {
    regressionsByMetric[regression.metricName] = (regressionsByMetric[regression.metricName] || 0) + 1;
  });
  
  // Sort by count
  const sortedRegressions = Object.entries(regressionsByMetric)
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.min(5, config.maxDataPoints)); // Limited for compact view
  
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

/**
 * Get color for vital
 * 
 * @param name Name of the vital metric
 * @param alpha Opacity value
 * @returns Color string in rgba format
 */
export const getVitalColor = (name: string, alpha = 1): string => {
  const colors: Record<string, string> = {
    'LCP': `rgba(220, 38, 38, ${alpha})`,
    'FID': `rgba(234, 88, 12, ${alpha})`,
    'CLS': `rgba(234, 179, 8, ${alpha})`,
    'TTFB': `rgba(22, 163, 74, ${alpha})`,
    'FCP': `rgba(59, 130, 246, ${alpha})`,
  };
  
  return colors[name] || `rgba(99, 102, 241, ${alpha})`;
};

/**
 * Calculate regression statistics for compact display
 * 
 * @param regressions Array of regression results
 * @returns Object containing regression statistics
 */
export const calculateRegressionStats = (regressions: RegressionResult[]) => {
  return {
    total: regressions.length,
    severe: regressions.filter(r => r.severity === 'severe').length,
    moderate: regressions.filter(r => r.severity === 'moderate').length,
    minor: regressions.filter(r => r.severity === 'minor').length,
    recent24h: regressions.filter(r => r.timestamp > Date.now() - 24 * 60 * 60 * 1000).length
  };
};

/**
 * Calculate web vital statistics for compact display
 * 
 * @param webVitals Array of web vital metrics
 * @returns Object containing web vital statistics
 */
export const calculateWebVitalStats = (webVitals: CoreWebVital[]) => {
  return {
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
};
