'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Star, 
  Quote, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  ExternalLink
} from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  avatar: string
  content: string
  rating: number
  metrics: {
    label: string
    value: string
    improvement: string
  }
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'E-commerce Manager',
    company: 'Boutique Fashion Co.',
    avatar: '/avatars/sarah-chen.jpg',
    content: 'ShopBot transformed our customer support completely. We went from 6 hours daily answering emails to just 30 minutes handling complex issues. Our customer satisfaction improved from 3.2 to 4.8 stars.',
    rating: 5,
    metrics: {
      label: 'Time Saved',
      value: '5.5 hours',
      improvement: '+92%'
    }
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    role: 'Founder & CEO',
    company: 'TechGear Plus',
    avatar: '/avatars/marcus-rodriguez.jpg',
    content: 'The ROI was immediate. ShopBot pays for itself in the first week. Our customers love getting instant answers, and we love having more time to focus on growing the business.',
    rating: 5,
    metrics: {
      label: 'Cost Savings',
      value: '$4,200',
      improvement: '+73%'
    }
  },
  {
    id: '3',
    name: 'Emily Watson',
    role: 'Operations Director',
    company: 'Home & Garden Store',
    avatar: '/avatars/emily-watson.jpg',
    content: 'Setup was incredibly easy. In 30 minutes, we had AI handling order tracking, returns, and product questions. The accuracy is amazing - customers can\'t tell it\'s not human.',
    rating: 5,
    metrics: {
      label: 'Accuracy Rate',
      value: '94.8%',
      improvement: '+89%'
    }
  }
]

const companyLogos = [
  { name: 'Shopify', logo: '/logos/shopify.svg' },
  { name: 'WooCommerce', logo: '/logos/woocommerce.svg' },
  { name: 'BigCommerce', logo: '/logos/bigcommerce.svg' },
  { name: 'Magento', logo: '/logos/magento.svg' },
  { name: 'Square', logo: '/logos/square.svg' },
  { name: 'Stripe', logo: '/logos/stripe.svg' }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

function TestimonialCard({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-full hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-6 space-y-6">
          {/* Quote Icon */}
          <div className="flex justify-between items-start">
            <Quote className="h-8 w-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
            <div className="flex space-x-1">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>

          {/* Testimonial Content */}
          <blockquote className="text-gray-700 leading-relaxed">
            "{testimonial.content}"
          </blockquote>

          {/* Metrics */}
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{testimonial.metrics.label}</div>
                <div className="text-2xl font-bold text-primary">{testimonial.metrics.value}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-success-600 font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {testimonial.metrics.improvement}
                </div>
                <div className="text-xs text-muted-foreground">improvement</div>
              </div>
            </div>
          </div>

          {/* Author */}
          <div className="flex items-center space-x-3 pt-4 border-t">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-semibold">
              {testimonial.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{testimonial.name}</div>
              <div className="text-sm text-muted-foreground">
                {testimonial.role} at {testimonial.company}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SocialProofSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          ref={ref}
        >
          <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            <span>Loved by 500+ E-commerce Stores</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            See Why Businesses Choose <span className="gradient-text">ShopBot</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real stories from real customers who transformed their support operations 
            and achieved measurable business results.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div 
          className="grid lg:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={testimonial.id} 
              testimonial={testimonial} 
              index={index} 
            />
          ))}
        </motion.div>

        {/* Company Logos */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-8">
            Seamlessly integrates with your favorite platforms
          </h3>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {companyLogos.map((company, index) => (
              <div 
                key={company.name}
                className="w-24 h-12 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors group"
              >
                <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Case Study CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h3 className="text-2xl font-bold mb-4">
                  Ready to Join 500+ Success Stories?
                </h3>
                <p className="text-muted-foreground mb-6">
                  See how ShopBot can transform your customer support in just 30 minutes. 
                  Get a personalized demo with real data from your store.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="shadow-glow hover:shadow-glow-lg"
                    icon={<ArrowRight className="h-4 w-4" />}
                    iconPosition="right"
                  >
                    Get Your Demo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    icon={<ExternalLink className="h-4 w-4" />}
                    iconPosition="right"
                  >
                    Read Case Studies
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Mini Stats */}
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-primary mb-1">$2M+</div>
                  <div className="text-sm text-muted-foreground">Total Saved</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-success-600 mb-1">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-accent-600 mb-1">30min</div>
                  <div className="text-sm text-muted-foreground">Setup Time</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                  <div className="text-sm text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Additional Social Proof */}
        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-sm font-medium text-foreground">Active Stores</div>
            <div className="text-xs text-muted-foreground">Growing every day</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-success-600">1M+</div>
            <div className="text-sm font-medium text-foreground">Messages Automated</div>
            <div className="text-xs text-muted-foreground">This month alone</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-accent-600">99.9%</div>
            <div className="text-sm font-medium text-foreground">Uptime SLA</div>
            <div className="text-xs text-muted-foreground">Enterprise reliability</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
