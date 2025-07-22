'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  MessageSquare, 
  ShoppingCart, 
  Users, 
  Settings,
  BarChart3,
  FileText,
  Zap,
  Store,
  Bell
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function DashboardNav() {
  const pathname = usePathname();
  
  const navSections: NavSection[] = [
    {
      title: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          description: "Overview of your ShopBot"
        },
        {
          title: "Conversations",
          href: "/dashboard/conversations",
          icon: <MessageSquare className="h-5 w-5" />,
          description: "Manage customer conversations",
          badge: "New"
        },
        {
          title: "Orders",
          href: "/dashboard/orders",
          icon: <ShoppingCart className="h-5 w-5" />,
          description: "View and manage orders"
        },
        {
          title: "Customers",
          href: "/dashboard/customers",
          icon: <Users className="h-5 w-5" />,
          description: "Customer management"
        },
        {
          title: "Store",
          href: "/dashboard/store",
          icon: <Store className="h-5 w-5" />,
          description: "Store configuration"
        }
      ]
    },
    {
      title: "Reporting & Analytics",
      items: [
        {
          title: "Reporting Dashboard",
          href: "/dashboard/reporting",
          icon: <BarChart3 className="h-5 w-5" />,
          description: "Analytics overview",
          badge: "New"
        },
        {
          title: "Insights",
          href: "/dashboard/reporting/insights",
          icon: <Zap className="h-5 w-5" />,
          description: "AI-generated insights"
        },
        {
          title: "Report Builder",
          href: "/dashboard/reporting/builder",
          icon: <FileText className="h-5 w-5" />,
          description: "Create custom reports"
        },
        {
          title: "Scheduled Reports",
          href: "/dashboard/reporting/scheduled",
          icon: <Bell className="h-5 w-5" />,
          description: "Automated reporting"
        }
      ]
    },
    {
      title: "Settings",
      items: [
        {
          title: "Settings",
          href: "/dashboard/settings",
          icon: <Settings className="h-5 w-5" />,
          description: "Manage your account"
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      {navSections.map((section, index) => (
        <div key={index} className="space-y-3">
          <h3 className="font-medium text-xs uppercase text-muted-foreground tracking-wider px-4">
            {section.title}
          </h3>
          <nav className="grid gap-1 px-2">
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <span className="text-xs text-muted-foreground hidden md:inline-block">
                        {item.description}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}
