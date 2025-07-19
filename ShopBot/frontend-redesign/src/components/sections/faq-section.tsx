'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  HelpCircle, 
  MessageSquare, 
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Zap
} from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: 'general' | 'technical' | 'pricing' | 'support'
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How quickly can I set up ShopBot for my store?',
    answer: 'ShopBot can be fully set up and running in just 30 minutes. Our streamlined onboarding process connects to your Shopify or WooCommerce store, imports your product catalog, and configures AI responses automatically. Most customers are handling their first automated inquiry within an hour of signup.',
    category: 'general'
  },
  {
    id: '2',
    question: 'What types of customer inquiries can ShopBot handle?',
    answer: 'ShopBot handles 95% of common customer inquiries including order tracking, product questions, return policies, shipping information, account issues, and general support. It integrates with your existing systems to provide real-time order status, inventory levels, and personalized recommendations.',
    category: 'general'
  },
  {
    id: '3',
    question: 'How accurate are the AI responses?',
    answer: 'Our AI maintains a 94.8% accuracy rate across all customer interactions. The system continuously learns from your product catalog, policies, and customer interactions to improve over time. For complex issues it cannot handle, ShopBot seamlessly escalates to your human support team with full context.',
    category: 'technical'
  },
  {
    id: '4',
    question: 'Can I customize the AI responses to match my brand voice?',
    answer: 'Absolutely! ShopBot allows complete customization of response tone, style, and messaging to match your brand voice. You can set custom templates, add personality traits, and even configure different voices for different customer segments or product categories.',
    category: 'technical'
  },
  {
    id: '5',
    question: 'What happens if the AI cannot answer a customer question?',
    answer: 'When ShopBot encounters a question it cannot confidently answer, it automatically escalates to your human support team with full conversation context. Customers are notified of the handoff, and your team receives all relevant information to provide seamless assistance.',
    category: 'support'
  },
  {
    id: '6',
    question: 'Is there a free trial available?',
    answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can test ShopBot with real customer inquiries and see the results before committing to a paid plan.',
    category: 'pricing'
  },
  {
    id: '7',
    question: 'How secure is my customer data?',
    answer: 'Security is our top priority. ShopBot is SOC 2 Type II certified with bank-level encryption, GDPR compliance, and regular security audits. All data is encrypted in transit and at rest, and we never share customer information with third parties.',
    category: 'technical'
  },
  {
    id: '8',
    question: 'Can I integrate ShopBot with my existing help desk?',
    answer: 'Yes, ShopBot integrates seamlessly with popular help desk platforms like Zendesk, Freshdesk, Intercom, and others. It can also work with your existing email system, live chat, and social media channels for unified customer support.',
    category: 'technical'
  }
]

const categories = [
  { id: 'general', name: 'General', icon: HelpCircle },
  { id: 'technical', name: 'Technical', icon: Zap },
  { id: 'pricing', name: 'Pricing', icon: CheckCircle },
  { id: 'support', name: 'Support', icon: MessageSquare }
]

function FAQItem({ faq, isOpen, onToggle }: { 
  faq: FAQ; 
  isOpen: boolean; 
  onToggle: () => void 
}) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={onToggle}
        className="w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
          <ChevronDown 
            className={`h-5 w-5 text-muted-foreground transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <CardContent className="pt-0 pb-6 px-6">
              <p className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export function FAQSection() {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set(['1']))
  const [activeCategory, setActiveCategory] = React.useState<string>('general')
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const filteredFAQs = faqs.filter(faq => 
    activeCategory === 'general' ? true : faq.category === activeCategory
  )

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
            <HelpCircle className="h-4 w-4" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Got Questions? <span className="gradient-text">We Have Answers</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about ShopBot, from setup to advanced features. 
            Can't find what you're looking for? Our support team is here to help.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <category.icon className="h-4 w-4" />
              <span>{category.name}</span>
            </button>
          ))}
        </motion.div>

        {/* FAQ Grid */}
        <motion.div 
          className="grid lg:grid-cols-2 gap-6 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {filteredFAQs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openItems.has(faq.id)}
              onToggle={() => toggleItem(faq.id)}
            />
          ))}
        </motion.div>

        {/* Support CTA */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Card className="max-w-4xl mx-auto p-8 bg-gradient-to-r from-gray-50 to-white border-2 border-dashed border-gray-200">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">
                  Still Have Questions?
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Our customer success team is available 24/7 to help you get the most out of ShopBot. 
                  Get personalized assistance and expert guidance.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Live Chat */}
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Live Chat</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Get instant answers from our support team
                    </p>
                    <Button variant="outline" size="sm">
                      Start Chat
                    </Button>
                  </div>
                </div>

                {/* Email Support */}
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto">
                    <Clock className="h-6 w-6 text-accent-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Email Support</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Detailed responses within 2 hours
                    </p>
                    <Button variant="outline" size="sm">
                      Send Email
                    </Button>
                  </div>
                </div>

                {/* Knowledge Base */}
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto">
                    <Shield className="h-6 w-6 text-success-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Help Center</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Comprehensive guides and tutorials
                    </p>
                    <Button variant="outline" size="sm">
                      Browse Docs
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="shadow-glow hover:shadow-glow-lg"
                    icon={<ArrowRight className="h-4 w-4" />}
                    iconPosition="right"
                  >
                    Schedule Demo Call
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    icon={<MessageSquare className="h-4 w-4" />}
                    iconPosition="left"
                  >
                    Contact Sales Team
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>24/7 support available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success-500" />
                  <span>Average response: 2 minutes</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
