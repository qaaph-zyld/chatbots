'use client';

import React from 'react';
import { ReportingNav } from '@/components/dashboard/ReportingNav';
import { Separator } from '@/components/ui/separator';

export default function ReportingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col space-y-6 p-6 md:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reporting & Analytics</h2>
        <p className="text-muted-foreground">
          Gain insights, create reports, and optimize your ShopBot performance
        </p>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <aside className="md:border-r pr-6 hidden md:block">
          <ReportingNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
