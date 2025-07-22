'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Star, Users, TrendingUp, Award, Quote, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

// Testimonial data structure
interface Testimonial {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  businessSize: 'small' | 'medium' | 'large' | 'enterprise';
  rating: number;
  content: string;
  results: {
    costSavings: string;
    efficiencyGain: string;
    customerSatisfaction: string;
  };
  avatar?: string;
  verified: boolean;
  featured: boolean;
}

// Case study data structure
interface CaseStudy {
  id: string;
  title: string;
  company: string;
  industry: string;
  businessSize: string;
  challenge: string;
  solution: string;
  results: {
    metric1: { label: string; value: string; improvement: string };
    metric2: { label: string; value: string; improvement: string };
    metric3: { label: string; value: string; improvement: string };
  };
  timeline: string;
  featured: boolean;
}

// Usage statistics
interface UsageStats {
  totalCustomers: number;
  ticketsProcessed: number;
  averageResponseTime: string;
  customerSatisfaction: number;
  costSavingsGenerated: string;
  activeIntegrations: number;
}

// Sample data - in production, this would come from API
const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    title: 'Customer Success Director',
    company: 'TechStyle Fashion',
    industry: 'fashion',
    businessSize: 'large',
    rating: 5,
    content: 'ShopBot transformed our customer support completely. We went from 4-hour response times to instant responses, and our customer satisfaction scores increased by 40%. The AI understands context perfectly and handles complex queries with ease.',
    results: {
      costSavings: '$45,000/month',
      efficiencyGain: '85% faster',
      customerSatisfaction: '+40%'
    },
    verified: true,
    featured: true
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    title: 'Operations Manager',
    company: 'ElectroHub',
    industry: 'electronics',
    businessSize: 'medium',
    rating: 5,
    content: 'The ROI was immediate. ShopBot handles 80% of our support tickets automatically, freeing up our team to focus on complex technical issues. Our customers love the instant responses, especially for order tracking and product information.',
    results: {
      costSavings: '$18,500/month',
      efficiencyGain: '75% automation',
      customerSatisfaction: '+35%'
    },
    verified: true,
    featured: true
  },
  {
    id: '3',
    name: 'Jennifer Walsh',
    title: 'CEO',
    company: 'GreenGarden Co',
    industry: 'home-garden',
    businessSize: 'small',
    rating: 5,
    content: 'As a small business, we couldn\'t afford a large support team. ShopBot gave us enterprise-level customer service capabilities at a fraction of the cost. It\'s like having a 24/7 expert on our team.',
    results: {
      costSavings: '$8,200/month',
      efficiencyGain: '90% coverage',
      customerSatisfaction: '+50%'
    },
    verified: true,
    featured: false
  }
];

const CASE_STUDIES: CaseStudy[] = [
  {
    id: '1',
    title: 'Fashion Retailer Reduces Support Costs by 65%',
    company: 'StyleForward',
    industry: 'Fashion & Apparel',
    businessSize: 'Large Enterprise',
    challenge: 'High support volume during peak seasons, inconsistent response quality, and escalating costs with traditional support model.',
    solution: 'Implemented ShopBot with custom training on product catalog, return policies, and seasonal promotions. Integrated with existing CRM and order management systems.',
    results: {
      metric1: { label: 'Cost Reduction', value: '65%', improvement: '$78,000 monthly savings' },
      metric2: { label: 'Response Time', value: '< 30 seconds', improvement: 'From 4+ hours' },
      metric3: { label: 'Customer Satisfaction', value: '4.8/5', improvement: '+45% improvement' }
    },
    timeline: '3 months implementation',
    featured: true
  },
  {
    id: '2',
    title: 'Electronics Store Achieves 24/7 Expert Support',
    company: 'TechMart Pro',
    industry: 'Electronics & Technology',
    businessSize: 'Medium Business',
    challenge: 'Complex technical questions requiring expert knowledge, limited support hours, and high customer expectations for technical accuracy.',
    solution: 'Deployed ShopBot with comprehensive technical knowledge base, product specifications, and troubleshooting guides. Enabled seamless escalation to human experts.',
    results: {
      metric1: { label: 'Coverage', value: '24/7', improvement: 'From 9-5 only' },
      metric2: { label: 'Resolution Rate', value: '89%', improvement: 'First contact resolution' },
      metric3: { label: 'Expert Escalations', value: '15%', improvement: 'Down from 60%' }
    },
    timeline: '6 weeks implementation',
    featured: true
  }
];

