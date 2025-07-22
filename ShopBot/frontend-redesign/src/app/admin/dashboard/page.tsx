'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PerformanceMonitoringDashboard } from '@/components/performance/PerformanceMonitoringDashboard';
import { PerformanceRegressionDashboard } from '@/components/performance/PerformanceRegressionDashboard';
import { ConversionOptimizationDashboard } from '@/components/optimization/ConversionOptimizationDashboard';
import { ProductionReadinessDashboard } from '@/components/quality/ProductionReadinessDashboard';
import { 
  BarChart3, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  Settings, 
  AlertTriangle,
  Shield,
  Users
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">ShopBot Admin Dashboard</h1>
        <Button variant="outline" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="regressions" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            <span className="hidden sm:inline">Regressions</span>
          </TabsTrigger>
          <TabsTrigger value="conversions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Conversions</span>
          </TabsTrigger>
          <TabsTrigger value="readiness" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Readiness</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92/100</div>
                <p className="text-xs text-muted-foreground">
                  +2.5% from last week
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Regressions</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  -3 from last week
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.6%</div>
                <p className="text-xs text-muted-foreground">
                  +0.8% from last week
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Production Readiness</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89/100</div>
                <p className="text-xs text-muted-foreground">
                  +5 from last week
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Key performance metrics for your application
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <PerformanceMonitoringDashboard compact={true} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Conversion Overview</CardTitle>
                <CardDescription>
                  Key conversion metrics for your application
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ConversionOptimizationDashboard compact={true} />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Production Readiness Overview</CardTitle>
                <CardDescription>
                  Current status of production readiness checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductionReadinessDashboard compact={true} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Monitoring</CardTitle>
              <CardDescription>
                Detailed performance metrics and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceMonitoringDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Regressions Tab */}
        <TabsContent value="regressions">
          <Card>
            <CardHeader>
              <CardTitle>Performance Regression Analysis</CardTitle>
              <CardDescription>
                Track and manage performance regressions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceRegressionDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Conversions Tab */}
        <TabsContent value="conversions">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Optimization</CardTitle>
              <CardDescription>
                Analyze and optimize user conversion funnels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConversionOptimizationDashboard />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Readiness Tab */}
        <TabsContent value="readiness">
          <Card>
            <CardHeader>
              <CardTitle>Production Readiness</CardTitle>
              <CardDescription>
                Validate your application's readiness for production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionReadinessDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
