'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, PieChart } from '@/components/ui/charts';

type ChartType = 'line' | 'bar' | 'pie';
type TimeRange = '7d' | '30d' | '90d' | 'all';

// Mock data - would be replaced with real API calls in production
const mockChartData = {
  line: {
    '7d': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Conversations',
          data: [65, 78, 52, 91, 83, 56, 89],
          borderColor: 'rgba(59, 130, 246, 0.8)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
        },
        {
          label: 'Resolved Issues',
          data: [42, 58, 37, 76, 63, 41, 67],
          borderColor: 'rgba(16, 185, 129, 0.8)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
        }
      ]
    },
    '30d': {
      labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
      datasets: [
        {
          label: 'Conversations',
          data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 50),
          borderColor: 'rgba(59, 130, 246, 0.8)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
        },
        {
          label: 'Resolved Issues',
          data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 80) + 30),
          borderColor: 'rgba(16, 185, 129, 0.8)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
        }
      ]
    },
    '90d': {
      labels: Array.from({ length: 12 }, (_, i) => `Week ${i + 1}`),
      datasets: [
        {
          label: 'Conversations',
          data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 700) + 300),
          borderColor: 'rgba(59, 130, 246, 0.8)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
        },
        {
          label: 'Resolved Issues',
          data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 500) + 200),
          borderColor: 'rgba(16, 185, 129, 0.8)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
        }
      ]
    },
    'all': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Conversations',
          data: [2100, 1900, 2300, 2800, 3100, 2950, 3300, 3500, 3200, 3800, 4100, 4300],
          borderColor: 'rgba(59, 130, 246, 0.8)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
        },
        {
          label: 'Resolved Issues',
          data: [1700, 1500, 1900, 2200, 2500, 2400, 2700, 2900, 2600, 3100, 3400, 3600],
          borderColor: 'rgba(16, 185, 129, 0.8)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
        }
      ]
    }
  },
  bar: {
    '7d': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Response Time (sec)',
          data: [2.3, 1.8, 2.1, 1.5, 1.9, 2.0, 1.7],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        },
        {
          label: 'Resolution Time (min)',
          data: [4.5, 3.8, 4.2, 3.1, 3.7, 4.0, 3.5],
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        }
      ]
    },
    '30d': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Response Time (sec)',
          data: [2.0, 1.9, 1.7, 1.6],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        },
        {
          label: 'Resolution Time (min)',
          data: [4.1, 3.9, 3.6, 3.3],
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        }
      ]
    },
    '90d': {
      labels: ['Month 1', 'Month 2', 'Month 3'],
      datasets: [
        {
          label: 'Response Time (sec)',
          data: [1.9, 1.7, 1.5],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        },
        {
          label: 'Resolution Time (min)',
          data: [3.8, 3.5, 3.1],
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        }
      ]
    },
    'all': {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Response Time (sec)',
          data: [2.2, 1.9, 1.7, 1.5],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
        },
        {
          label: 'Resolution Time (min)',
          data: [4.5, 3.8, 3.4, 3.0],
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
        }
      ]
    }
  },
  pie: {
    '7d': {
      labels: ['Product Questions', 'Order Status', 'Returns', 'Shipping', 'Other'],
      datasets: [
        {
          data: [35, 25, 15, 18, 7],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(244, 63, 94, 0.8)'
          ],
        }
      ]
    },
    '30d': {
      labels: ['Product Questions', 'Order Status', 'Returns', 'Shipping', 'Other'],
      datasets: [
        {
          data: [33, 27, 16, 17, 7],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(244, 63, 94, 0.8)'
          ],
        }
      ]
    },
    '90d': {
      labels: ['Product Questions', 'Order Status', 'Returns', 'Shipping', 'Other'],
      datasets: [
        {
          data: [31, 28, 17, 16, 8],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(244, 63, 94, 0.8)'
          ],
        }
      ]
    },
    'all': {
      labels: ['Product Questions', 'Order Status', 'Returns', 'Shipping', 'Other'],
      datasets: [
        {
          data: [30, 29, 18, 15, 8],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(244, 63, 94, 0.8)'
          ],
        }
      ]
    }
  }
};

export function AnalyticsVisualization() {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  
  // This would be replaced with real data fetching in production
  const chartData = mockChartData[chartType][timeRange];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Analytics Visualization</CardTitle>
        <CardDescription>
          Interactive data visualization with real-time updates
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Tabs 
            value={chartType} 
            onValueChange={(value) => setChartType(value as ChartType)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="bar">Bar</TabsTrigger>
              <TabsTrigger value="pie">Pie</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs 
            value={timeRange} 
            onValueChange={(value) => setTimeRange(value as TimeRange)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80">
          {chartType === 'line' && <LineChart data={chartData} />}
          {chartType === 'bar' && <BarChart data={chartData} />}
          {chartType === 'pie' && <PieChart data={chartData} />}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="font-medium">Key Insights:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Customer inquiries peak on Mondays and Fridays</li>
            <li>Average response time improved by 23% over the last month</li>
            <li>Product questions remain the most common inquiry type</li>
            <li>Resolution rates have improved consistently quarter over quarter</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
