'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Calendar, 
  TrendingUp, 
  Building, 
  Info, 
  Download, 
  Share2,
  RefreshCw,
  Layers
} from 'lucide-react';

// Types for comparative analysis
type MetricCategory = 'engagement' | 'conversion' | 'retention' | 'satisfaction' | 'performance';
type ComparisonType = 'industry' | 'historical' | 'competitors' | 'goals';
type TimeRange = 'last_30_days' | 'last_quarter' | 'last_year' | 'custom';

interface Metric {
  id: string;
  name: string;
  category: MetricCategory;
  value: number;
  unit: string;
  change: number;
  industryAvg?: number;
  industryTop?: number;
  historicalAvg?: number;
  benchmark?: number;
  trend: 'up' | 'down' | 'stable';
}

interface IndustrySegment {
  id: string;
  name: string;
}

// Mock data for metrics
const mockMetrics: Metric[] = [
  {
    id: 'metric-001',
    name: 'Conversation Completion Rate',
    category: 'engagement',
    value: 78.5,
    unit: '%',
    change: 3.2,
    industryAvg: 65.3,
    industryTop: 82.1,
    historicalAvg: 72.8,
    benchmark: 75,
    trend: 'up'
  },
  {
    id: 'metric-002',
    name: 'Average Response Time',
    category: 'performance',
    value: 1.8,
    unit: 'seconds',
    change: -0.3,
    industryAvg: 2.5,
    industryTop: 1.5,
    historicalAvg: 2.1,
    benchmark: 2.0,
    trend: 'up'
  },
  {
    id: 'metric-003',
    name: 'Customer Satisfaction Score',
    category: 'satisfaction',
    value: 4.7,
    unit: '/5',
    change: 0.2,
    industryAvg: 4.2,
    industryTop: 4.8,
    historicalAvg: 4.5,
    benchmark: 4.5,
    trend: 'up'
  },
  {
    id: 'metric-004',
    name: 'Conversion Rate',
    category: 'conversion',
    value: 12.3,
    unit: '%',
    change: -0.8,
    industryAvg: 10.5,
    industryTop: 15.2,
    historicalAvg: 13.1,
    benchmark: 14.0,
    trend: 'down'
  },
  {
    id: 'metric-005',
    name: 'Customer Retention Rate',
    category: 'retention',
    value: 82.1,
    unit: '%',
    change: 1.5,
    industryAvg: 75.4,
    industryTop: 88.3,
    historicalAvg: 80.6,
    benchmark: 85.0,
    trend: 'up'
  },
  {
    id: 'metric-006',
    name: 'Average Order Value',
    category: 'conversion',
    value: 68.5,
    unit: '$',
    change: 4.2,
    industryAvg: 58.7,
    industryTop: 75.3,
    historicalAvg: 64.3,
    benchmark: 70.0,
    trend: 'up'
  },
  {
    id: 'metric-007',
    name: 'Resolution Rate',
    category: 'performance',
    value: 92.3,
    unit: '%',
    change: -0.5,
    industryAvg: 88.1,
    industryTop: 94.5,
    historicalAvg: 92.8,
    benchmark: 93.0,
    trend: 'down'
  },
  {
    id: 'metric-008',
    name: 'First Contact Resolution',
    category: 'performance',
    value: 72.8,
    unit: '%',
    change: 2.1,
    industryAvg: 65.2,
    industryTop: 78.4,
    historicalAvg: 70.7,
    benchmark: 75.0,
    trend: 'up'
  }
];

// Mock data for industry segments
const industrySegments: IndustrySegment[] = [
  { id: 'retail', name: 'Retail & E-commerce' },
  { id: 'tech', name: 'Technology & SaaS' },
  { id: 'finance', name: 'Financial Services' },
  { id: 'healthcare', name: 'Healthcare' },
  { id: 'travel', name: 'Travel & Hospitality' },
  { id: 'education', name: 'Education' }
];

