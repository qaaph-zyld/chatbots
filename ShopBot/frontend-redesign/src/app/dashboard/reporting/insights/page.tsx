'use client';

import React from 'react';
import { AutomatedInsights } from '@/components/reporting/AutomatedInsights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Download, 
  RefreshCw,
  Settings,
  Filter
} from 'lucide-react';

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automated Insights</h1>
          <p className="text-muted-foreground">
            AI-generated insights and recommendations based on your ShopBot data
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+8 from previous period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trends</CardTitle>
            <CardDescription>Identified patterns</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">7</div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
            <CardDescription>Detected issues</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">3</div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <CardDescription>Growth potential</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-bold">14</div>
            <Lightbulb className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Insights</TabsTrigger>
          <TabsTrigger value="high_priority">High Priority</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <AutomatedInsights />
        </TabsContent>
        
        <TabsContent value="high_priority" className="mt-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle>High Priority Insights</CardTitle>
              <CardDescription>
                Critical insights that require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                High priority insights will appear here when detected.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="saved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Insights</CardTitle>
              <CardDescription>
                Insights you've marked for future reference
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                No saved insights yet. Save insights by clicking the bookmark icon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
