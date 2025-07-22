'use client';

import React from 'react';
import { ErrorTestPage } from '@/lib/error/ErrorTestUtils';
import { ErrorMonitoringDashboard } from '@/components/error/ErrorMonitoringDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalErrorProvider } from '@/components/error/GlobalErrorProvider';

/**
 * Admin page for testing and monitoring errors
 * This page provides both error testing capabilities and a monitoring dashboard
 */
export default function AdminErrorTestingPage() {
  return (
    <GlobalErrorProvider>
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Error Testing & Monitoring</h1>
        <p className="text-muted-foreground">
          This page allows you to test the error handling system and monitor errors across the application.
        </p>
        
        <Tabs defaultValue="testing" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="testing">Error Testing</TabsTrigger>
            <TabsTrigger value="monitoring">Error Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="testing">
            <ErrorTestPage />
          </TabsContent>
          
          <TabsContent value="monitoring">
            <ErrorMonitoringDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </GlobalErrorProvider>
  );
}
