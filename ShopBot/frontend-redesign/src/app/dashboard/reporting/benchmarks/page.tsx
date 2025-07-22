'use client';

import React from 'react';
import { ComparativeAnalysis } from '@/components/reporting/ComparativeAnalysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  BarChart3, 
  Settings, 
  RefreshCw, 
  Download,
  Globe,
  Building,
  ShoppingBag,
  Users,
  Info
} from 'lucide-react';

export default function BenchmarksPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comparative Analysis</h1>
          <p className="text-muted-foreground">
            Compare your performance against industry benchmarks and competitors
          </p>
        </div>
        
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
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Industry Position</CardTitle>
            <CardDescription>Overall ranking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">Top 15%</div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Above Average</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Improved from top 22% last quarter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <CardDescription>vs. Industry Average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">+12%</div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Industry avg: 2.8% | Your rate: 3.14%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
            <CardDescription>vs. Industry Average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">+8%</div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Industry avg: 42% | Your rate: 45.4%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <CardDescription>vs. Industry Average</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">-15%</div>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Industry avg: 2.4s | Your time: 2.04s</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="industry">
        <TabsList>
          <TabsTrigger value="industry" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Industry Benchmarks
          </TabsTrigger>
          <TabsTrigger value="competitors" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Competitor Analysis
          </TabsTrigger>
          <TabsTrigger value="historical" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Historical Comparison
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="industry" className="mt-6">
          <ComparativeAnalysis />
        </TabsContent>
        
        <TabsContent value="competitors" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Competitor Analysis</CardTitle>
                <CardDescription>
                  Compare your performance against direct competitors
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-1" />
                Add Competitor
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Add competitors to see how your ShopBot performance compares. Data is anonymized and aggregated.
                    </p>
                  </div>
                </div>
                
                <div className="border rounded-md p-6 flex items-center justify-center">
                  <div className="text-center">
                    <Building className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />
                    <h3 className="font-medium mb-1">No competitors added yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add competitors to compare performance metrics
                    </p>
                    <Button>
                      <Users className="h-4 w-4 mr-1" />
                      Add Competitor
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="historical" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historical Comparison</CardTitle>
              <CardDescription>
                Compare your current performance against historical data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <CardDescription>vs. Last Quarter</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">+0.8%</div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last quarter: 3.12% | Current: 3.14%</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                      <CardDescription>vs. Last Quarter</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">+5.2%</div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last quarter: $67.50 | Current: $71.01</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
                      <CardDescription>vs. Last Quarter</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">+1.2%</div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last quarter: 4.6/5 | Current: 4.7/5</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="border rounded-md p-6">
                  <div className="flex items-center justify-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    Historical performance chart visualization would appear here
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <Button>
                    View Detailed History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