const USAGE_STATS: UsageStats = {
  totalCustomers: 2847,
  ticketsProcessed: 1250000,
  averageResponseTime: '< 30 seconds',
  customerSatisfaction: 4.7,
  costSavingsGenerated: '$12.5M',
  activeIntegrations: 450
};

export interface SocialProofIntegrationProps {
  className?: string;
  showFilters?: boolean;
  maxTestimonials?: number;
}

export const SocialProofIntegration: React.FC<SocialProofIntegrationProps> = ({
  className,
  showFilters = true,
  maxTestimonials = 6
}) => {
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedBusinessSize, setSelectedBusinessSize] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'testimonials' | 'case-studies' | 'stats'>('testimonials');

  // Filter testimonials based on selected criteria
  const filteredTestimonials = TESTIMONIALS.filter(testimonial => {
    const industryMatch = selectedIndustry === 'all' || testimonial.industry === selectedIndustry;
    const sizeMatch = selectedBusinessSize === 'all' || testimonial.businessSize === selectedBusinessSize;
    return industryMatch && sizeMatch;
  }).slice(0, maxTestimonials);

  // Auto-rotate testimonials
  useEffect(() => {
    if (filteredTestimonials.length > 1) {
      const interval = setInterval(() => {
        setActiveTestimonialIndex((prev) => (prev + 1) % filteredTestimonials.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [filteredTestimonials.length]);

  const nextTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev + 1) % filteredTestimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonialIndex((prev) => (prev - 1 + filteredTestimonials.length) % filteredTestimonials.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        data-testid="star"
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className={`max-w-7xl mx-auto p-6 space-y-8 ${className || ''}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Trusted by Industry Leaders</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Join thousands of businesses that have transformed their customer support with ShopBot's AI-powered automation.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg" role="tablist" aria-label="Social proof content tabs">
          {(['testimonials', 'case-studies', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`tabpanel-${tab}`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  const tabs = ['testimonials', 'case-studies', 'stats'] as const;
                  const currentIndex = tabs.indexOf(tab);
                  const nextIndex = e.key === 'ArrowLeft' 
                    ? (currentIndex - 1 + tabs.length) % tabs.length
                    : (currentIndex + 1) % tabs.length;
                  setActiveTab(tabs[nextIndex]);
                  
                  // Focus on the next tab
                  setTimeout(() => {
                    const nextTabElement = document.getElementById(`tab-${tabs[nextIndex]}`);
                    if (nextTabElement) {
                      nextTabElement.focus();
                    }
                  }, 0);
                }
              }}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'testimonials' && 'Customer Stories'}
              {tab === 'case-studies' && 'Case Studies'}
              {tab === 'stats' && 'Platform Stats'}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showFilters && activeTab === 'testimonials' && (
        <div className="flex justify-center gap-4">
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="home-garden">Home & Garden</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedBusinessSize} onValueChange={setSelectedBusinessSize}>
            <SelectTrigger className="w-48">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Business Sizes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Business Sizes</SelectItem>
              <SelectItem value="small">Small Business</SelectItem>
              <SelectItem value="medium">Medium Business</SelectItem>
              <SelectItem value="large">Large Enterprise</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === 'testimonials' && (
        <div className="space-y-6" role="tabpanel" id="tabpanel-testimonials" aria-labelledby="tab-testimonials">
          {/* Featured Testimonial Carousel */}
          {filteredTestimonials.length > 0 && (
            <Card className="relative overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <Quote className="h-8 w-8 text-blue-600 opacity-20" />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevTestimonial}
                      disabled={filteredTestimonials.length <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextTestimonial}
                      disabled={filteredTestimonials.length <= 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {filteredTestimonials[activeTestimonialIndex] && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {renderStars(filteredTestimonials[activeTestimonialIndex].rating)}
                      {filteredTestimonials[activeTestimonialIndex].verified && (
                        <Badge variant="secondary" className="ml-2">
                          <Award className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    <blockquote className="text-lg text-gray-700 italic leading-relaxed">
                      "{filteredTestimonials[activeTestimonialIndex].content}"
                    </blockquote>

                    <div className="flex justify-between items-end">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {filteredTestimonials[activeTestimonialIndex].name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {filteredTestimonials[activeTestimonialIndex].title} at {filteredTestimonials[activeTestimonialIndex].company}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-right">
                        <div>
                          <div className="text-sm text-gray-500">Cost Savings</div>
                          <div className="font-semibold text-green-600">
                            {filteredTestimonials[activeTestimonialIndex].results.costSavings}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Efficiency</div>
                          <div className="font-semibold text-blue-600">
                            {filteredTestimonials[activeTestimonialIndex].results.efficiencyGain}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Satisfaction</div>
                          <div className="font-semibold text-purple-600">
                            {filteredTestimonials[activeTestimonialIndex].results.customerSatisfaction}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Carousel indicators */}
                {filteredTestimonials.length > 1 && (
                  <div className="flex justify-center mt-6 gap-2">
                    {filteredTestimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveTestimonialIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === activeTestimonialIndex ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional testimonials grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTestimonials.slice(1, maxTestimonials).map((testimonial) => (
              <Card key={testimonial.id} className="h-full">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    {renderStars(testimonial.rating)}
                    {testimonial.verified && (
                      <Badge variant="outline" className="ml-2">
                        <Award className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <blockquote className="text-sm text-gray-700 italic">
                    "{testimonial.content.substring(0, 150)}..."
                  </blockquote>

                  <div className="space-y-2">
                    <div className="font-semibold text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-600">
                      {testimonial.title} at {testimonial.company}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Savings: </span>
                      <span className="font-semibold text-green-600">
                        {testimonial.results.costSavings}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Efficiency: </span>
                      <span className="font-semibold text-blue-600">
                        {testimonial.results.efficiencyGain}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Case Studies Tab */}
      {activeTab === 'case-studies' && (
        <div className="grid lg:grid-cols-2 gap-8" role="tabpanel" id="tabpanel-case-studies" aria-labelledby="tab-case-studies">
          {CASE_STUDIES.map((caseStudy) => (
            <Card key={caseStudy.id} className="h-full">
              <CardHeader>
                <CardTitle className="text-xl">{caseStudy.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{caseStudy.industry}</Badge>
                  <Badge variant="outline">{caseStudy.businessSize}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">Challenge</h4>
                  <p className="text-sm text-gray-700">{caseStudy.challenge}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Solution</h4>
                  <p className="text-sm text-gray-700">{caseStudy.solution}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Results</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.values(caseStudy.results).map((result, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{result.label}</span>
                          <span className="text-lg font-bold text-green-600">{result.value}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{result.improvement}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-500 border-t pt-4">
                  Implementation Timeline: {caseStudy.timeline}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Platform Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-8" role="tabpanel" id="tabpanel-stats" aria-labelledby="tab-stats">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900">
                  {USAGE_STATS.totalCustomers.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-600">Active Customers</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900">
                  {(USAGE_STATS.ticketsProcessed / 1000000).toFixed(1)}M+
                </div>
                <div className="text-sm text-gray-600">Tickets Processed</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <div className="text-3xl font-bold text-gray-900">
                  {USAGE_STATS.customerSatisfaction}/5
                </div>
                <div className="text-sm text-gray-600">Customer Satisfaction</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {USAGE_STATS.averageResponseTime}
                </div>
                <div className="text-sm text-gray-600">Average Response Time</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {USAGE_STATS.costSavingsGenerated}
                </div>
                <div className="text-sm text-gray-600">Total Cost Savings Generated</div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">
                  {USAGE_STATS.activeIntegrations}+
                </div>
                <div className="text-sm text-gray-600">Active Platform Integrations</div>
              </CardContent>
            </Card>
          </div>

          {/* Trust indicators */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Trusted & Secure</h3>
                <div className="flex justify-center items-center gap-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    SOC 2 Compliant
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    GDPR Ready
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    99.9% Uptime
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    24/7 Support
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SocialProofIntegration;
