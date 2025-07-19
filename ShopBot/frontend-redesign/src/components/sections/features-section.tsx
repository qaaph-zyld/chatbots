'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Zap, 
  Shield, 
  BarChart3, 
  Clock, 
  MessageSquare, 
  Settings,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Globe,
  Lock,
  Headphones,
  TrendingUp,
  Users
} from 'lucide-react'

interface Feature {
  icon: React.ElementType
  title: string
  description: string
  benefits: string[]
  color: string
  gradient: string
}

const mainFeatures: Feature[] = [
  {
    icon: Zap,
    title: 'AI-Powered Automation',
    description: 'Advanced natural language processing that understands customer intent and provides accurate, contextual responses instantly.',
    benefits: [
      'Handles 95% of inquiries automatically',
      'Learns from your product catalog',
      'Improves accuracy over time',
      'Supports multiple languages'
    ],
    color: 'text-primary',
    gradient: 'from-primary/10 to-primary/5'
  },
  {
    icon: Shield,
    title: 'Seamless Integration',
    description: 'Connect with your existing e-commerce platform in minutes. No technical expertise required.',
    benefits: [
      '5-minute Shopify setup',
      'WooCommerce ready',
      'API-first architecture',
      'Zero downtime deployment'
    ],
    color: 'text-success-600',
    gradient: 'from-success-100 to-success-50'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Comprehensive insights into customer behavior, support performance, and business impact.',
    benefits: [
      'Customer satisfaction tracking',
      'Response time analytics',
      'Cost savings calculator',
      'Performance benchmarking'
    ],
    color: 'text-accent-600',
    gradient: 'from-accent-100 to-accent-50'
  }
]

const additionalFeatures = [
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Never miss a customer inquiry with round-the-clock automated support.'
  },
  {
    icon: MessageSquare,
    title: 'Multi-Channel Support',
    description: 'Works across email, chat, social media, and your website.'
  },
  {
    icon: Settings,
    title: 'Easy Customization',
    description: 'Tailor responses to match your brand voice and policies.'
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Perfect experience on all devices and screen sizes.'
  },
  {
    icon: Globe,
    title: 'Global Scale',
    description: 'Supports multiple languages and international customers.'
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'SOC 2 compliant with bank-level encryption and privacy.'
  }
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

function MainFeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const isEven = index % 2 === 0

  return (
    <motion.div 
      variants={itemVariants}
      className={`grid lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}
    >
      {/* Content */}
      <div className={`space-y-6 ${!isEven ? 'lg:order-2' : ''}`}>
        <div className="space-y-4">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient}`}>
            <feature.icon className={`h-6 w-6 ${feature.color}`} />
          </div>
          <h3 className="text-2xl lg:text-3xl font-bold">{feature.title}</h3>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
        </div>

        <div className="space-y-3">
          {feature.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0" />
              <span className="text-sm font-medium">{benefit}</span>
            </div>
          ))}
        </div>

        <Button 
          variant="outline" 
          className="group"
          icon={<ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
          iconPosition="right"
        >
          Learn More
        </Button>
      </div>

      {/* Visual */}
      <div className={`relative ${!isEven ? 'lg:order-1' : ''}`}>
        <Card className="overflow-hidden shadow-xl">
          <div className={`h-64 bg-gradient-to-br ${feature.gradient} flex items-center justify-center relative`}>
            {/* Demo Interface Based on Feature */}
            {index === 0 && (
              <div className="w-full max-w-sm mx-auto p-6 space-y-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium">AI Processing...</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    "Where is my order #12345?"
                  </div>
                </div>
                <motion.div 
                  className="bg-primary text-primary-foreground rounded-lg p-4 shadow-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <div className="text-sm">
                    Your order shipped yesterday via FedEx. Tracking: 1Z999AA1234567890
                  </div>
                  <div className="text-xs opacity-75 mt-1">Response time: 0.3s</div>
                </motion.div>
              </div>
            )}

            {index === 1 && (
              <div className="w-full max-w-sm mx-auto p-6">
                <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Integration Status</span>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Shopify Store</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Product Catalog</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Order System</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Setup completed in 4 minutes
                  </div>
                </div>
              </div>
            )}

            {index === 2 && (
              <div className="w-full max-w-sm mx-auto p-6">
                <div className="bg-white rounded-lg p-4 shadow-sm space-y-4">
                  <div className="text-sm font-medium text-center">Today's Performance</div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">95%</div>
                      <div className="text-xs text-gray-500">Automation</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-success-600">0.3s</div>
                      <div className="text-xs text-gray-500">Avg Response</div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      initial={{ width: 0 }}
                      animate={{ width: '95%' }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Floating Elements */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full backdrop-blur-sm" />
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full backdrop-blur-sm" />
          </div>
        </Card>
      </div>
    </motion.div>
  )
}

export function FeaturesSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section className="py-16 lg:py-24 bg-white">
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
            <Zap className="h-4 w-4" />
            <span>Powerful Features</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Everything You Need to <span className="gradient-text">Transform Support</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            ShopBot combines cutting-edge AI with seamless integrations to deliver 
            the most comprehensive e-commerce support automation platform.
          </p>
        </motion.div>

        {/* Main Features */}
        <motion.div 
          className="space-y-24 mb-24"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {mainFeatures.map((feature, index) => (
            <MainFeatureCard key={index} feature={feature} index={index} />
          ))}
        </motion.div>

        {/* Additional Features Grid */}
        <motion.div 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h3 className="text-2xl font-bold text-center mb-12">
            Plus Many More Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Feature Comparison CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-r from-gray-50 to-white border-2 border-dashed border-gray-200">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">
                  See ShopBot in Action
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Experience the power of AI-driven customer support with a personalized demo 
                  using real data from your store. See exactly how ShopBot will transform your business.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="shadow-glow hover:shadow-glow-lg"
                  icon={<ArrowRight className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Get Personalized Demo
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  icon={<BarChart3 className="h-4 w-4" />}
                  iconPosition="left"
                >
                  View Feature Comparison
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success-500" />
                  <span>Setup in 30 minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
