'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowRight, 
  Mail, 
  Phone, 
  MapPin,
  Twitter,
  Linkedin,
  Github,
  Facebook,
  Instagram,
  Youtube
} from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Integrations', href: '/integrations' },
    { name: 'API Documentation', href: '/docs' },
    { name: 'Changelog', href: '/changelog' }
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Partners', href: '/partners' },
    { name: 'Contact', href: '/contact' }
  ],
  resources: [
    { name: 'Help Center', href: '/help' },
    { name: 'Blog', href: '/blog' },
    { name: 'Case Studies', href: '/case-studies' },
    { name: 'Webinars', href: '/webinars' },
    { name: 'Community', href: '/community' }
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Security', href: '/security' },
    { name: 'Compliance', href: '/compliance' }
  ]
}

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/shopbot', icon: Twitter },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/shopbot', icon: Linkedin },
  { name: 'GitHub', href: 'https://github.com/shopbot', icon: Github },
  { name: 'Facebook', href: 'https://facebook.com/shopbot', icon: Facebook },
  { name: 'Instagram', href: 'https://instagram.com/shopbot', icon: Instagram },
  { name: 'YouTube', href: 'https://youtube.com/shopbot', icon: Youtube }
]

export function Footer() {
  const [email, setEmail] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Track newsletter signup
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'newsletter_signup', {
        event_category: 'engagement',
        event_label: 'footer_newsletter',
        value: 1
      })
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Reset form
    setEmail('')
    setIsSubmitting(false)
  }

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container py-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold">
                Stay Updated with ShopBot
              </h3>
              <p className="text-gray-400 text-lg">
                Get the latest updates, tips, and insights delivered to your inbox. 
                Join 10,000+ e-commerce professionals.
              </p>
            </div>
            <div className="space-y-4">
              <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
                />
                <Button 
                  type="submit" 
                  loading={isSubmitting}
                  icon={<ArrowRight className="h-4 w-4" />}
                  iconPosition="right"
                  className="bg-primary hover:bg-primary/90"
                >
                  Subscribe
                </Button>
              </form>
              <p className="text-sm text-gray-400">
                No spam, unsubscribe at any time. Read our{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container py-16">
        <div className="grid lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SB</span>
                </div>
                <span className="text-xl font-bold">ShopBot</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Transform your e-commerce customer support with AI-powered automation. 
                Trusted by 500+ stores worldwide to deliver exceptional customer experiences.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="h-4 w-4" />
                <span>support@shopbot.ai</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-4 w-4" />
                  <span className="sr-only">{social.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 ShopBot. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>All systems operational</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>GDPR Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Extend window type for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
