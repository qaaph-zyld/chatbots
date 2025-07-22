'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { RevenueOptimizationDashboard } from '@/components/metrics/RevenueOptimizationDashboard';
import { OperationalEfficiencyDashboard } from '@/components/metrics/OperationalEfficiencyDashboard';
import { CustomerEngagementDashboard } from '@/components/metrics/CustomerEngagementDashboard';
import { Button } from '@/components/ui/button';
import { Download, Share2, RefreshCw } from 'lucide-react';

export default function MetricsDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const handleExport = () => {
    // In a real implementation, this would generate a PDF or CSV export
    alert('Exporting dashboard data...');
  };

  const handleShare = () => {
    // In a real implementation, this would open a share dialog
    alert('Share dashboard link copied to clipboard');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Impact Metrics</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics dashboard showing the business impact of your ShopBot implementation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue Optimization</TabsTrigger>
          <TabsTrigger value="operational">Operational Efficiency</TabsTrigger>
          <TabsTrigger value="engagement">Customer Engagement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <RevenueOptimizationDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="operational" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <OperationalEfficiencyDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <CustomerEngagementDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="text-xs text-muted-foreground text-center pt-4">
        <p>Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>Data shown represents performance metrics with 95% statistical confidence</p>
      </div>
    </div>
  );
}
