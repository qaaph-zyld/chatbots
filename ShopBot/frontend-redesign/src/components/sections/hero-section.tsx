'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Zap, 
  TrendingUp, 
  Shield,
  Play,
  Users,
  Clock,
  DollarSign
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, delay: 0.2 }
}

export function HeroSection() {
  const [email, setEmail] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleDemoRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Track demo request
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'demo_request', {
        event_category: 'conversion',
        event_label: 'hero_form_submission',
        value: 1,
        user_email: email
      })
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to demo page or show success message
    window.location.href = `/demo?email=${encodeURIComponent(email)}`
    
    setIsSubmitting(false)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 pt-20 pb-16 lg:pt-28 lg:pb-24">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Value Proposition */}
          <motion.div 
            className="space-y-8"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {/* Social Proof Badge */}
            <motion.div variants={fadeInUp} className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 bg-success-50 text-success-700 px-3 py-1 rounded-full text-sm font-medium">
                <Star className="h-4 w-4 fill-current" />
                <span>4.9/5 from 500+ stores</span>
              </div>
              <div className="flex items-center space-x-1 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>$2M+ saved for customers</span>
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.div variants={fadeInUp} className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-balance">
                Transform Your{' '}
                <span className="gradient-text">E-commerce Support</span>{' '}
                in 30 Minutes
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground text-pretty">
                AI-powered automation that handles 95% of customer inquiries, 
                reduces costs by 70%, and works seamlessly with your existing store.
              </p>
            </motion.div>

            {/* Key Benefits */}
            <motion.div variants={fadeInUp} className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Zap, text: 'Setup in 30 minutes' },
                { icon: DollarSign, text: 'Save $3,000+ monthly' },
                { icon: Clock, text: '24/7 instant responses' },
                { icon: Shield, text: '99.9% uptime guarantee' }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <benefit.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{benefit.text}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA Form */}
            <motion.div variants={fadeInUp}>
              <Card className="p-6 bg-white/50 backdrop-blur-sm border-primary/20">
                <form onSubmit={handleDemoRequest} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="Enter your email for instant demo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1"
                      size="lg"
                    />
                    <Button 
                      type="submit" 
                      size="lg" 
                      className="sm:w-auto w-full shadow-glow hover:shadow-glow-lg"
                      loading={isSubmitting}
                      icon={<ArrowRight className="h-4 w-4" />}
                      iconPosition="right"
                    >
                      Get Instant Demo
                    </Button>
                  </div>
                  <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-success-500" />
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-success-500" />
                      <span>5-minute setup</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3 text-success-500" />
                      <span>Cancel anytime</span>
                    </div>
                  </div>
                </form>
              </Card>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div variants={fadeInUp} className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">500+ happy customers</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">SOC 2 compliant</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Demo */}
          <motion.div 
            className="relative"
            variants={scaleIn}
            initial="initial"
            animate="animate"
          >
            {/* Demo Interface Mockup */}
            <Card className="relative overflow-hidden shadow-2xl bg-white">
              {/* Browser Chrome */}
              <div className="bg-gray-100 px-4 py-3 border-b flex items-center space-x-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
                <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500">
                  yourstore.com/support
                </div>
              </div>

              {/* Chat Interface */}
              <div className="p-6 space-y-4 h-96 bg-gradient-to-b from-gray-50 to-white">
                {/* Customer Message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg rounded-br-sm max-w-xs">
                    <p className="text-sm">Where is my order #12345?</p>
                    <span className="text-xs opacity-75">2:34 PM</span>
                  </div>
                </div>

                {/* AI Response */}
                <motion.div 
                  className="flex justify-start"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                >
                  <div className="bg-white border px-4 py-2 rounded-lg rounded-bl-sm max-w-xs shadow-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-xs font-medium text-primary">ShopBot AI</span>
                      <span className="text-xs text-green-500">● Online</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Your order #12345 shipped yesterday via FedEx and will arrive by Friday. 
                      Tracking: <span className="text-primary font-mono">1Z999AA1234567890</span>
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">2:34 PM</span>
                      <span className="text-xs text-green-500">✓ Instant response</span>
                    </div>
                  </div>
                </motion.div>

                {/* Response Time Indicator */}
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                >
                  <div className="inline-flex items-center space-x-2 bg-success-50 text-success-700 px-3 py-1 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
                    <span>Response time: 0.3 seconds</span>
                  </div>
                </motion.div>

                {/* Satisfaction Rating */}
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2, duration: 0.5 }}
                >
                  <div className="inline-flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">Customer satisfied</span>
                  </div>
                </motion.div>
              </div>

              {/* Play Demo Button Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="bg-white/90 hover:bg-white"
                  icon={<Play className="h-5 w-5" />}
                  onClick={() => {
                    // Track interactive demo engagement
                    if (typeof window !== 'undefined' && window.gtag) {
                      window.gtag('event', 'demo_interaction', {
                        event_category: 'engagement',
                        event_label: 'hero_demo_play',
                        value: 1
                      })
                    }
                  }}
                >
                  Watch Live Demo
                </Button>
              </div>
            </Card>

            {/* Floating Stats */}
            <motion.div 
              className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-3 border"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">95%</div>
                <div className="text-xs text-muted-foreground">Automation Rate</div>
              </div>
            </motion.div>

            <motion.div 
              className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 border"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600">70%</div>
                <div className="text-xs text-muted-foreground">Cost Reduction</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Extend window type for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}
