'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Zap, 
  Shield,
  Clock,
  TrendingUp,
  Users,
  Sparkles
} from 'lucide-react'

const benefits = [
  {
    icon: Zap,
    text: '30-minute setup',
    color: 'text-primary'
  },
  {
    icon: TrendingUp,
    text: '95% automation rate',
    color: 'text-success-600'
  },
  {
    icon: Shield,
    text: 'Enterprise security',
    color: 'text-accent-600'
  },
  {
    icon: Clock,
    text: '24/7 availability',
    color: 'text-primary'
  }
]

const socialProofStats = [
  { value: '500+', label: 'Happy Customers' },
  { value: '95%', label: 'Automation Rate' },
  { value: '4.9/5', label: 'Customer Rating' },
  { value: '$2M+', label: 'Total Saved' }
]

export function CTASection() {
  const [email, setEmail] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Track final conversion attempt
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'final_cta_submission', {
        event_category: 'conversion',
        event_label: 'bottom_cta_form',
        value: 1,
        user_email: email
      })
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Redirect to demo page
    window.location.href = `/demo?email=${encodeURIComponent(email)}&source=final_cta`
    
    setIsSubmitting(false)
  }

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-primary via-primary-600 to-accent text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
      
      <div className="container relative">
        <motion.div 
          className="max-w-4xl mx-auto text-center space-y-12"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          ref={ref}
        >
          {/* Social Proof Badge */}
          <motion.div 
            className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-medium"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span>Trusted by 500+ E-commerce Stores</span>
          </motion.div>

          {/* Main Headline */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              Ready to Transform Your{' '}
              <span className="relative">
                Customer Support?
                <motion.div 
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-yellow-400/30 rounded"
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : {}}
                  transition={{ duration: 0.8, delay: 1.2 }}
                />
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto">
              Join 500+ successful e-commerce stores that have automated their customer support 
              and saved thousands of dollars every month with ShopBot.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index}
                className="flex flex-col items-center space-y-2 text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
              >
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-white/90">{benefit.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Form */}
          <motion.div 
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <Card className="p-8 bg-white/10 backdrop-blur-md border-white/20">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white">
                    Start Your Free Trial Today
                  </h3>
                  <p className="text-white/80">
                    Get instant access to ShopBot and see results in 30 minutes. 
                    No credit card required.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    type="email"
                    placeholder="Enter your business email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                    size="lg"
                  />
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="sm:w-auto w-full bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl font-semibold"
                    loading={isSubmitting}
                    icon={<ArrowRight className="h-5 w-5" />}
                    iconPosition="right"
                  >
                    Get Instant Demo
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-white/80">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>14-day free trial</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            {socialProofStats.map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 1.6 + index * 0.1 }}
              >
                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/80">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Final Trust Indicators */}
          <motion.div 
            className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-12 text-sm text-white/80"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 2.0 }}
          >
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>SOC 2 Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>500+ Happy Customers</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>99.9% Uptime SLA</span>
            </div>
          </motion.div>

          {/* Urgency Element */}
          <motion.div 
            className="inline-flex items-center space-x-2 bg-yellow-400/20 border border-yellow-400/30 px-4 py-2 rounded-full text-sm font-medium text-yellow-100"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 2.4 }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Limited Time: Get 2 months free with annual plans</span>
          </motion.div>
        </motion.div>
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
