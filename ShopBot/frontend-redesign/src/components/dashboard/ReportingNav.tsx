'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Zap, 
  Lightbulb,
  Settings
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

export function ReportingNav() {
  const pathname = usePathname();
  
  const reportingNavItems: NavItem[] = [
    {
      title: 'Overview',
      href: '/dashboard/reporting',
      icon: <BarChart3 className="h-4 w-4" />,
      description: 'Reporting dashboard overview'
    },
    {
      title: 'Insights',
      href: '/dashboard/reporting/insights',
      icon: <Lightbulb className="h-4 w-4" />,
      description: 'AI-generated insights'
    },
    {
      title: 'Report Builder',
      href: '/dashboard/reporting/builder',
      icon: <FileText className="h-4 w-4" />,
      description: 'Create custom reports'
    },
    {
      title: 'Scheduled Reports',
      href: '/dashboard/reporting/scheduled',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Manage automated reports'
    },
    {
      title: 'Benchmarks',
      href: '/dashboard/reporting/benchmarks',
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Performance benchmarking'
    },
    {
      title: 'Optimizer',
      href: '/dashboard/reporting/optimizer',
      icon: <Zap className="h-4 w-4" />,
      description: 'Performance recommendations'
    },
    {
      title: 'Settings',
      href: '/dashboard/reporting/settings',
      icon: <Settings className="h-4 w-4" />,
      description: 'Reporting preferences'
    }
  ];

  return (
    <div className="w-full">
      <nav className="grid gap-1">
        {reportingNavItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
                isActive ? "bg-muted font-medium" : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "rounded-md p-1",
                isActive ? "bg-background text-foreground" : "text-muted-foreground"
              )}>
                {item.icon}
              </div>
              <div className="flex flex-col">
                <span>{item.title}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline-block">
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
