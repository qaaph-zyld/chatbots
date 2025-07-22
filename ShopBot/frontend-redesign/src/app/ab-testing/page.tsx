'use client';

import React from 'react';
import { ABTestingDashboard } from '@/components/ab-testing/ABTestingDashboard';
import { ABTestProvider } from '@/lib/ab-testing/ABTestProvider';

export default function ABTestingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">A/B Testing Platform</h1>
          <p className="text-gray-600">Create, manage, and analyze A/B tests to optimize your store's performance</p>
        </div>
      </div>
      
      <ABTestProvider>
        <ABTestingDashboard />
      </ABTestProvider>
    </div>
  );
}
