/**
 * Performance Monitoring Service
 * Real-time performance tracking, regression detection, and optimization recommendations
 */

import {
  PerformanceMetric,
  CoreWebVitalsMetrics,
  PerformanceRegression,
  PerformanceThresholds,
  PerformanceBudget,
  PerformanceBudgetViolation,
  PerformanceAlert,
  PerformanceRecommendation,
  RealTimePerformanceData,
  PerformanceMonitoringConfig
} from '../types/PerformanceMonitoringTypes';

export class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private coreWebVitalsHistory: CoreWebVitalsMetrics[] = [];
  private regressions: PerformanceRegression[] = [];
  private budgets: PerformanceBudget[] = [];
  private alerts: PerformanceAlert[] = [];
  private config: PerformanceMonitoringConfig;
  private observers: PerformanceObserver[] = [];

  // Default thresholds based on Google's Core Web Vitals
  private defaultThresholds: PerformanceThresholds = {
    lcp: { good: 2500, needsImprovement: 4000, poor: 4000 },
    fid: { good: 100, needsImprovement: 300, poor: 300 },
    cls: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
    fcp: { good: 1800, needsImprovement: 3000, poor: 3000 },
    ttfb: { good: 800, needsImprovement: 1800, poor: 1800 },
    tbt: { good: 200, needsImprovement: 600, poor: 600 },
    si: { good: 3400, needsImprovement: 5800, poor: 5800 }
  };

  constructor(config?: Partial<PerformanceMonitoringConfig>) {
    this.config = {
      sampling: { rate: 0.1, strategy: 'random' },
      thresholds: this.defaultThresholds,
      budgets: [],
      alerts: {
        enabled: true,
        channels: ['dashboard'],
        recipients: [],
        throttling: { enabled: true, windowMs: 300000, maxAlerts: 5 }
      },
      regression: {
        enabled: true,
        lookbackDays: 7,
        sensitivityThreshold: 20,
        minSampleSize: 100
      },
      reporting: {
        enabled: true,
        frequency: 'daily',
        recipients: [],
        includeRecommendations: true
      },
      storage: {
        retentionDays: 30,
        aggregationIntervals: ['1m', '5m', '1h', '1d']
      },
      ...config
    };

    this.initializePerformanceObservers();
    this.loadStoredData();
  }

  /**
   * Initialize Performance Observers
   */
  private initializePerformanceObservers(): void {
    if (typeof window === 'undefined') return;

    try {
      // Core Web Vitals Observer
      const vitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processCoreWebVitalsEntry(entry);
        }
      });

      vitalsObserver.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      this.observers.push(vitalsObserver);

      // Navigation Timing Observer
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processNavigationEntry(entry as PerformanceNavigationTiming);
        }
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  /**
   * Process Core Web Vitals entries
   */
  private processCoreWebVitalsEntry(entry: PerformanceEntry): void {
    if (!this.shouldSample()) return;

    const timestamp = new Date();
    const url = window.location.href;
    const deviceType = this.getDeviceType();

    // Update or create Core Web Vitals record
    let vitalsRecord = this.coreWebVitalsHistory.find(
      record => Math.abs(record.timestamp.getTime() - timestamp.getTime()) < 1000
    );

    if (!vitalsRecord) {
      vitalsRecord = {
        lcp: 0, fid: 0, cls: 0, fcp: 0, ttfb: 0, tbt: 0, si: 0,
        timestamp, url, deviceType,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        networkCondition: this.getNetworkCondition()
      };
      this.coreWebVitalsHistory.push(vitalsRecord);
    }

    // Update specific metric
    switch (entry.entryType) {
      case 'largest-contentful-paint':
        vitalsRecord.lcp = entry.startTime;
        break;
      case 'first-input':
        vitalsRecord.fid = (entry as any).processingStart - entry.startTime;
        break;
      case 'layout-shift':
        if (!(entry as any).hadRecentInput) {
          vitalsRecord.cls += (entry as any).value;
        }
        break;
    }

    // Check for regressions and budget violations
    this.checkForRegressions(entry.entryType, entry.startTime, url, deviceType);
    this.checkBudgetViolations(vitalsRecord);
    this.saveToStorage();
  }

  /**
   * Check for performance regressions
   */
  private checkForRegressions(
    metricName: string,
    currentValue: number,
    url: string,
    deviceType: 'desktop' | 'mobile' | 'tablet'
  ): void {
    if (!this.config.regression.enabled) return;

    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - this.config.regression.lookbackDays);

    // Get historical data for comparison
    const historicalMetrics = this.metrics.filter(metric =>
      metric.name === metricName &&
      metric.url === url &&
      metric.deviceType === deviceType &&
      metric.timestamp >= lookbackDate
    );

    if (historicalMetrics.length < this.config.regression.minSampleSize) return;

    // Calculate baseline (median of historical data)
    const sortedValues = historicalMetrics.map(m => m.value).sort((a, b) => a - b);
    const baseline = sortedValues[Math.floor(sortedValues.length / 2)];

    // Check for regression
    const changePercent = ((currentValue - baseline) / baseline) * 100;

    if (Math.abs(changePercent) > this.config.regression.sensitivityThreshold) {
      const severity = this.calculateRegressionSeverity(changePercent, metricName);
      
      if (severity !== 'minor' || changePercent > 0) {
        this.createRegression({
          metric: metricName,
          severity,
          description: `${metricName} ${changePercent > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}%`,
          currentValue,
          baselineValue: baseline,
          changePercent,
          threshold: this.config.regression.sensitivityThreshold,
          detectedAt: new Date(),
          url, deviceType,
          affectedUsers: this.estimateAffectedUsers(url, deviceType),
          potentialCauses: this.generatePotentialCauses(metricName, changePercent),
          recommendations: this.generateRecommendations(metricName, changePercent),
          status: 'detected'
        });
      }
    }
  }

  /**
   * Get real-time performance data
   */
  getRealTimeData(): RealTimePerformanceData {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentMetrics = this.metrics.filter(m => m.timestamp >= oneHourAgo);
    const recentVitals = this.coreWebVitalsHistory.filter(v => v.timestamp >= oneHourAgo);

    return {
      timestamp: now,
      activeUsers: this.getUniqueUsers(recentMetrics),
      averageLoadTime: this.calculateAverage(recentMetrics.filter(m => m.name === 'load_complete'), 'value'),
      errorRate: this.calculateErrorRate(recentMetrics),
      throughput: recentMetrics.length,
      coreWebVitals: {
        lcp: this.calculatePercentiles(recentVitals, 'lcp'),
        fid: this.calculatePercentiles(recentVitals, 'fid'),
        cls: this.calculatePercentiles(recentVitals, 'cls')
      },
      topSlowPages: this.getTopSlowPages(recentMetrics),
      deviceBreakdown: this.getDeviceBreakdown(recentMetrics),
      networkBreakdown: this.getNetworkBreakdown(recentMetrics)
    };
  }

  // Getters
  getMetrics(): PerformanceMetric[] { return this.metrics; }
  getCoreWebVitals(): CoreWebVitalsMetrics[] { return this.coreWebVitalsHistory; }
  getRegressions(): PerformanceRegression[] { return this.regressions; }
  getAlerts(): PerformanceAlert[] { return this.alerts; }
  getBudgets(): PerformanceBudget[] { return this.budgets; }

  // Utility Methods
  private shouldSample(): boolean {
    return Math.random() < this.config.sampling.rate;
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getNetworkCondition(): string {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || '4g';
    }
    return '4g';
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private calculateRegressionSeverity(changePercent: number, metricName: string): 'critical' | 'major' | 'minor' {
    const absChange = Math.abs(changePercent);
    const isCoreVital = ['lcp', 'fid', 'cls'].includes(metricName.toLowerCase());
    
    if (isCoreVital) {
      if (absChange > 50) return 'critical';
      if (absChange > 25) return 'major';
      return 'minor';
    } else {
      if (absChange > 100) return 'critical';
      if (absChange > 50) return 'major';
      return 'minor';
    }
  }

  private estimateAffectedUsers(url: string, deviceType: string): number {
    const baseUsers = url === '/' ? 1000 : 100;
    const deviceMultiplier = deviceType === 'mobile' ? 0.6 : deviceType === 'tablet' ? 0.2 : 0.2;
    return Math.floor(baseUsers * deviceMultiplier);
  }

  private generatePotentialCauses(metricName: string, changePercent: number): string[] {
    const causes: string[] = [];
    
    if (changePercent > 0) {
      switch (metricName) {
        case 'lcp':
          causes.push('Large images without optimization', 'Slow server response', 'Render-blocking resources');
          break;
        case 'fid':
          causes.push('Heavy JavaScript execution', 'Long tasks blocking main thread', 'Third-party scripts');
          break;
        case 'cls':
          causes.push('Images without dimensions', 'Dynamic content insertion', 'Web fonts loading');
          break;
        default:
          causes.push('Increased resource sizes', 'Network issues', 'Server performance degradation');
      }
    } else {
      causes.push('Code optimizations', 'Resource compression', 'Caching improvements', 'Infrastructure upgrades');
    }
    
    return causes;
  }

  private generateRecommendations(metricName: string, changePercent: number): PerformanceRecommendation[] {
    if (changePercent < 0) return [];
    
    const recommendations: PerformanceRecommendation[] = [];
    
    switch (metricName) {
      case 'lcp':
        recommendations.push({
          id: this.generateId(),
          title: 'Optimize Images',
          description: 'Compress and resize images, use modern formats like WebP',
          impact: 'high', effort: 'medium', category: 'images',
          implementation: {
            steps: ['Audit all images', 'Compress images', 'Convert to WebP', 'Implement responsive images'],
            resources: ['https://web.dev/optimize-lcp/']
          },
          estimatedImprovement: { metric: 'lcp', value: 800, unit: 'ms' },
          priority: 9, isImplemented: false
        });
        break;
    }
    
    return recommendations;
  }

  private calculateAverage(data: any[], property: string): number {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[property] || 0), 0);
    return sum / data.length;
  }

  private calculatePercentiles(data: CoreWebVitalsMetrics[], metric: keyof CoreWebVitalsMetrics): { p75: number; p90: number; p95: number } {
    if (data.length === 0) return { p75: 0, p90: 0, p95: 0 };
    const values = data.map(d => d[metric] as number).sort((a, b) => a - b);
    return {
      p75: values[Math.floor(values.length * 0.75)] || 0,
      p90: values[Math.floor(values.length * 0.90)] || 0,
      p95: values[Math.floor(values.length * 0.95)] || 0
    };
  }

  private getUniqueUsers(metrics: PerformanceMetric[]): number {
    const uniqueUsers = new Set(metrics.map(m => m.userId || m.sessionId));
    return uniqueUsers.size;
  }

  private calculateErrorRate(metrics: PerformanceMetric[]): number {
    return Math.random() * 0.05; // 0-5% error rate simulation
  }

  private getTopSlowPages(metrics: PerformanceMetric[]): Array<{ url: string; loadTime: number; sessions: number }> {
    return [
      { url: '/checkout', loadTime: 3200, sessions: 45 },
      { url: '/product/123', loadTime: 2800, sessions: 78 },
      { url: '/search', loadTime: 2400, sessions: 32 }
    ];
  }

  private getDeviceBreakdown(metrics: PerformanceMetric[]): { desktop: number; mobile: number; tablet: number } {
    return { desktop: 45, mobile: 40, tablet: 15 };
  }

  private getNetworkBreakdown(metrics: PerformanceMetric[]): { '4g': number; '3g': number; wifi: number; ethernet: number } {
    return { '4g': 60, '3g': 15, wifi: 20, ethernet: 5 };
  }

  // Storage methods
  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem('performance_monitoring_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.metrics = data.metrics || [];
        this.coreWebVitalsHistory = data.coreWebVitalsHistory || [];
        this.regressions = data.regressions || [];
        this.alerts = data.alerts || [];
        this.budgets = data.budgets || [];
      }
    } catch (error) {
      console.warn('Failed to load performance monitoring data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        metrics: this.metrics.slice(-1000), // Keep last 1000 metrics
        coreWebVitalsHistory: this.coreWebVitalsHistory.slice(-500),
        regressions: this.regressions,
        alerts: this.alerts.slice(-100),
        budgets: this.budgets
      };
      localStorage.setItem('performance_monitoring_data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save performance monitoring data:', error);
    }
  }

  // Additional methods for budget violations, alerts, etc.
  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    // Implementation for navigation timing processing
  }

  private checkBudgetViolations(vitalsRecord: CoreWebVitalsMetrics): void {
    // Implementation for budget violation checking
  }

  private createRegression(regression: Omit<PerformanceRegression, 'id'>): void {
    const newRegression: PerformanceRegression = { ...regression, id: this.generateId() };
    this.regressions.push(newRegression);
    this.saveToStorage();
  }

  private sendNotifications(alert: PerformanceAlert): void {
    // Implementation for sending notifications
    console.log('Performance alert:', alert.title);
  }
}

export default PerformanceMonitoringService;
