'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AutomatedInsights } from '@/components/reporting/AutomatedInsights';
import { ReportBuilder } from '@/components/reporting/ReportBuilder';
import { ScheduledReports } from '@/components/reporting/ScheduledReports';
import { ComparativeAnalysis } from '@/components/reporting/ComparativeAnalysis';
import { PerformanceOptimizer } from '@/components/reporting/PerformanceOptimizer';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Download, 
  FileText, 
  Lightbulb, 
  RefreshCw, 
  Settings, 
  Share2, 
  TrendingUp, 
  Zap
} from 'lucide-react';

export default function ReportingDashboard() {
  const [activeTab, setActiveTab] = useState('insights');

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Advanced Reporting & Insights</h1>
        <p className="text-muted-foreground">
          Comprehensive analytics, custom reports, and performance optimization recommendations
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full sm:w-auto">
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Insights</span>
              <span className="sm:hidden">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
              <span className="sm:hidden">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Scheduled</span>
              <span className="sm:hidden">Scheduled</span>
            </TabsTrigger>
            <TabsTrigger value="comparative" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Benchmarks</span>
              <span className="sm:hidden">Benchmarks</span>
            </TabsTrigger>
            <TabsTrigger value="optimizer" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Optimizer</span>
              <span className="sm:hidden">Optimizer</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <TabsContent value="insights" className="mt-0">
            <AutomatedInsights />
          </TabsContent>
          
          <TabsContent value="reports" className="mt-0">
            <ReportBuilder />
          </TabsContent>
          
          <TabsContent value="scheduled" className="mt-0">
            <ScheduledReports />
          </TabsContent>
          
          <TabsContent value="comparative" className="mt-0">
            <ComparativeAnalysis />
          </TabsContent>
          
          <TabsContent value="optimizer" className="mt-0">
            <PerformanceOptimizer />
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Monthly Performance Summary</span>
                </div>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Customer Retention Analysis</span>
                </div>
                <span className="text-xs text-muted-foreground">1 week ago</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Conversation Metrics Report</span>
                </div>
                <span className="text-xs text-muted-foreground">2 weeks ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Weekly Performance Summary</span>
                </div>
                <span className="text-xs text-muted-foreground">Tomorrow</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Daily Conversation Metrics</span>
                </div>
                <span className="text-xs text-muted-foreground">Today</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Monthly Business Review</span>
                </div>
                <span className="text-xs text-muted-foreground">Next week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Optimize Product Recommendations</span>
                </div>
                <span className="text-xs text-green-500">High Impact</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Improve Cart Abandonment Flow</span>
                </div>
                <span className="text-xs text-green-500">High Impact</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Implement Response Caching</span>
                </div>
                <span className="text-xs text-yellow-500">Medium Impact</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
