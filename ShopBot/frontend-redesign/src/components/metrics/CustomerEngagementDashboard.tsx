'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, PieChart, HeatMap } from '@/components/charts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Repeat, Heart, Activity } from 'lucide-react';
import { formatPercentage, formatNumber } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  trend: number;
  icon: React.ReactNode;
}

const MetricCard = ({ title, value, description, trend, icon }: MetricCardProps) => {
  const isPositive = trend >= 0;
  
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
          {isPositive ? <TrendingUp className="h-3 w-3 text-green-500 mr-1" /> : <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
          <span className={isPositive ? "text-green-500" : "text-red-500"}>
            {isPositive ? "+" : ""}{formatPercentage(trend)}
          </span>
          <span className="text-muted-foreground ml-1">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
};

export function CustomerEngagementDashboard() {
  // Sample data - in a real implementation, this would come from an API
  const activeUsersData = {
    title: "Active Users",
    value: formatNumber(12458),
    description: "Monthly active users",
    trend: 0.18, // 18% improvement
    icon: <Users className="h-4 w-4" />
  };
  
  const sessionDurationData = {
    title: "Session Duration",
    value: "8:24",
    description: "Average time on site",
    trend: 0.32, // 32% improvement
    icon: <Activity className="h-4 w-4" />
  };
  
  const returnRateData = {
    title: "Return Rate",
    value: "68%",
    description: "Users returning within 7 days",
    trend: 0.15, // 15% improvement
    icon: <Repeat className="h-4 w-4" />
  };
  
  const engagementScoreData = {
    title: "Engagement Score",
    value: "7.8/10",
    description: "Based on interaction depth",
    trend: 0.25, // 25% improvement
    icon: <Heart className="h-4 w-4" />
  };

  // Sample chart data
  const userActivityTrendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Before Redesign",
        data: [7800, 8200, 7900, 8100, 8300, 8500],
        borderColor: "rgba(156, 163, 175, 0.5)",
        backgroundColor: "rgba(156, 163, 175, 0.1)",
      },
      {
        label: "After Redesign",
        data: [8500, 9200, 10100, 10800, 11500, 12458],
        borderColor: "rgba(59, 130, 246, 0.5)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
      }
    ]
  };
  
  const engagementByFeatureData = {
    labels: ["Product Search", "Chatbot", "Reviews", "Recommendations", "Checkout", "Account"],
    datasets: [
      {
        label: "Before Redesign",
        data: [65, 45, 52, 38, 72, 35],
        backgroundColor: "rgba(156, 163, 175, 0.5)",
      },
      {
        label: "After Redesign",
        data: [78, 82, 68, 75, 85, 62],
        backgroundColor: "rgba(59, 130, 246, 0.5)",
      }
    ]
  };
  
  const userSegmentationData = {
    labels: ["New Users", "Occasional", "Regular", "Power Users"],
    datasets: [
      {
        data: [25, 32, 28, 15],
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)",
          "rgba(16, 185, 129, 0.6)",
          "rgba(245, 158, 11, 0.6)",
          "rgba(239, 68, 68, 0.6)"
        ]
      }
    ]
  };
  
  // Sample heatmap data for user activity by hour and day
  const activityHeatmapData = {
    label: 'User Activity',
    xLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    yLabels: ['12am', '4am', '8am', '12pm', '4pm', '8pm'],
    values: [
      { x: 'Mon', y: '12am', v: 10 },
      { x: 'Mon', y: '4am', v: 5 },
      { x: 'Mon', y: '8am', v: 25 },
      { x: 'Mon', y: '12pm', v: 65 },
      { x: 'Mon', y: '4pm', v: 85 },
      { x: 'Mon', y: '8pm', v: 45 },
      
      { x: 'Tue', y: '12am', v: 12 },
      { x: 'Tue', y: '4am', v: 6 },
      { x: 'Tue', y: '8am', v: 30 },
      { x: 'Tue', y: '12pm', v: 68 },
      { x: 'Tue', y: '4pm', v: 90 },
      { x: 'Tue', y: '8pm', v: 50 },
      
      { x: 'Wed', y: '12am', v: 15 },
      { x: 'Wed', y: '4am', v: 8 },
      { x: 'Wed', y: '8am', v: 35 },
      { x: 'Wed', y: '12pm', v: 72 },
      { x: 'Wed', y: '4pm', v: 88 },
      { x: 'Wed', y: '8pm', v: 55 },
      
      { x: 'Thu', y: '12am', v: 14 },
      { x: 'Thu', y: '4am', v: 7 },
      { x: 'Thu', y: '8am', v: 32 },
      { x: 'Thu', y: '12pm', v: 70 },
      { x: 'Thu', y: '4pm', v: 92 },
      { x: 'Thu', y: '8pm', v: 52 },
      
      { x: 'Fri', y: '12am', v: 16 },
      { x: 'Fri', y: '4am', v: 9 },
      { x: 'Fri', y: '8am', v: 38 },
      { x: 'Fri', y: '12pm', v: 75 },
      { x: 'Fri', y: '4pm', v: 95 },
      { x: 'Fri', y: '8pm', v: 60 },
      
      { x: 'Sat', y: '12am', v: 25 },
      { x: 'Sat', y: '4am', v: 15 },
      { x: 'Sat', y: '8am', v: 45 },
      { x: 'Sat', y: '12pm', v: 80 },
      { x: 'Sat', y: '4pm', v: 100 },
      { x: 'Sat', y: '8pm', v: 75 },
      
      { x: 'Sun', y: '12am', v: 22 },
      { x: 'Sun', y: '4am', v: 12 },
      { x: 'Sun', y: '8am', v: 40 },
      { x: 'Sun', y: '12pm', v: 78 },
      { x: 'Sun', y: '4pm', v: 90 },
      { x: 'Sun', y: '8pm', v: 65 },
    ],
    min: 5,
    max: 100
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customer Engagement Analytics</h2>
        <p className="text-muted-foreground">
          Track user engagement metrics and behavioral patterns.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard {...activeUsersData} />
        <MetricCard {...sessionDurationData} />
        <MetricCard {...returnRateData} />
        <MetricCard {...engagementScoreData} />
      </div>
      
      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="features">Feature Engagement</TabsTrigger>
          <TabsTrigger value="segments">User Segmentation</TabsTrigger>
          <TabsTrigger value="heatmap">Activity Heatmap</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Active Users</CardTitle>
              <CardDescription>
                Growth in active user base since redesign implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <LineChart data={userActivityTrendData} />
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Key engagement indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Pages per Session</span>
                    <Badge className="bg-green-500">5.8</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bounce Rate</span>
                    <Badge className="bg-green-500">24%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Interaction Rate</span>
                    <Badge className="bg-green-500">72%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Social Shares</span>
                    <Badge className="bg-green-500">+35%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Retention Cohorts</CardTitle>
                <CardDescription>User retention by cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Week 1</span>
                    <Badge variant="outline">68%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Week 2</span>
                    <Badge variant="outline">52%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Week 4</span>
                    <Badge variant="outline">45%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Week 8</span>
                    <Badge variant="outline">38%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Engagement</CardTitle>
              <CardDescription>
                User engagement across key features
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <BarChart data={engagementByFeatureData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>User Segmentation</CardTitle>
              <CardDescription>
                Distribution of users by engagement level
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <PieChart data={userSegmentationData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Activity Heatmap</CardTitle>
              <CardDescription>
                User activity patterns by day and time
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <HeatMap data={activityHeatmapData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
