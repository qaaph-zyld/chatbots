'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Check, 
  Star, 
  Zap, 
  ArrowRight, 
  TrendingUp,
  Shield,
  Headphones,
  Clock,
  Users,
  BarChart3,
  Crown,
  Sparkles
} from 'lucide-react'

interface PricingTier {
  id: string
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
    savings: number
  }
  badge?: {
    text: string
    color: string
  }
  features: string[]
  limits: {
    messages: string
    stores: string
    integrations: string
    support: string
  }
  cta: {
    text: string
    variant: 'default' | 'outline' | 'secondary'
  }
  popular?: boolean
  enterprise?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small stores getting started with AI support',
    price: {
      monthly: 29,
      yearly: 290,
      savings: 20
    },
    features: [
      'AI-powered customer support',
      'Basic analytics dashboard',
      'Email integration',
      'Standard response templates',
      'Knowledge base integration',
      'Basic customization'
    ],
    limits: {
      messages: '1,000/month',
      stores: '1 store',
      integrations: 'Basic integrations',
      support: 'Email support'
    },
    cta: {
      text: 'Start Free Trial',
      variant: 'outline'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal for growing businesses that need advanced features',
    price: {
      monthly: 79,
      yearly: 790,
      savings: 25
    },
    badge: {
      text: 'Most Popular',
      color: 'bg-primary text-primary-foreground'
    },
    features: [
      'Everything in Starter',
      'Advanced AI training',
      'Multi-channel support',
      'Custom response templates',
      'Advanced analytics',
      'Priority support',
      'A/B testing tools',
      'Custom integrations'
    ],
    limits: {
      messages: '10,000/month',
      stores: '3 stores',
      integrations: 'Advanced integrations',
      support: 'Priority chat support'
    },
    cta: {
      text: 'Start Free Trial',
      variant: 'default'
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large businesses requiring maximum customization',
    price: {
      monthly: 199,
      yearly: 1990,
      savings: 30
    },
    badge: {
      text: 'Best Value',
      color: 'bg-gradient-to-r from-primary to-accent text-white'
    },
    features: [
      'Everything in Professional',
      'Unlimited AI training',
      'White-label solution',
      'Custom AI models',
      'Advanced security',
      'Dedicated account manager',
      'Custom reporting',
      'API access',
      'SLA guarantee'
    ],
    limits: {
      messages: 'Unlimited',
      stores: 'Unlimited',
      integrations: 'Custom integrations',
      support: 'Dedicated support'
    },
    cta: {
      text: 'Contact Sales',
      variant: 'secondary'
    },
    enterprise: true
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

function PricingCard({ tier, isYearly }: { tier: PricingTier; isYearly: boolean }) {
  const price = isYearly ? tier.price.yearly : tier.price.monthly
  const period = isYearly ? 'year' : 'month'

  return (
    <motion.div variants={itemVariants} className="relative">
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium shadow-lg">
            Most Popular
          </div>
        </div>
      )}
      
      <Card className={`relative h-full ${tier.popular ? 'ring-2 ring-primary shadow-xl scale-105' : 'hover:shadow-lg'} transition-all duration-300`}>
        {tier.badge && !tier.popular && (
          <div className="absolute -top-3 -right-3">
            <div className={`${tier.badge.color} px-3 py-1 rounded-full text-xs font-medium shadow-lg`}>
              {tier.badge.text}
            </div>
          </div>
        )}

        <CardHeader className="text-center pb-8">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{tier.description}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-baseline justify-center space-x-1">
                <span className="text-4xl font-bold">${price}</span>
                <span className="text-muted-foreground">/{period}</span>
              </div>
              {isYearly && tier.price.savings > 0 && (
                <div className="inline-flex items-center space-x-1 bg-success-50 text-success-700 px-2 py-1 rounded-full text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  <span>Save {tier.price.savings}%</span>
                </div>
              )}
            </div>

            <Button 
              className={`w-full ${tier.popular ? 'shadow-glow hover:shadow-glow-lg' : ''}`}
              variant={tier.cta.variant}
              size="lg"
              icon={tier.enterprise ? <ArrowRight className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              iconPosition="right"
            >
              {tier.cta.text}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Usage Limits */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              What's Included
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <div className="font-medium">{tier.limits.messages}</div>
                <div className="text-muted-foreground">Messages</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">{tier.limits.stores}</div>
                <div className="text-muted-foreground">Stores</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">{tier.limits.integrations}</div>
                <div className="text-muted-foreground">Integrations</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">{tier.limits.support}</div>
                <div className="text-muted-foreground">Support</div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Features
            </h4>
            <div className="space-y-2">
              {tier.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Check className="h-4 w-4 text-success-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function PricingSection() {
  const [isYearly, setIsYearly] = React.useState(true)
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
            <Crown className="h-4 w-4" />
            <span>Simple, Transparent Pricing</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Choose the Perfect Plan for <span className="gradient-text">Your Business</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Start with a free trial, scale as you grow. All plans include our core AI features 
            and 24/7 customer support. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center space-x-4 bg-white rounded-full p-1 shadow-sm border">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-2 ${
                isYearly 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Yearly</span>
              <div className="bg-success-500 text-white px-2 py-0.5 rounded-full text-xs">
                Save up to 30%
              </div>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          className="grid lg:grid-cols-3 gap-8 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.id} tier={tier} isYearly={isYearly} />
          ))}
        </motion.div>

        {/* ROI Calculator CTA */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="text-left space-y-4">
                <h3 className="text-2xl font-bold">
                  Calculate Your ROI
                </h3>
                <p className="text-muted-foreground">
                  See exactly how much ShopBot will save your business. 
                  Most customers see ROI within the first week.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="font-semibold text-success-600">Average Savings</div>
                    <div className="text-2xl font-bold">$3,200/mo</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-primary">Payback Period</div>
                    <div className="text-2xl font-bold">6 days</div>
                  </div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <Button 
                  size="lg" 
                  className="shadow-glow hover:shadow-glow-lg mb-4"
                  icon={<BarChart3 className="h-4 w-4" />}
                  iconPosition="left"
                >
                  Calculate Your Savings
                </Button>
                <div className="text-sm text-muted-foreground">
                  Free ROI calculator • No signup required
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* FAQ Preview */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <h3 className="text-xl font-bold mb-8">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
            <div className="space-y-2">
              <h4 className="font-semibold">Can I change plans anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade, downgrade, or cancel your plan at any time. 
                Changes take effect immediately.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Is there a free trial?</h4>
              <p className="text-sm text-muted-foreground">
                All plans include a 14-day free trial with full access to features. 
                No credit card required.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">What happens if I exceed limits?</h4>
              <p className="text-sm text-muted-foreground">
                We'll notify you before you reach limits and offer easy upgrade options. 
                No service interruption.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Do you offer custom pricing?</h4>
              <p className="text-sm text-muted-foreground">
                Yes, we offer custom Enterprise plans for large businesses with 
                specific requirements.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          className="mt-16 pt-8 border-t"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <div className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-12 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Headphones className="h-4 w-4" />
              <span>24/7 customer support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4" />
              <span>4.9/5 customer rating</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
