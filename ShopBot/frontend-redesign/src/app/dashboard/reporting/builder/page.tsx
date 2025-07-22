'use client';

import React from 'react';
import { ReportBuilder } from '@/components/reporting/ReportBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlusCircle, 
  FileText, 
  Clock, 
  Star, 
  Save,
  Download,
  Share2
} from 'lucide-react';

export default function ReportBuilderPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Builder</h1>
          <p className="text-muted-foreground">
            Create custom reports with advanced filtering and visualization options
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Recent
          </Button>
          <Button variant="outline">
            <Star className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="builder" className="mt-6">
          <ReportBuilder />
        </TabsContent>
        
        <TabsContent value="saved" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance Summary</CardTitle>
                <CardDescription>Last updated: July 15, 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button size="sm">
                  Edit
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Customer Retention Analysis</CardTitle>
                <CardDescription>Last updated: July 10, 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button size="sm">
                  Edit
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Conversation Metrics Report</CardTitle>
                <CardDescription>Last updated: July 5, 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
                <Button size="sm">
                  Edit
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Sales Performance Template</CardTitle>
                <CardDescription>Comprehensive sales metrics and KPIs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  Preview
                </Button>
                <Button size="sm">
                  Use Template
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Conversation Analytics Template</CardTitle>
                <CardDescription>Detailed conversation metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  Preview
                </Button>
                <Button size="sm">
                  Use Template
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Customer Retention Template</CardTitle>
                <CardDescription>Customer retention and loyalty metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40 bg-muted rounded-md">
                  <FileText className="h-16 w-16 text-muted-foreground/50" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  Preview
                </Button>
                <Button size="sm">
                  Use Template
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
