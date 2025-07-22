'use client';

import React from 'react';
import { PerformanceOptimizer } from '@/components/reporting/PerformanceOptimizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Download,
  Settings,
  ArrowRight,
  BarChart3,
  Server,
  MessageSquare,
  ShoppingCart
} from 'lucide-react';

export default function OptimizerPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Optimizer</h1>
          <p className="text-muted-foreground">
            AI-powered recommendations to improve your ShopBot performance
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
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Score</CardTitle>
          <CardDescription>
            Overall performance rating based on key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
            <div className="flex flex-col items-center justify-center p-6 border rounded-md">
              <div className="text-5xl font-bold mb-2">82</div>
              <div className="text-sm text-muted-foreground mb-4">out of 100</div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Good</Badge>
              <p className="text-xs text-muted-foreground mt-4">
                +5 points from last month
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Conversation Performance</span>
                  <span className="text-sm font-medium">78/100</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Response Time</span>
                  <span className="text-sm font-medium">92/100</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="text-sm font-medium">85/100</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                  <span className="text-sm font-medium">88/100</span>
                </div>
                <Progress value={88} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">System Efficiency</span>
                  <span className="text-sm font-medium">75/100</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="recommendations">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="implemented">Implemented</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommendations" className="mt-6">
          <PerformanceOptimizer />
        </TabsContent>
        
        <TabsContent value="implemented" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Implemented Recommendations</CardTitle>
              <CardDescription>
                Optimizations you've successfully implemented
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Response Caching Implementation</h3>
                        <p className="text-sm text-muted-foreground">Improved response time by 35%</p>
                      </div>
                    </div>
                    <Badge>July 12, 2025</Badge>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Conversation Flow Optimization</h3>
                        <p className="text-sm text-muted-foreground">Reduced steps to purchase by 22%</p>
                      </div>
                    </div>
                    <Badge>July 5, 2025</Badge>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Product Recommendation Algorithm Update</h3>
                        <p className="text-sm text-muted-foreground">Increased recommendation relevance by 18%</p>
                      </div>
                    </div>
                    <Badge>June 28, 2025</Badge>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Database Query Optimization</h3>
                        <p className="text-sm text-muted-foreground">Reduced database load by 40%</p>
                      </div>
                    </div>
                    <Badge>June 20, 2025</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>
                Track how your performance has changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                      <CardDescription>Last 3 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">+8 pts</div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Improving</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">From 74 to 82 points</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Implemented Recommendations</CardTitle>
                      <CardDescription>Last 3 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-green-500">+5</span> from previous period
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Performance Impact</CardTitle>
                      <CardDescription>From optimizations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">+24%</div>
                      <p className="text-xs text-muted-foreground mt-1">Average improvement across metrics</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="border rounded-md p-6">
                  <div className="flex items-center justify-center">
                    <BarChart3 className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />
                  </div>
                  <p className="text-center text-muted-foreground">
                    Performance history chart visualization would appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle className="text-lg">System Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">CPU Usage</span>
                  <span className="text-sm font-medium">42%</span>
                </div>
                <Progress value={42} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm font-medium">58%</span>
                </div>
                <Progress value={58} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">API Response Time</span>
                  <span className="text-sm font-medium">180ms</span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle className="text-lg">Conversation Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Completion Rate</span>
                  <span className="text-sm font-medium">87%</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Avg. Response Time</span>
                  <span className="text-sm font-medium">2.1s</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Customer Satisfaction</span>
                  <span className="text-sm font-medium">4.7/5</span>
                </div>
                <Progress value={94} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <CardTitle className="text-lg">Sales Health</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Conversion Rate</span>
                  <span className="text-sm font-medium">3.2%</span>
                </div>
                <Progress value={80} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Cart Abandonment</span>
                  <span className="text-sm font-medium">24%</span>
                </div>
                <Progress value={76} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Avg. Order Value</span>
                  <span className="text-sm font-medium">$72.50</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
