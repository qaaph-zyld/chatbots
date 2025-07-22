import React from 'react';
import { BusinessDashboard } from '@/components/dashboard/BusinessDashboard';

export const metadata = {
  title: 'Business Intelligence Dashboard | ShopBot',
  description: 'Comprehensive analytics and insights to optimize your customer service operations',
};

export default function DashboardPage() {
  return (
    <div className="container py-8 space-y-8">
      <BusinessDashboard />
    </div>
  );
}
