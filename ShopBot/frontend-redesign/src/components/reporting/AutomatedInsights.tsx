'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Calendar, 
  BarChart3, 
  LineChart, 
  PieChart,
  MessageSquare,
  ShoppingCart,
  Users,
  DollarSign,
  Clock,
  Lightbulb,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Types for insights
type InsightCategory = 'conversations' | 'sales' | 'customers' | 'products' | 'performance';
type InsightType = 'trend' | 'anomaly' | 'opportunity' | 'achievement';
type InsightPriority = 'high' | 'medium' | 'low';
type TimeFrame = 'daily' | 'weekly' | 'monthly' | 'quarterly';

interface Insight {
  id: string;
  title: string;
  description: string;
  category: InsightCategory;
  type: InsightType;
  priority: InsightPriority;
  timeFrame: TimeFrame;
  date: string;
  metrics?: {
    name: string;
    value: string;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  details?: string;
  recommendations?: string[];
  chart?: {
    type: 'bar' | 'line' | 'pie';
    data: any; // In a real implementation, this would be properly typed chart data
  };
}

// Mock data for insights
const mockInsights: Insight[] = [
  {
    id: 'insight-001',
    title: 'Significant increase in conversation completion rate',
    description: 'Your conversation completion rate has increased by 15% over the past week, indicating improved engagement with customers.',
    category: 'conversations',
    type: 'achievement',
    priority: 'high',
    timeFrame: 'weekly',
    date: '2025-07-15',
    metrics: [
      {
        name: 'Completion Rate',
        value: '87%',
        change: 15,
        trend: 'up'
      },
      {
        name: 'Avg. Duration',
        value: '4m 12s',
        change: -8,
        trend: 'down'
      }
    ],
    details: 'The increase in completion rate coincides with the recent updates to conversation flows and improved product recommendation algorithm. Customers are now more likely to complete their shopping journey through the bot.',
    recommendations: [
      'Continue optimizing conversation flows for popular product categories',
      'Apply similar conversation patterns to underperforming categories',
      'Consider implementing A/B testing to further refine successful patterns'
    ],
    chart: {
      type: 'line',
      data: {} // Mock chart data
    }
  },
  {
    id: 'insight-002',
    title: 'Potential cart abandonment issue detected',
    description: 'There has been a 12% increase in cart abandonment rate in the last 3 days, primarily affecting mobile users.',
    category: 'sales',
    type: 'anomaly',
    priority: 'high',
    timeFrame: 'daily',
    date: '2025-07-18',
    metrics: [
      {
        name: 'Abandonment Rate',
        value: '28%',
        change: 12,
        trend: 'up'
      },
      {
        name: 'Mobile Users',
        value: '76%',
        change: 8,
        trend: 'up'
      }
    ],
    details: 'Analysis shows that the increase in abandonment coincides with the latest mobile app update. The checkout flow on mobile devices is experiencing longer load times, which may be contributing to the higher abandonment rate.',
    recommendations: [
      'Investigate mobile checkout performance issues immediately',
      'Consider rolling back the recent mobile app update',
      'Implement a targeted recovery campaign for affected customers'
    ],
    chart: {
      type: 'bar',
      data: {} // Mock chart data
    }
  },
  {
    id: 'insight-003',
    title: 'New customer acquisition cost decreased',
    description: 'Your cost to acquire new customers has decreased by 23% this month while maintaining conversion quality.',
    category: 'customers',
    type: 'achievement',
    priority: 'medium',
    timeFrame: 'monthly',
    date: '2025-07-01',
    metrics: [
      {
        name: 'Acquisition Cost',
        value: '$24.50',
        change: -23,
        trend: 'down'
      },
      {
        name: 'Conversion Rate',
        value: '3.8%',
        change: 0.5,
        trend: 'up'
      }
    ],
    details: 'The improved efficiency in customer acquisition appears to be driven by the new targeted marketing campaigns and the enhanced ShopBot onboarding experience. First-time users are finding products more quickly and completing purchases at a higher rate.',
    recommendations: [
      'Increase budget allocation to the most effective acquisition channels',
      'Further optimize the onboarding experience for new customers',
      'Create case studies based on successful customer journeys'
    ],
    chart: {
      type: 'line',
      data: {} // Mock chart data
    }
  },
  {
    id: 'insight-004',
    title: 'Opportunity to expand product recommendations',
    description: 'Customers who engage with product recommendations are spending 35% more than those who don\'t.',
    category: 'products',
    type: 'opportunity',
    priority: 'medium',
    timeFrame: 'weekly',
    date: '2025-07-12',
    metrics: [
      {
        name: 'Avg. Order Value',
        value: '$78.50',
        change: 35,
        trend: 'up'
      },
      {
        name: 'Recommendation CTR',
        value: '18%',
        change: 4,
        trend: 'up'
      }
    ],
    details: 'Analysis of customer behavior shows that only 32% of conversations currently include product recommendations, despite their strong impact on order value. There\'s significant potential to increase revenue by expanding the use of personalized recommendations throughout the customer journey.',
    recommendations: [
      'Implement recommendations at more touchpoints in the conversation flow',
      'Enhance personalization algorithm to improve recommendation relevance',
      'Create a dedicated "Recommended for You" section in the shopping interface'
    ],
    chart: {
      type: 'bar',
      data: {} // Mock chart data
    }
  },
  {
    id: 'insight-005',
    title: 'Response time optimization needed',
    description: 'Average response time has increased by 0.8 seconds during peak hours, affecting customer satisfaction.',
    category: 'performance',
    type: 'anomaly',
    priority: 'medium',
    timeFrame: 'daily',
    date: '2025-07-17',
    metrics: [
      {
        name: 'Response Time',
        value: '2.3s',
        change: 0.8,
        trend: 'up'
      },
      {
        name: 'Peak Hour Load',
        value: '+42%',
        change: 12,
        trend: 'up'
      }
    ],
    details: 'The increased response time is primarily occurring between 7-9 PM EST, when user traffic is at its highest. This coincides with a 12% increase in concurrent users during these hours compared to last month. Server monitoring indicates higher CPU and memory usage during these periods.',
    recommendations: [
      'Implement caching for frequently accessed data during peak hours',
      'Consider scaling up server resources during high-traffic periods',
      'Optimize database queries for common conversation paths'
    ],
    chart: {
      type: 'line',
      data: {} // Mock chart data
    }
  },
  {
    id: 'insight-006',
    title: 'Seasonal product trend identified',
    description: 'Early seasonal shopping patterns detected, 3 weeks earlier than last year.',
    category: 'products',
    type: 'trend',
    priority: 'medium',
    timeFrame: 'weekly',
    date: '2025-07-10',
    metrics: [
      {
        name: 'Seasonal Items',
        value: '+28%',
        change: 28,
        trend: 'up'
      },
      {
        name: 'Search Volume',
        value: '+35%',
        change: 35,
        trend: 'up'
      }
    ],
    details: 'Analysis of search patterns and browsing behavior indicates that customers are beginning to look for seasonal items significantly earlier than in previous years. This presents an opportunity to adjust inventory and marketing strategies to capitalize on this early interest.',
    recommendations: [
      'Accelerate seasonal inventory availability',
      'Create early-bird promotions for seasonal items',
      'Update ShopBot to proactively suggest seasonal products'
    ],
    chart: {
      type: 'line',
      data: {} // Mock chart data
    }
  },
  {
    id: 'insight-007',
    title: 'Customer retention milestone achieved',
    description: '90-day retention rate has reached 65%, exceeding the quarterly target of 60%.',
    category: 'customers',
    type: 'achievement',
    priority: 'high',
    timeFrame: 'quarterly',
    date: '2025-07-01',
    metrics: [
      {
        name: '90-day Retention',
        value: '65%',
        change: 8,
        trend: 'up'
      },
      {
        name: 'Repeat Purchase',
        value: '3.2',
        change: 0.7,
        trend: 'up'
      }
    ],
    details: 'The improved retention rate appears to be driven by several successful initiatives, including the enhanced post-purchase follow-up sequence, personalized recommendations, and the new loyalty program. Customers who engage with at least two of these touchpoints show a 78% retention rate.',
    recommendations: [
      'Expand the loyalty program with additional tiers and benefits',
      'Further personalize the post-purchase experience',
      'Create case studies highlighting successful retention strategies'
    ],
    chart: {
      type: 'bar',
      data: {} // Mock chart data
    }
  },
  {
    id: 'insight-008',
    title: 'Conversation topic shift detected',
    description: 'Significant increase in product comparison questions, indicating a shift in customer behavior.',
    category: 'conversations',
    type: 'trend',
    priority: 'low',
    timeFrame: 'weekly',
    date: '2025-07-14',
    metrics: [
      {
        name: 'Comparison Questions',
        value: '+42%',
        change: 42,
        trend: 'up'
      },
      {
        name: 'Research Time',
        value: '5m 20s',
        change: 18,
        trend: 'up'
      }
    ],
    details: 'Analysis of conversation logs shows customers are increasingly asking ShopBot to compare similar products before making purchase decisions. This represents a shift from previous patterns where customers typically asked about specific product features. This trend is most pronounced in electronics and home appliance categories.',
    recommendations: [
      'Enhance product comparison capabilities in the bot',
      'Create pre-built comparison templates for popular product categories',
      'Update training data to better handle comparison questions'
    ],
    chart: {
      type: 'pie',
      data: {} // Mock chart data
    }
  }
];

export function AutomatedInsights() {
  // State for active category
  const [activeCategory, setActiveCategory] = useState<InsightCategory | 'all'>('all');
  
  // State for expanded insight
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  
  // Filter insights based on active category
  const filteredInsights = activeCategory === 'all' 
    ? mockInsights 
    : mockInsights.filter(insight => insight.category === activeCategory);
  
  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    if (expandedInsight === id) {
      setExpandedInsight(null);
    } else {
      setExpandedInsight(id);
    }
  };
  
