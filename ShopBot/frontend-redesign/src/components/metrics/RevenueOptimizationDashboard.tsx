'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';

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

export function RevenueOptimizationDashboard() {
  // Sample data - in a real implementation, this would come from an API
  const conversionRateData = {
    title: "Conversion Rate",
    value: "3.2%",
    description: "Statistical significance: 95%",
    trend: 0.12, // 12% improvement
    icon: <ShoppingCart className="h-4 w-4" />
  };
  
  const lifetimeValueData = {
    title: "Customer Lifetime Value",
    value: formatCurrency(342),
    description: "Through improved UX",
    trend: 0.08, // 8% improvement
    icon: <Users className="h-4 w-4" />
  };
  
  const retentionRateData = {
    title: "Retention Rate",
    value: "68%",
    description: "Enhanced engagement",
    trend: 0.15, // 15% improvement
    icon: <Users className="h-4 w-4" />
  };
  
  const revenuePerUserData = {
    title: "Avg. Revenue Per User",
    value: formatCurrency(58.42),
    description: "Optimized upgrade paths",
    trend: 0.23, // 23% improvement
    icon: <DollarSign className="h-4 w-4" />
  };

  // Sample chart data
  const conversionTrendData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Before Redesign",
        data: [1.8, 1.9, 2.0, 1.8, 1.9, 2.1],
        borderColor: "rgba(156, 163, 175, 0.5)",
        backgroundColor: "rgba(156, 163, 175, 0.1)",
      },
      {
        label: "After Redesign",
        data: [2.1, 2.4, 2.7, 2.9, 3.1, 3.2],
        borderColor: "rgba(59, 130, 246, 0.5)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
      }
    ]
  };
  
  const lifetimeValueSegments = {
    labels: ["New Customers", "Returning", "Loyal", "VIP"],
    datasets: [
      {
        data: [120, 210, 350, 690],
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)",
          "rgba(16, 185, 129, 0.6)",
          "rgba(245, 158, 11, 0.6)",
          "rgba(239, 68, 68, 0.6)"
        ]
      }
    ]
  };
  
  const revenueByChannelData = {
    labels: ["Direct", "Organic", "Referral", "Social", "Email"],
    datasets: [
      {
        label: "Revenue",
        data: [12500, 8700, 6500, 5200, 9800],
        backgroundColor: "rgba(59, 130, 246, 0.6)"
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Revenue Optimization Metrics</h2>
        <p className="text-muted-foreground">
          Track the impact of the redesign on key business metrics with statistical significance.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard {...conversionRateData} />
        <MetricCard {...lifetimeValueData} />
        <MetricCard {...retentionRateData} />
        <MetricCard {...revenuePerUserData} />
      </div>
      
      <Tabs defaultValue="conversion">
        <TabsList>
          <TabsTrigger value="conversion">Conversion Trends</TabsTrigger>
          <TabsTrigger value="lifetime">Lifetime Value</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Channels</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Improvement</CardTitle>
              <CardDescription>
                Statistical analysis of conversion rate improvements since redesign implementation
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <LineChart data={conversionTrendData} />
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Statistical Significance</CardTitle>
                <CardDescription>A/B test results validation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>p-value</span>
                    <Badge variant="outline">0.023</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Confidence interval</span>
                    <Badge variant="outline">95%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Sample size</span>
                    <Badge variant="outline">12,458 visitors</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Effect size</span>
                    <Badge variant="outline">+1.1% absolute</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Step-by-step conversion improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Visit → Product View</span>
                    <Badge className="bg-green-500">+18%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Product View → Add to Cart</span>
                    <Badge className="bg-green-500">+24%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Add to Cart → Checkout</span>
                    <Badge className="bg-green-500">+15%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Checkout → Purchase</span>
                    <Badge className="bg-green-500">+9%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="lifetime">
          <Card>
            <CardHeader>
              <CardTitle>Customer Lifetime Value by Segment</CardTitle>
              <CardDescription>
                Enhanced user experience impact on customer value across segments
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <PieChart data={lifetimeValueSegments} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Channel</CardTitle>
              <CardDescription>
                Distribution of revenue across acquisition channels
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <BarChart data={revenueByChannelData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
