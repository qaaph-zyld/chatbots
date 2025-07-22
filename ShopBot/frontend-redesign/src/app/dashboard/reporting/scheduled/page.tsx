'use client';

import React from 'react';
import { ScheduledReports } from '@/components/reporting/ScheduledReports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
  Calendar, 
  Clock, 
  Mail, 
  Bell, 
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';

export default function ScheduledReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scheduled Reports</h1>
          <p className="text-muted-foreground">
            Set up automated reports with delivery schedules and alerts
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Schedules</CardTitle>
            <CardDescription>Currently running</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+2</span> from previous month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+0.5%</span> from previous month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reports Sent</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+8</span> from previous month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alert Triggers</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500">+2</span> from previous month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Schedules</TabsTrigger>
          <TabsTrigger value="alerts">Alert Configuration</TabsTrigger>
          <TabsTrigger value="history">Delivery History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          <ScheduledReports />
        </TabsContent>
        
        <TabsContent value="alerts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>
                Set up alerts to be notified when specific conditions are met
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-full">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Conversion Rate Drop</h3>
                        <p className="text-sm text-muted-foreground">Alert when conversion rate drops by more than 10%</p>
                      </div>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-100 p-2 rounded-full">
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">High Cart Abandonment</h3>
                        <p className="text-sm text-muted-foreground">Alert when cart abandonment exceeds 30%</p>
                      </div>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Sales Target Achieved</h3>
                        <p className="text-sm text-muted-foreground">Alert when monthly sales target is reached</p>
                      </div>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </div>
                
                <div className="border rounded-md p-4 border-dashed">
                  <div className="flex items-center justify-center py-4">
                    <Button variant="outline">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add New Alert
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery History</CardTitle>
              <CardDescription>
                History of scheduled report deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Weekly Performance Report</h3>
                        <p className="text-sm text-muted-foreground">Delivered to 5 recipients</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">July 18, 2025</div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Daily Conversation Metrics</h3>
                        <p className="text-sm text-muted-foreground">Delivered to 3 recipients</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">July 18, 2025</div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Daily Conversation Metrics</h3>
                        <p className="text-sm text-muted-foreground">Delivered to 3 recipients</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">July 17, 2025</div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-full">
                        <XCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Monthly Business Review</h3>
                        <p className="text-sm text-muted-foreground">Delivery failed - 2 recipients</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">July 15, 2025</div>
                  </div>
                </div>
                
                <div className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Weekly Performance Report</h3>
                        <p className="text-sm text-muted-foreground">Delivered to 5 recipients</p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">July 11, 2025</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