export function ComparativeAnalysis() {
  // State for filters
  const [selectedCategory, setSelectedCategory] = useState<MetricCategory | 'all'>('all');
  const [selectedComparison, setSelectedComparison] = useState<ComparisonType>('industry');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('last_30_days');
  const [selectedIndustry, setSelectedIndustry] = useState('retail');
  const [showTopPerformers, setShowTopPerformers] = useState(true);
  
  // Filter metrics based on selected category
  const filteredMetrics = selectedCategory === 'all' 
    ? mockMetrics 
    : mockMetrics.filter(metric => metric.category === selectedCategory);
  
  // Get time range display text
  const getTimeRangeDisplay = (range: TimeRange) => {
    switch (range) {
      case 'last_30_days':
        return 'Last 30 Days';
      case 'last_quarter':
        return 'Last Quarter';
      case 'last_year':
        return 'Last Year';
      case 'custom':
        return 'Custom Range';
    }
  };
  
  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable', isPositive: boolean) => {
    if (trend === 'up') {
      return <ArrowUp className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />;
    } else if (trend === 'down') {
      return <ArrowDown className={`h-4 w-4 ${isPositive ? 'text-red-500' : 'text-green-500'}`} />;
    } else {
      return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  // Check if trend is positive (depends on the metric)
  const isTrendPositive = (metric: Metric) => {
    // For response time, lower is better
    if (metric.name.toLowerCase().includes('time')) {
      return metric.trend === 'down';
    }
    // For most other metrics, higher is better
    return metric.trend === 'up';
  };
  
  // Get comparison value based on selected comparison type
  const getComparisonValue = (metric: Metric) => {
    switch (selectedComparison) {
      case 'industry':
        return showTopPerformers ? metric.industryTop : metric.industryAvg;
      case 'historical':
        return metric.historicalAvg;
      case 'goals':
        return metric.benchmark;
      default:
        return metric.industryAvg;
    }
  };
  
  // Get comparison label
  const getComparisonLabel = () => {
    switch (selectedComparison) {
      case 'industry':
        return showTopPerformers ? 'Industry Top 10%' : 'Industry Average';
      case 'historical':
        return 'Your Historical Average';
      case 'competitors':
        return 'Direct Competitors';
      case 'goals':
        return 'Your Goals';
    }
  };
  
  // Calculate performance difference
  const getPerformanceDiff = (metric: Metric) => {
    const comparisonValue = getComparisonValue(metric);
    if (!comparisonValue) return 0;
    
    // For time metrics, lower is better
    if (metric.name.toLowerCase().includes('time')) {
      return ((comparisonValue - metric.value) / comparisonValue) * 100;
    }
    
    // For other metrics, higher is better
    return ((metric.value - comparisonValue) / comparisonValue) * 100;
  };
  
  // Format performance difference
  const formatPerformanceDiff = (diff: number) => {
    return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  };
  
  // Determine performance class
  const getPerformanceClass = (diff: number) => {
    if (diff > 5) return 'text-green-500';
    if (diff < -5) return 'text-red-500';
    return 'text-yellow-500';
  };
  
  return (
    <Card className="w-full" data-testid="comparative-analysis">
      <CardHeader>
        <CardTitle>Comparative Analysis</CardTitle>
        <CardDescription>
          Benchmark your performance against industry standards, historical data, and goals
        </CardDescription>
        
        <div className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="comparison-type" className="mb-2 block">Compare Against</Label>
              <Select 
                value={selectedComparison}
                onValueChange={(value) => setSelectedComparison(value as ComparisonType)}
              >
                <SelectTrigger id="comparison-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industry">Industry Benchmarks</SelectItem>
                  <SelectItem value="historical">Historical Performance</SelectItem>
                  <SelectItem value="competitors">Direct Competitors</SelectItem>
                  <SelectItem value="goals">Your Goals</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="time-range" className="mb-2 block">Time Range</Label>
              <Select 
                value={selectedTimeRange}
                onValueChange={(value) => setSelectedTimeRange(value as TimeRange)}
              >
                <SelectTrigger id="time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_quarter">Last Quarter</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedComparison === 'industry' && (
              <div className="flex-1">
                <Label htmlFor="industry-segment" className="mb-2 block">Industry Segment</Label>
                <Select 
                  value={selectedIndustry}
                  onValueChange={setSelectedIndustry}
                >
                  <SelectTrigger id="industry-segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industrySegments.map(segment => (
                      <SelectItem key={segment.id} value={segment.id}>
                        {segment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                All Metrics
              </Button>
              <Button 
                variant={selectedCategory === 'engagement' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('engagement')}
              >
                Engagement
              </Button>
              <Button 
                variant={selectedCategory === 'conversion' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('conversion')}
              >
                Conversion
              </Button>
              <Button 
                variant={selectedCategory === 'retention' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('retention')}
              >
                Retention
              </Button>
              <Button 
                variant={selectedCategory === 'satisfaction' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('satisfaction')}
              >
                Satisfaction
              </Button>
              <Button 
                variant={selectedCategory === 'performance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('performance')}
              >
                Performance
              </Button>
            </div>
            
            {selectedComparison === 'industry' && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="top-performers"
                  checked={showTopPerformers}
                  onCheckedChange={setShowTopPerformers}
                />
                <Label htmlFor="top-performers">Show Top Performers</Label>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal">
              <Calendar className="h-3 w-3 mr-1" />
              {getTimeRangeDisplay(selectedTimeRange)}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {selectedCategory === 'all' ? 'All Metrics' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Metrics`}
            </Badge>
            {selectedComparison === 'industry' && (
              <Badge variant="outline" className="font-normal">
                <Building className="h-3 w-3 mr-1" />
                {industrySegments.find(s => s.id === selectedIndustry)?.name}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMetrics.map(metric => {
            const performanceDiff = getPerformanceDiff(metric);
            const performanceClass = getPerformanceClass(performanceDiff);
            
            return (
              <Card key={metric.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <Badge variant="outline" className="font-normal capitalize">
                      {metric.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.trend, isTrendPositive(metric))}
                      <span className={isTrendPositive(metric) ? 'text-green-500' : 'text-red-500'}>
                        {metric.change > 0 ? '+' : ''}{metric.change}{metric.unit}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{metric.name}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Performance</p>
                      <p className="text-2xl font-bold">{metric.value}{metric.unit}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">{getComparisonLabel()}</p>
                      <p className="text-2xl font-semibold text-muted-foreground">
                        {getComparisonValue(metric)}{metric.unit}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm font-medium">Performance Difference</p>
                    <p className={`text-sm font-bold ${performanceClass}`}>
                      {formatPerformanceDiff(performanceDiff)}
                    </p>
                  </div>
                  
                  <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${performanceDiff > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(performanceDiff) * 2, 100)}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {filteredMetrics.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No metrics found for the selected category.</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col items-start">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <p>
            Industry benchmarks are updated quarterly based on aggregated anonymous data from similar businesses.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
