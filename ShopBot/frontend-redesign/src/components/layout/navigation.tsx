'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Menu, 
  X, 
  ChevronDown, 
  Zap, 
  Shield, 
  BarChart3, 
  Headphones,
  ArrowRight,
  Star
} from 'lucide-react'

const navigationItems = [
  {
    title: 'Features',
    href: '/features',
    description: 'Discover powerful AI automation capabilities',
    items: [
      {
        title: 'AI Customer Support',
        href: '/features/ai-support',
        description: 'Intelligent responses powered by advanced AI',
        icon: Zap,
      },
      {
        title: 'Platform Integrations',
        href: '/features/integrations',
        description: 'Seamless Shopify & WooCommerce integration',
        icon: Shield,
      },
      {
        title: 'Analytics & Insights',
        href: '/features/analytics',
        description: 'Real-time performance metrics and insights',
        icon: BarChart3,
      },
      {
        title: '24/7 Automation',
        href: '/features/automation',
        description: 'Round-the-clock customer service automation',
        icon: Headphones,
      },
    ],
  },
  {
    title: 'Pricing',
    href: '/pricing',
  },
  {
    title: 'Resources',
    href: '/resources',
    description: 'Learn how to maximize your customer support ROI',
    items: [
      {
        title: 'Documentation',
        href: '/docs',
        description: 'Complete setup and configuration guides',
      },
      {
        title: 'Case Studies',
        href: '/case-studies',
        description: 'Real success stories from our customers',
      },
      {
        title: 'Blog',
        href: '/blog',
        description: 'Latest insights on e-commerce automation',
      },
      {
        title: 'Help Center',
        href: '/help',
        description: 'Get answers to common questions',
      },
    ],
  },
  {
    title: 'Company',
    href: '/company',
    items: [
      {
        title: 'About Us',
        href: '/about',
        description: 'Learn about our mission and team',
      },
      {
        title: 'Contact',
        href: '/contact',
        description: 'Get in touch with our team',
      },
    ],
  },
]

export function Navigation() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null)
  const pathname = usePathname()

  const closeMenu = () => {
    setIsOpen(false)
    setActiveDropdown(null)
  }

  const handleDropdownToggle = (title: string) => {
    setActiveDropdown(activeDropdown === title ? null : title)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 transition-transform hover:scale-105"
          onClick={closeMenu}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">ShopBot</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-8">
          {navigationItems.map((item) => (
            <div key={item.title} className="relative">
              {item.items ? (
                <div
                  className="group"
                  onMouseEnter={() => setActiveDropdown(item.title)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={cn(
                      "flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary",
                      pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <span>{item.title}</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === item.title && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute left-0 top-full mt-2 w-80 rounded-lg border bg-popover p-4 shadow-lg"
                      >
                        {item.description && (
                          <div className="mb-4 border-b pb-3">
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        )}
                        <div className="grid gap-3">
                          {item.items.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className="group flex items-start space-x-3 rounded-md p-2 transition-colors hover:bg-accent"
                              onClick={closeMenu}
                            >
                              {subItem.icon && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                  <subItem.icon className="h-4 w-4" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium text-sm group-hover:text-primary transition-colors">
                                  {subItem.title}
                                </div>
                                {subItem.description && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {subItem.description}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={closeMenu}
                >
                  {item.title}
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex md:items-center md:space-x-4">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">4.9/5</span>
            <span className="text-xs">(127 reviews)</span>
          </div>
          
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          
          <Button 
            size="sm" 
            className="shadow-glow hover:shadow-glow-lg"
            asChild
          >
            <Link 
              href="/demo"
              onClick={() => {
                // Track demo request intent
                if (typeof window !== 'undefined' && window.gtag) {
                  window.gtag('event', 'demo_intent', {
                    event_category: 'engagement',
                    event_label: 'nav_cta_click',
                    value: 1
                  })
                }
              }}
            >
              Get Demo
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t bg-background md:hidden"
          >
            <div className="container py-6">
              <div className="space-y-6">
                {navigationItems.map((item) => (
                  <div key={item.title}>
                    {item.items ? (
                      <div>
                        <button
                          onClick={() => handleDropdownToggle(item.title)}
                          className="flex w-full items-center justify-between text-left font-medium"
                        >
                          {item.title}
                          <ChevronDown 
                            className={cn(
                              "h-4 w-4 transition-transform",
                              activeDropdown === item.title && "rotate-180"
                            )} 
                          />
                        </button>
                        
                        <AnimatePresence>
                          {activeDropdown === item.title && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 space-y-3 pl-4"
                            >
                              {item.items.map((subItem) => (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className="block rounded-md p-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                  onClick={closeMenu}
                                >
                                  <div className="font-medium">{subItem.title}</div>
                                  {subItem.description && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {subItem.description}
                                    </div>
                                  )}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className="block font-medium"
                        onClick={closeMenu}
                      >
                        {item.title}
                      </Link>
                    )}
                  </div>
                ))}
                
                <div className="border-t pt-6 space-y-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/login" onClick={closeMenu}>
                      Sign In
                    </Link>
                  </Button>
                  
                  <Button className="w-full shadow-glow" asChild>
                    <Link 
                      href="/demo" 
                      onClick={() => {
                        closeMenu()
                        // Track demo request intent
                        if (typeof window !== 'undefined' && window.gtag) {
                          window.gtag('event', 'demo_intent', {
                            event_category: 'engagement',
                            event_label: 'mobile_nav_cta_click',
                            value: 1
                          })
                        }
                      }}
                    >
                      Get Demo
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

// Extend window type for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
