import { Metadata } from 'next'
import { HeroSection } from '@/components/sections/hero-section'
import { StatsSection } from '@/components/sections/stats-section'
import { SocialProofSection } from '@/components/sections/social-proof-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { PricingSection } from '@/components/sections/pricing-section'
import { FAQSection } from '@/components/sections/faq-section'
import { CTASection } from '@/components/sections/cta-section'

export const metadata: Metadata = {
  title: 'ShopBot - Transform Your E-commerce Customer Support with AI',
  description: 'Automate 95% of customer inquiries, reduce costs by 70%, and improve satisfaction with AI-powered customer support. Works seamlessly with Shopify & WooCommerce.',
  openGraph: {
    title: 'ShopBot - Transform Your E-commerce Customer Support with AI',
    description: 'Automate 95% of customer inquiries, reduce costs by 70%, and improve satisfaction with AI-powered customer support.',
    images: ['/og-homepage.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopBot - Transform Your E-commerce Customer Support with AI',
    description: 'Automate 95% of customer inquiries, reduce costs by 70%, and improve satisfaction.',
    images: ['/twitter-homepage.jpg'],
  },
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Above the fold conversion optimization */}
      <HeroSection />
      
      {/* Stats Section - Immediate credibility building */}
      <StatsSection />
      
      {/* Social Proof Section - Trust signal architecture */}
      <SocialProofSection />
      
      {/* Features Section - Progressive value revelation */}
      <FeaturesSection />
      
      {/* Pricing Section - Psychological pricing optimization */}
      <PricingSection />
      
      {/* FAQ Section - Objection handling and risk mitigation */}
      <FAQSection />
      
      {/* CTA Section - Final conversion optimization */}
      <CTASection />
      
      {/* Temporary: Show that we're successfully building the homepage */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Phase 2A Milestone: Frontend Architecture Success!
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            Navigation, Providers, and Hero Section successfully integrated
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">React Query Integration</h3>
              <p className="text-gray-600 text-sm">Global state management working perfectly</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Navigation System</h3>
              <p className="text-gray-600 text-sm">Button components and animations functional</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl">🚀</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Hero Section Active</h3>
              <p className="text-gray-600 text-sm">Conversion-optimized homepage loading</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
