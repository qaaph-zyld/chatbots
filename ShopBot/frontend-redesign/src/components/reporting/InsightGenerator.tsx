'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lightbulb, TrendingUp, TrendingDown, AlertCircle, RefreshCw, Download } from 'lucide-react';

type InsightCategory = 'all' | 'performance' | 'conversion' | 'customer' | 'product';
type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

interface Insight {
  id: string;
  title: string;
  description: string;
  category: Exclude<InsightCategory, 'all'>;
  priority: InsightPriority;
  impact: string;
  recommendation: string;
  trend: 'up' | 'down' | 'neutral';
  date: string;
}

// Mock data - would be replaced with API calls in production
const mockInsights: Insight[] = [
  {
    id: 'ins-001',
    title: 'Significant increase in cart abandonment rate',
    description: 'Your cart abandonment rate has increased by 15% over the last 7 days, primarily on mobile devices.',
    category: 'conversion',
    priority: 'critical',
    impact: 'Estimated revenue impact: -$2,450 per week',
    recommendation: 'Review the mobile checkout flow for usability issues. Recent changes to the payment form may be causing friction.',
    trend: 'up',
    date: '2025-07-18'
  },
  {
    id: 'ins-002',
    title: 'Customer satisfaction scores improving',
    description: 'Post-conversation satisfaction ratings have increased from 4.2 to 4.7 in the last 30 days.',
    category: 'customer',
    priority: 'medium',
    impact: 'Positive sentiment in customer feedback up by 23%',
    recommendation: 'Continue with the recent improvements to response templates and consider expanding the approach to other conversation types.',
    trend: 'up',
    date: '2025-07-17'
  },
  {
    id: 'ins-003',
    title: 'Product recommendation effectiveness declining',
    description: 'Click-through rates on product recommendations have decreased by 8% in the last 14 days.',
    category: 'product',
    priority: 'high',
    impact: 'Estimated revenue impact: -$1,200 per week',
    recommendation: 'Review the recommendation algorithm and consider refreshing the product catalog data. Test new presentation formats for recommendations.',
    trend: 'down',
    date: '2025-07-16'
  },
  {
    id: 'ins-004',
    title: 'Response time degradation detected',
    description: 'Average response time has increased from 1.2s to 2.5s during peak hours (2-4pm).',
    category: 'performance',
    priority: 'high',
    impact: 'Potential customer frustration and increased abandonment during peak shopping hours',
    recommendation: 'Investigate server load during peak hours and consider scaling resources or optimizing the most frequently used conversation flows.',
    trend: 'up',
    date: '2025-07-15'
  },
  {
    id: 'ins-005',
    title: 'New product category showing strong engagement',
    description: 'The recently added "Summer Collection" category is generating 2.3x more engagement than other categories.',
    category: 'product',
    priority: 'medium',
    impact: 'Opportunity for increased revenue through targeted promotion',
    recommendation: 'Consider featuring these products more prominently in recommendations and create specific conversation flows for this category.',
    trend: 'up',
    date: '2025-07-14'
  },
  {
    id: 'ins-006',
    title: 'Customer retention improving for repeat buyers',
    description: 'Customers who have made 2+ purchases are returning 28% more frequently than last quarter.',
    category: 'customer',
    priority: 'medium',
    impact: 'Increased customer lifetime value for repeat customers',
    recommendation: 'Analyze the factors contributing to improved retention and apply similar strategies to first-time buyer segments.',
    trend: 'up',
    date: '2025-07-13'
  },
  {
    id: 'ins-007',
    title: 'Conversation escalation rate increasing',
    description: 'The rate of conversations requiring human agent escalation has increased from 5% to 9% this week.',
    category: 'performance',
    priority: 'critical',
    impact: 'Increased operational costs and potential customer satisfaction impact',
    recommendation: 'Review recent conversation logs for common escalation triggers and update training data for these scenarios.',
    trend: 'up',
    date: '2025-07-12'
  }
];

export function InsightGenerator() {
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>(mockInsights);
  const [lastUpdated, setLastUpdated] = useState<string>('2025-07-19 08:30 AM');
  
  // Filter insights based on selected category
  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);
  
  // Count insights by priority
  const criticalCount = insights.filter(i => i.priority === 'critical').length;
  const highCount = insights.filter(i => i.priority === 'high').length;
  
  // Simulate refreshing insights
  const refreshInsights = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // In a real implementation, this would fetch from an API
      setInsights(mockInsights);
      
      const now = new Date();
      setLastUpdated(now.toLocaleDateString() + ' ' + now.toLocaleTimeString());
      setIsLoading(false);
    }, 1500);
  };
  
  const getPriorityColor = (priority: InsightPriority) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-50 border-red-200';
      case 'high': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'medium': return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'low': return 'text-green-500 bg-green-50 border-green-200';
    }
  };
  
  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" />;
      case 'down': return <TrendingDown className="h-4 w-4" />;
      case 'neutral': return <span className="h-4 w-4">→</span>;
    }
  };
  
  const getTrendColor = (trend: 'up' | 'down' | 'neutral', category: string) => {
    // For some metrics, "up" is good (like satisfaction), for others it's bad (like cart abandonment)
    const isUpPositive = category === 'customer' || 
                         (category === 'product' && !insights.find(i => i.id === 'ins-003')?.title.includes('declining'));
    
    if (trend === 'up') {
      return isUpPositive ? 'text-green-500' : 'text-red-500';
    } else if (trend === 'down') {
      return isUpPositive ? 'text-red-500' : 'text-green-500';
    }
    return 'text-gray-500';
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Automated Insights
            </CardTitle>
            <CardDescription>
              AI-generated insights and recommendations based on your data
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshInsights}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Refreshing...' : 'Refresh Insights'}
            </Button>
            
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
          <Tabs 
            value={selectedCategory} 
            onValueChange={(value) => setSelectedCategory(value as InsightCategory)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="conversion">Conversion</TabsTrigger>
              <TabsTrigger value="customer">Customer</TabsTrigger>
              <TabsTrigger value="product">Product</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Last updated: {lastUpdated}</span>
            {(criticalCount > 0 || highCount > 0) && (
              <div className="flex items-center gap-1 ml-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-500 font-medium">
                  {criticalCount} critical, {highCount} high priority
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {filteredInsights.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No insights available for this category.</p>
            </div>
          ) : (
            filteredInsights.map((insight) => (
              <div 
                key={insight.id} 
                className="border rounded-lg p-4 transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={`${getPriorityColor(insight.priority)}`}
                      >
                        {insight.priority}
                      </Badge>
                      <Badge variant="secondary">
                        {insight.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{insight.date}</span>
                    </div>
                    
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span>{insight.title}</span>
                      <span className={getTrendColor(insight.trend, insight.category)}>
                        {getTrendIcon(insight.trend)}
                      </span>
                    </h3>
                  </div>
                </div>
                
                <p className="mt-2 text-muted-foreground">{insight.description}</p>
                
                <div className="mt-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Business Impact</h4>
                    <p className="text-sm">{insight.impact}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Recommendation</h4>
                    <p className="text-sm">{insight.recommendation}</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button variant="link" size="sm" className="text-primary">
                    View Detailed Analysis
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="w-full flex justify-between items-center text-sm text-muted-foreground">
          <span>Showing {filteredInsights.length} of {insights.length} insights</span>
          <Button variant="outline" size="sm">View All Insights</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
