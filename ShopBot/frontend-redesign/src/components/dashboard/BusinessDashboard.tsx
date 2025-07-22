'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalyticsVisualization } from './AnalyticsVisualization';
import { ROICalculator } from './ROICalculator';
import { PerformanceMonitor } from './PerformanceMonitor';
import { 
  BarChart3, 
  Calculator, 
  LineChart, 
  Activity, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Clock 
} from 'lucide-react';

type DashboardTab = 'overview' | 'analytics' | 'roi' | 'performance';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

function StatCard({ title, value, description, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`flex items-center mt-1 text-xs ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Intelligence Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights to optimize your customer service operations
          </p>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as DashboardTab)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="roi" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">ROI</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="overview" className="space-y-6 mt-0">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Conversations"
            value="24,892"
            description="Total customer interactions"
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            trend={{ value: "12% vs last month", positive: true }}
          />
          <StatCard
            title="Conversion Rate"
            value="8.2%"
            description="Conversations leading to purchase"
            icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
            trend={{ value: "1.8% vs last month", positive: true }}
          />
          <StatCard
            title="Revenue Impact"
            value="$128,450"
            description="Attributed to ShopBot in last 30 days"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            trend={{ value: "18% vs last month", positive: true }}
          />
          <StatCard
            title="Avg. Resolution Time"
            value="3.2 min"
            description="Time to resolve customer inquiries"
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            trend={{ value: "0.8 min vs last month", positive: true }}
          />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Conversation Analytics</CardTitle>
              <CardDescription>
                Conversation volume and outcomes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <AnalyticsVisualization />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Key performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Customer Satisfaction</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Response Accuracy</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>First Contact Resolution</span>
                    <span className="font-medium">86%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '86%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Agent Escalation Rate</span>
                    <span className="font-medium">8%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-medium mb-2">Top Conversation Topics</h4>
                  <ol className="text-sm space-y-1">
                    <li className="flex items-center justify-between">
                      <span>1. Product Information</span>
                      <span className="text-muted-foreground">32%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>2. Order Status</span>
                      <span className="text-muted-foreground">24%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>3. Returns & Refunds</span>
                      <span className="text-muted-foreground">18%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>4. Shipping Questions</span>
                      <span className="text-muted-foreground">15%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>5. Technical Support</span>
                      <span className="text-muted-foreground">11%</span>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="analytics" className="mt-0">
        <AnalyticsVisualization />
      </TabsContent>
      
      <TabsContent value="roi" className="mt-0">
        <ROICalculator />
      </TabsContent>
      
      <TabsContent value="performance" className="mt-0">
        <PerformanceMonitor />
      </TabsContent>
    </div>
  );
}
