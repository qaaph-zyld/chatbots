'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

type MetricType = 'response' | 'accuracy' | 'satisfaction';

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  previous: number;
  status: 'success' | 'warning' | 'danger' | 'neutral';
  unit: string;
}

// Mock data - would be replaced with real API calls in production
const mockMetrics = {
  response: [
    {
      name: 'Average Response Time',
      value: 1.8,
      target: 2.0,
      previous: 2.3,
      status: 'success',
      unit: 'seconds'
    },
    {
      name: 'First Reply Time',
      value: 12,
      target: 10,
      previous: 15,
      status: 'warning',
      unit: 'seconds'
    },
    {
      name: 'Resolution Time',
      value: 3.2,
      target: 3.0,
      previous: 4.1,
      status: 'warning',
      unit: 'minutes'
    },
    {
      name: 'Handling Capacity',
      value: 95,
      target: 90,
      previous: 85,
      status: 'success',
      unit: 'conversations/hour'
    }
  ],
  accuracy: [
    {
      name: 'Intent Recognition',
      value: 94,
      target: 95,
      previous: 91,
      status: 'success',
      unit: '%'
    },
    {
      name: 'Answer Accuracy',
      value: 92,
      target: 95,
      previous: 89,
      status: 'warning',
      unit: '%'
    },
    {
      name: 'Contextual Understanding',
      value: 88,
      target: 90,
      previous: 82,
      status: 'warning',
      unit: '%'
    },
    {
      name: 'Product Knowledge',
      value: 96,
      target: 95,
      previous: 94,
      status: 'success',
      unit: '%'
    }
  ],
  satisfaction: [
    {
      name: 'Customer Satisfaction',
      value: 4.7,
      target: 4.5,
      previous: 4.3,
      status: 'success',
      unit: '/5'
    },
    {
      name: 'Issue Resolution Rate',
      value: 92,
      target: 95,
      previous: 88,
      status: 'warning',
      unit: '%'
    },
    {
      name: 'Customer Effort Score',
      value: 1.8,
      target: 2.0,
      previous: 2.3,
      status: 'success',
      unit: '/5 (lower is better)'
    },
    {
      name: 'Net Promoter Score',
      value: 68,
      target: 65,
      previous: 61,
      status: 'success',
      unit: 'NPS'
    }
  ]
};

export function PerformanceMonitor() {
  const [metricType, setMetricType] = useState<MetricType>('response');
  
  // This would be replaced with real data fetching in production
  const metrics = mockMetrics[metricType];
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'danger':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };
  
  const getStatusBadge = (metric: PerformanceMetric) => {
    const isImproved = metric.value > metric.previous;
    const percentChange = Math.abs(((metric.value - metric.previous) / metric.previous) * 100).toFixed(1);
    
    // For metrics where lower is better (like response time)
    const isLowerBetter = metric.name.includes('Time') || metric.name.includes('Effort');
    const isPositiveChange = isLowerBetter ? !isImproved : isImproved;
    
    return (
      <Badge variant={isPositiveChange ? 'success' : 'destructive'} className="ml-2">
        {isPositiveChange ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
        {percentChange}%
      </Badge>
    );
  };
  
  const getProgressValue = (metric: PerformanceMetric) => {
    // For metrics where lower is better (like response time)
    const isLowerBetter = metric.name.includes('Time') || metric.name.includes('Effort');
    
    if (isLowerBetter) {
      // If current value is below target (good), show 100%
      // Otherwise show percentage of how close we are to target
      return metric.value <= metric.target 
        ? 100 
        : 100 - ((metric.value - metric.target) / metric.target * 100);
    } else {
      // For regular metrics where higher is better
      return (metric.value / metric.target) * 100;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'danger':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Performance Monitor</CardTitle>
        <CardDescription>
          Real-time performance metrics and KPI tracking
        </CardDescription>
        
        <Tabs 
          value={metricType} 
          onValueChange={(value) => setMetricType(value as MetricType)}
          className="mt-4"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="response">Response</TabsTrigger>
            <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
            <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(metric.status)}
                  <span className="ml-2 font-medium">{metric.name}</span>
                  {getStatusBadge(metric)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Target: {metric.target}{metric.unit}</span>
                  <span className="font-bold">{metric.value}{metric.unit}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Progress 
                  value={getProgressValue(metric)} 
                  className="h-2 flex-1"
                  indicatorClassName={getStatusColor(metric.status)}
                />
                <span className="text-xs w-12 text-right">
                  {getProgressValue(metric).toFixed(0)}%
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {metric.status === 'success' 
                  ? 'Meeting or exceeding target' 
                  : metric.status === 'warning'
                    ? 'Near target, needs attention'
                    : 'Below target, requires immediate action'
                }
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-2">Performance Summary</h4>
            <p className="text-sm text-muted-foreground">
              {metricType === 'response' && 'Response metrics are trending positively with a 12% improvement in average response time over the last 30 days.'}
              {metricType === 'accuracy' && 'Accuracy metrics show steady improvement with intent recognition and product knowledge exceeding targets.'}
              {metricType === 'satisfaction' && 'Customer satisfaction scores continue to improve, with NPS increasing by 7 points in the last quarter.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