  // Get insight type badge
  const getInsightTypeBadge = (type: InsightType) => {
    switch (type) {
      case 'trend':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trend
          </Badge>
        );
      case 'anomaly':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Anomaly
          </Badge>
        );
      case 'opportunity':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Lightbulb className="h-3 w-3 mr-1" />
            Opportunity
          </Badge>
        );
      case 'achievement':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Achievement
          </Badge>
        );
    }
  };
  
  // Get priority badge
  const getPriorityBadge = (priority: InsightPriority) => {
    switch (priority) {
      case 'high':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            High Priority
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Medium Priority
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Low Priority
          </Badge>
        );
    }
  };
  
  // Get category icon
  const getCategoryIcon = (category: InsightCategory) => {
    switch (category) {
      case 'conversations':
        return <MessageSquare className="h-4 w-4" />;
      case 'sales':
        return <DollarSign className="h-4 w-4" />;
      case 'customers':
        return <Users className="h-4 w-4" />;
      case 'products':
        return <ShoppingCart className="h-4 w-4" />;
      case 'performance':
        return <Clock className="h-4 w-4" />;
    }
  };
  
  // Get chart icon
  const getChartIcon = (type: 'bar' | 'line' | 'pie') => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />;
      case 'line':
        return <LineChart className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />;
      case 'pie':
        return <PieChart className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />;
    }
  };
  
  // Get trend icon
  const getTrendIcon = (trend: 'up' | 'down' | 'stable', isPositive: boolean) => {
    if (trend === 'up') {
      return <TrendingUp className={`h-4 w-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />;
    } else if (trend === 'down') {
      return <TrendingDown className={`h-4 w-4 ${isPositive ? 'text-red-500' : 'text-green-500'}`} />;
    } else {
      return null;
    }
  };
  
  // Check if trend is positive (depends on the metric)
  const isTrendPositive = (metricName: string, trend: 'up' | 'down' | 'stable') => {
    // For metrics where lower is better
    const lowerIsBetter = [
      'response time',
      'load time',
      'abandonment',
      'cost',
      'churn'
    ];
    
    const matchesLowerIsBetter = lowerIsBetter.some(term => 
      metricName.toLowerCase().includes(term)
    );
    
    return matchesLowerIsBetter ? trend === 'down' : trend === 'up';
  };
  
  return (
    <Card className="w-full" data-testid="automated-insights">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Automated Insights</CardTitle>
            <CardDescription>
              AI-generated insights and recommendations based on your data
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh Insights
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <Button 
            variant={activeCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('all')}
          >
            All Insights
          </Button>
          <Button 
            variant={activeCategory === 'conversations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('conversations')}
            className="flex items-center gap-1"
          >
            <MessageSquare className="h-3 w-3" />
            Conversations
          </Button>
          <Button 
            variant={activeCategory === 'sales' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('sales')}
            className="flex items-center gap-1"
          >
            <DollarSign className="h-3 w-3" />
            Sales
          </Button>
          <Button 
            variant={activeCategory === 'customers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('customers')}
            className="flex items-center gap-1"
          >
            <Users className="h-3 w-3" />
            Customers
          </Button>
          <Button 
            variant={activeCategory === 'products' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('products')}
            className="flex items-center gap-1"
          >
            <ShoppingCart className="h-3 w-3" />
            Products
          </Button>
          <Button 
            variant={activeCategory === 'performance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory('performance')}
            className="flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Performance
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredInsights.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No insights found for the selected category.</p>
            </div>
          ) : (
            filteredInsights.map(insight => (
              <Card key={insight.id} className="overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(insight.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-full 
                          ${insight.category === 'conversations' ? 'bg-blue-100 text-blue-500' : 
                            insight.category === 'sales' ? 'bg-green-100 text-green-500' : 
                            insight.category === 'customers' ? 'bg-purple-100 text-purple-500' : 
                            insight.category === 'products' ? 'bg-yellow-100 text-yellow-500' : 
                            'bg-slate-100 text-slate-500'}`}
                        >
                          {getCategoryIcon(insight.category)}
                        </div>
                        {getInsightTypeBadge(insight.type)}
                        {getPriorityBadge(insight.priority)}
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {insight.timeFrame.charAt(0).toUpperCase() + insight.timeFrame.slice(1)}
                        </Badge>
                      </div>
                      
                      <h3 className="font-semibold text-lg">{insight.title}</h3>
                      <p className="text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                    
                    <div className="flex items-center">
                      {expandedInsight === insight.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                {expandedInsight === insight.id && (
                  <div className="p-4 pt-0 border-t mt-2">
                    {insight.metrics && insight.metrics.length > 0 && (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                        {insight.metrics.map((metric, index) => (
                          <div key={index} className="bg-muted/50 p-3 rounded-md">
                            <p className="text-sm text-muted-foreground">{metric.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-2xl font-bold">{metric.value}</p>
                              {metric.change && metric.trend && (
                                <div className="flex items-center">
                                  {getTrendIcon(metric.trend, isTrendPositive(metric.name, metric.trend))}
                                  <span className={`text-sm font-medium ${
                                    isTrendPositive(metric.name, metric.trend) ? 'text-green-500' : 'text-red-500'
                                  }`}>
                                    {metric.change > 0 ? '+' : ''}{metric.change}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid gap-6 sm:grid-cols-2 mt-6">
                      <div>
                        {insight.details && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold mb-2">Detailed Analysis</h4>
                            <p className="text-sm">{insight.details}</p>
                          </div>
                        )}
                        
                        {insight.recommendations && insight.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                            <ul className="space-y-2">
                              {insight.recommendations.map((recommendation, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                  <span>{recommendation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {insight.chart && (
                        <div className="border rounded-md p-4 flex items-center justify-center">
                          <div className="text-center">
                            {getChartIcon(insight.chart.type)}
                            <p className="text-muted-foreground">
                              {insight.chart.type.charAt(0).toUpperCase() + insight.chart.type.slice(1)} chart visualization
                            </p>
                            <p className="mt-2 text-sm">
                              In a production environment, this would display actual chart data.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-6">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                      <Button size="sm">
                        View Full Report
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <p>
            Insights are automatically generated daily based on your ShopBot data and updated when significant patterns are detected.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
