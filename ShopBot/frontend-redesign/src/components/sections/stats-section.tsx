'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Card } from '@/components/ui/card'
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users, 
  Zap, 
  Star,
  ShoppingCart,
  MessageSquare
} from 'lucide-react'

interface StatItem {
  icon: React.ElementType
  value: string
  label: string
  description: string
  color: string
}

const stats: StatItem[] = [
  {
    icon: TrendingUp,
    value: '95%',
    label: 'Automation Rate',
    description: 'Customer inquiries handled automatically',
    color: 'text-primary'
  },
  {
    icon: DollarSign,
    value: '70%',
    label: 'Cost Reduction',
    description: 'Average savings on support costs',
    color: 'text-success-600'
  },
  {
    icon: Clock,
    value: '0.3s',
    label: 'Response Time',
    description: 'Average AI response speed',
    color: 'text-accent-600'
  },
  {
    icon: Users,
    value: '500+',
    label: 'Happy Stores',
    description: 'E-commerce businesses served',
    color: 'text-primary'
  },
  {
    icon: Star,
    value: '4.9/5',
    label: 'Customer Rating',
    description: 'Average satisfaction score',
    color: 'text-yellow-500'
  },
  {
    icon: MessageSquare,
    value: '1M+',
    label: 'Messages Processed',
    description: 'Customer interactions automated',
    color: 'text-accent-600'
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

function CountUpAnimation({ value, duration = 2000 }: { value: string; duration?: number }) {
  const [count, setCount] = React.useState(0)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 })
  
  React.useEffect(() => {
    if (!inView) return
    
    // Extract numeric value
    const numericValue = parseFloat(value.replace(/[^\d.]/g, ''))
    if (isNaN(numericValue)) return
    
    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(numericValue * easeOutQuart)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [inView, value, duration])
  
  // Format the count based on the original value format
  const formatCount = (num: number) => {
    if (value.includes('%')) return `${Math.round(num)}%`
    if (value.includes('s')) return `${num.toFixed(1)}s`
    if (value.includes('/')) return `${num.toFixed(1)}/5`
    if (value.includes('+')) return `${Math.round(num)}+`
    if (value.includes('M')) return `${(num / 1000000).toFixed(1)}M+`
    return Math.round(num).toString()
  }
  
  return (
    <span ref={ref} className="tabular-nums">
      {formatCount(count)}
    </span>
  )
}

export function StatsSection() {
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
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Trusted by <span className="gradient-text">500+ E-commerce Stores</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of businesses that have transformed their customer support 
            with ShopBot's AI-powered automation platform.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className="p-6 lg:p-8 text-center hover:shadow-medium transition-all duration-300 group">
                <div className="space-y-4">
                  {/* Icon */}
                  <div className="mx-auto w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className={`h-6 w-6 lg:h-8 lg:w-8 ${stat.color}`} />
                  </div>
                  
                  {/* Value */}
                  <div className="space-y-2">
                    <div className={`text-3xl lg:text-4xl font-bold ${stat.color}`}>
                      <CountUpAnimation value={stat.value} />
                    </div>
                    <div className="text-sm lg:text-base font-semibold text-foreground">
                      {stat.label}
                    </div>
                    <div className="text-xs lg:text-sm text-muted-foreground">
                      {stat.description}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional Metrics Row */}
        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {/* ROI Metric */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
              <TrendingUp className="h-8 w-8 text-success-600" />
            </div>
            <div className="text-2xl font-bold text-success-600 mb-2">
              <CountUpAnimation value="2847%" />
            </div>
            <div className="text-sm font-medium text-foreground mb-1">Average ROI</div>
            <div className="text-xs text-muted-foreground">
              Based on cost savings vs. subscription
            </div>
          </div>

          {/* Implementation Time */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Zap className="h-8 w-8 text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-primary-600 mb-2">
              <CountUpAnimation value="30" />
              <span className="text-lg">min</span>
            </div>
            <div className="text-sm font-medium text-foreground mb-1">Setup Time</div>
            <div className="text-xs text-muted-foreground">
              From signup to first automated response
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              <CountUpAnimation value="98%" />
            </div>
            <div className="text-sm font-medium text-foreground mb-1">Customer Satisfaction</div>
            <div className="text-xs text-muted-foreground">
              Customers prefer AI over waiting
            </div>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          className="mt-16 pt-8 border-t"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <div className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-12">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>99.9% Uptime SLA</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>SOC 2 Type II Certified</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span>24/7 Support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
