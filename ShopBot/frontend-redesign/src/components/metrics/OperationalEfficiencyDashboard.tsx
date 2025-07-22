'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, RadarChart } from '@/components/charts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, MessageCircle, AlertCircle, ThumbsUp } from 'lucide-react';
import { formatPercentage } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  trend: number;
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, description, trend, icon }: MetricCardProps) => {
  const isPositive = trend >= 0;
  const isPositiveDesired = title !== 'Error Rate' && title !== 'Response Time';
  const isGood = (isPositive && isPositiveDesired) || (!isPositive && !isPositiveDesired);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="mt-2 flex items-center text-xs">
          {isPositive ? <TrendingUp className="h-3 w-3 mr-1" style={{ color: isGood ? 'green' : 'red' }} /> : 
                       <TrendingDown className="h-3 w-3 mr-1" style={{ color: isGood ? 'green' : 'red' }} />}
          <span style={{ color: isGood ? 'green' : 'red' }}>
            {isPositive ? "+" : ""}{formatPercentage(trend)}
          </span>
          <span className="text-muted-foreground ml-1">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
};

export function OperationalEfficiencyDashboard() {
  // Sample data - in a real implementation, this would come from an API
  const automationEffectivenessData = {
    title: "Automation Effectiveness",
    value: "78%",
    description: "Customer support automation",
    trend: 0.23, // 23% improvement
    icon: <MessageCircle className="h-4 w-4" />
  };
  
  const responseTimeData = {
    title: "Response Time",
    value: "1.8s",
    description: "Average response time",
    trend: -0.35, // 35% reduction (improvement)
    icon: <Clock className="h-4 w-4" />
  };
  
  const errorRateData = {
    title: "Error Rate",
    value: "0.8%",
    description: "System reliability",
    trend: -0.42, // 42% reduction (improvement)
    icon: <AlertCircle className="h-4 w-4" />
  };
  
  const satisfactionData = {
    title: "User Satisfaction",
    value: "4.7/5",
    description: "Interface design rating",
    trend: 0.15, // 15% improvement
    icon: <ThumbsUp className="h-4 w-4" />
  };

  // Sample chart data
  const responseTimeTrendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Before Redesign",
        data: [3.2, 3.1, 3.3, 3.0, 3.2, 3.1],
        borderColor: "rgba(156, 163, 175, 0.5)",
        backgroundColor: "rgba(156, 163, 175, 0.1)",
      },
      {
        label: "After Redesign",
        data: [3.0, 2.7, 2.3, 2.0, 1.9, 1.8],
        borderColor: "rgba(59, 130, 246, 0.5)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
      }
    ]
  };
  
  const automationEffectivenessData2 = {
    labels: ["FAQ Resolution", "Order Status", "Product Info", "Returns", "Shipping", "Payment Issues"],
    datasets: [
      {
        label: "Before Redesign",
        data: [45, 60, 55, 40, 65, 35],
        backgroundColor: "rgba(156, 163, 175, 0.5)",
      },
      {
        label: "After Redesign",
        data: [75, 82, 70, 65, 80, 72],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      }
    ]
  };
  
  const userSatisfactionRadarData = {
    labels: [
      'Ease of Use',
      'Visual Design',
      'Speed',
      'Reliability',
      'Features',
      'Support'
    ],
    datasets: [
      {
        label: 'Before Redesign',
        data: [3.5, 3.2, 2.8, 3.6, 3.9, 3.4],
        fill: true,
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        borderColor: 'rgba(156, 163, 175, 0.7)',
        pointBackgroundColor: 'rgba(156, 163, 175, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(156, 163, 175, 1)'
      },
      {
        label: 'After Redesign',
        data: [4.5, 4.8, 4.6, 4.7, 4.5, 4.9],
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 0.7)',
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Operational Efficiency Metrics</h2>
        <p className="text-muted-foreground">
          Track improvements in operational efficiency and system performance.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard {...automationEffectivenessData} />
        <MetricCard {...responseTimeData} />
        <MetricCard {...errorRateData} />
        <MetricCard {...satisfactionData} />
      </div>
      
      <Tabs defaultValue="response">
        <TabsList>
          <TabsTrigger value="response">Response Time</TabsTrigger>
          <TabsTrigger value="automation">Automation Effectiveness</TabsTrigger>
          <TabsTrigger value="satisfaction">User Satisfaction</TabsTrigger>
        </TabsList>
        
        <TabsContent value="response" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Time Improvement</CardTitle>
              <CardDescription>
                Average response time across all customer interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <LineChart data={responseTimeTrendData} />
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Breakdown</CardTitle>
                <CardDescription>By interaction type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Initial Load</span>
                    <Badge className="bg-green-500">0.8s</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>User Input Processing</span>
                    <Badge className="bg-green-500">0.3s</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Response</span>
                    <Badge className="bg-green-500">0.5s</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rendering</span>
                    <Badge className="bg-green-500">0.2s</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Improvements</CardTitle>
                <CardDescription>Key optimizations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Code Splitting</span>
                    <Badge variant="outline">-42%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Image Optimization</span>
                    <Badge variant="outline">-38%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Caching</span>
                    <Badge variant="outline">-35%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Component Optimization</span>
                    <Badge variant="outline">-28%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Customer Support Automation Effectiveness</CardTitle>
              <CardDescription>
                Percentage of customer inquiries successfully handled by automation
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <BarChart data={automationEffectivenessData2} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="satisfaction">
          <Card>
            <CardHeader>
              <CardTitle>User Satisfaction Metrics</CardTitle>
              <CardDescription>
                Comparison of user satisfaction across different aspects
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <RadarChart data={userSatisfactionRadarData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
