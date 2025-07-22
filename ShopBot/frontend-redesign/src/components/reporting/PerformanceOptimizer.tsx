'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  BarChart3, 
  Zap, 
  Settings, 
  MessageSquare,
  ShoppingCart,
  Users,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Types for performance recommendations
type OptimizationCategory = 'conversation' | 'product' | 'customer' | 'technical' | 'marketing';
type ImpactLevel = 'high' | 'medium' | 'low';
type EffortLevel = 'high' | 'medium' | 'low';
type ImplementationStatus = 'not_started' | 'in_progress' | 'completed' | 'dismissed';

interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  category: OptimizationCategory;
  impact: ImpactLevel;
  effort: EffortLevel;
  status: ImplementationStatus;
  estimatedImprovement: string;
  steps: ImplementationStep[];
  resources?: Resource[];
}

interface ImplementationStep {
  id: string;
  description: string;
  completed: boolean;
}

interface Resource {
  title: string;
  type: 'documentation' | 'video' | 'template' | 'example';
  url: string;
}

// Mock data for recommendations
const mockRecommendations: OptimizationRecommendation[] = [
  {
    id: 'rec-001',
    title: 'Optimize Product Recommendation Algorithm',
    description: 'Enhance the accuracy of product recommendations by implementing collaborative filtering and leveraging customer purchase history.',
    category: 'product',
    impact: 'high',
    effort: 'medium',
    status: 'not_started',
    estimatedImprovement: '+15% conversion rate',
    steps: [
      {
        id: 'step-001-1',
        description: 'Update recommendation engine to include collaborative filtering',
        completed: false
      },
      {
        id: 'step-001-2',
        description: 'Integrate purchase history data into recommendation algorithm',
        completed: false
      },
      {
        id: 'step-001-3',
        description: 'Implement A/B testing to validate improvements',
        completed: false
      },
      {
        id: 'step-001-4',
        description: 'Monitor and fine-tune algorithm based on performance metrics',
        completed: false
      }
    ],
    resources: [
      {
        title: 'Recommendation Engine Documentation',
        type: 'documentation',
        url: '/docs/recommendation-engine'
      },
      {
        title: 'Collaborative Filtering Implementation Guide',
        type: 'documentation',
        url: '/docs/collaborative-filtering'
      },
      {
        title: 'A/B Testing Template',
        type: 'template',
        url: '/templates/ab-testing'
      }
    ]
  },
  {
    id: 'rec-002',
    title: 'Improve Conversation Flow for Cart Abandonment',
    description: 'Enhance the conversation flow for customers who abandon their shopping carts to increase recovery rate.',
    category: 'conversation',
    impact: 'high',
    effort: 'low',
    status: 'in_progress',
    estimatedImprovement: '+23% cart recovery',
    steps: [
      {
        id: 'step-002-1',
        description: 'Analyze current cart abandonment patterns',
        completed: true
      },
      {
        id: 'step-002-2',
        description: 'Design new conversation flow with personalized incentives',
        completed: true
      },
      {
        id: 'step-002-3',
        description: 'Implement follow-up message sequence',
        completed: false
      },
      {
        id: 'step-002-4',
        description: 'Set up tracking for recovery metrics',
        completed: false
      }
    ],
    resources: [
      {
        title: 'Cart Abandonment Strategy Guide',
        type: 'documentation',
        url: '/docs/cart-abandonment'
      },
      {
        title: 'Example Recovery Sequences',
        type: 'example',
        url: '/examples/recovery-sequences'
      }
    ]
  },
  {
    id: 'rec-003',
    title: 'Optimize Response Time with Caching',
    description: 'Implement strategic caching for frequently accessed data to improve bot response times.',
    category: 'technical',
    impact: 'medium',
    effort: 'medium',
    status: 'not_started',
    estimatedImprovement: '40% faster response time',
    steps: [
      {
        id: 'step-003-1',
        description: 'Identify frequently accessed data patterns',
        completed: false
      },
      {
        id: 'step-003-2',
        description: 'Implement Redis caching layer',
        completed: false
      },
      {
        id: 'step-003-3',
        description: 'Set up cache invalidation rules',
        completed: false
      },
      {
        id: 'step-003-4',
        description: 'Benchmark performance improvements',
        completed: false
      }
    ],
    resources: [
      {
        title: 'Redis Caching Implementation',
        type: 'documentation',
        url: '/docs/redis-caching'
      },
      {
        title: 'Performance Benchmarking Tutorial',
        type: 'video',
        url: '/videos/performance-benchmarking'
      }
    ]
  },
  {
    id: 'rec-004',
    title: 'Enhance Customer Segmentation',
    description: 'Refine customer segmentation to deliver more personalized shopping experiences.',
    category: 'customer',
    impact: 'high',
    effort: 'high',
    status: 'not_started',
    estimatedImprovement: '+18% customer engagement',
    steps: [
      {
        id: 'step-004-1',
        description: 'Define advanced segmentation criteria',
        completed: false
      },
      {
        id: 'step-004-2',
        description: 'Implement machine learning clustering algorithm',
        completed: false
      },
      {
        id: 'step-004-3',
        description: 'Create personalized conversation flows for each segment',
        completed: false
      },
      {
        id: 'step-004-4',
        description: 'Set up automated segment assignment for new customers',
        completed: false
      }
    ],
    resources: [
      {
        title: 'Customer Segmentation Guide',
        type: 'documentation',
        url: '/docs/customer-segmentation'
      },
      {
        title: 'ML Clustering Implementation',
        type: 'documentation',
        url: '/docs/ml-clustering'
      }
    ]
  },
  {
    id: 'rec-005',
    title: 'Implement Cross-Sell Conversation Triggers',
    description: 'Add intelligent cross-sell recommendations during specific conversation points.',
    category: 'marketing',
    impact: 'medium',
    effort: 'low',
    status: 'completed',
    estimatedImprovement: '+12% average order value',
    steps: [
      {
        id: 'step-005-1',
        description: 'Identify optimal conversation points for cross-selling',
        completed: true
      },
      {
        id: 'step-005-2',
        description: 'Develop cross-sell recommendation algorithm',
        completed: true
      },
      {
        id: 'step-005-3',
        description: 'Implement conversation triggers',
        completed: true
      },
      {
        id: 'step-005-4',
        description: 'Monitor performance and refine approach',
        completed: true
      }
    ],
    resources: [
      {
        title: 'Cross-Selling Best Practices',
        type: 'documentation',
        url: '/docs/cross-selling'
      },
      {
        title: 'Conversation Trigger Examples',
        type: 'example',
        url: '/examples/conversation-triggers'
      }
    ]
  },
  {
    id: 'rec-006',
    title: 'Optimize Mobile Conversation Experience',
    description: 'Enhance the conversation interface and flow specifically for mobile users.',
    category: 'technical',
    impact: 'medium',
    effort: 'medium',
    status: 'not_started',
    estimatedImprovement: '+20% mobile engagement',
    steps: [
      {
        id: 'step-006-1',
        description: 'Analyze current mobile user experience pain points',
        completed: false
      },
      {
        id: 'step-006-2',
        description: 'Redesign conversation UI for mobile optimization',
        completed: false
      },
      {
        id: 'step-006-3',
        description: 'Implement responsive design improvements',
        completed: false
      },
      {
        id: 'step-006-4',
        description: 'Test performance across different mobile devices',
        completed: false
      }
    ],
    resources: [
      {
        title: 'Mobile UX Optimization Guide',
        type: 'documentation',
        url: '/docs/mobile-optimization'
      },
      {
        title: 'Mobile Testing Framework',
        type: 'template',
        url: '/templates/mobile-testing'
      }
    ]
  }
];

export function PerformanceOptimizer() {
  // State for active tab
  const [activeTab, setActiveTab] = useState<'all' | 'high_impact' | 'in_progress' | 'completed'>('all');
  
  // State for expanded recommendation
  const [expandedRecommendation, setExpandedRecommendation] = useState<string | null>(null);
  
  // State for recommendations
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>(mockRecommendations);
  
  // Filter recommendations based on active tab
  const filteredRecommendations = recommendations.filter(rec => {
    if (activeTab === 'all') return true;
    if (activeTab === 'high_impact') return rec.impact === 'high';
    if (activeTab === 'in_progress') return rec.status === 'in_progress';
    if (activeTab === 'completed') return rec.status === 'completed';
    return true;
  });
  
  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    if (expandedRecommendation === id) {
      setExpandedRecommendation(null);
    } else {
      setExpandedRecommendation(id);
    }
  };
  
  // Update recommendation status
  const updateStatus = (id: string, status: ImplementationStatus) => {
    setRecommendations(prev => 
      prev.map(rec => {
        if (rec.id === id) {
          return { ...rec, status };
        }
        return rec;
      })
    );
  };
  
  // Toggle step completion
  const toggleStep = (recId: string, stepId: string) => {
    setRecommendations(prev => 
      prev.map(rec => {
        if (rec.id === recId) {
          const updatedSteps = rec.steps.map(step => {
            if (step.id === stepId) {
              return { ...step, completed: !step.completed };
            }
            return step;
          });
          
          // Check if all steps are completed
          const allCompleted = updatedSteps.every(step => step.completed);
          
          return { 
            ...rec, 
            steps: updatedSteps,
            status: allCompleted ? 'completed' : rec.status === 'not_started' ? 'in_progress' : rec.status
          };
        }
        return rec;
      })
    );
  };
  
  // Get impact badge
  const getImpactBadge = (impact: ImpactLevel) => {
    switch (impact) {
      case 'high':
        return (
          <Badge className="bg-green-500 hover:bg-green-500/90">High Impact</Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary">Medium Impact</Badge>
        );
      case 'low':
        return (
          <Badge variant="outline">Low Impact</Badge>
        );
    }
  };
  
  // Get effort badge
  const getEffortBadge = (effort: EffortLevel) => {
    switch (effort) {
      case 'high':
        return (
          <Badge variant="destructive">High Effort</Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary">Medium Effort</Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">Low Effort</Badge>
        );
    }
  };
  
  // Get status badge
  const getStatusBadge = (status: ImplementationStatus) => {
    switch (status) {
      case 'not_started':
        return (
          <Badge variant="outline" className="bg-muted">Not Started</Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-500/90">In Progress</Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500 hover:bg-green-500/90">Completed</Badge>
        );
      case 'dismissed':
        return (
          <Badge variant="outline">Dismissed</Badge>
        );
    }
  };
  
  // Get category icon
  const getCategoryIcon = (category: OptimizationCategory) => {
    switch (category) {
      case 'conversation':
        return <MessageSquare className="h-4 w-4" />;
      case 'product':
        return <ShoppingCart className="h-4 w-4" />;
      case 'customer':
        return <Users className="h-4 w-4" />;
      case 'technical':
        return <Settings className="h-4 w-4" />;
      case 'marketing':
        return <BarChart3 className="h-4 w-4" />;
    }
  };
  
  // Calculate implementation progress
  const getImplementationProgress = (rec: OptimizationRecommendation) => {
    if (rec.status === 'completed') return 100;
    if (rec.status === 'not_started') return 0;
    
    const completedSteps = rec.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / rec.steps.length) * 100);
  };
  
  // Calculate overall optimization score
  const calculateOptimizationScore = () => {
    const totalRecs = recommendations.length;
    const completedRecs = recommendations.filter(rec => rec.status === 'completed').length;
    const inProgressRecs = recommendations.filter(rec => rec.status === 'in_progress').length;
    
    // Weighted calculation: completed = 1 point, in progress = 0.5 points
    const score = Math.round(((completedRecs + (inProgressRecs * 0.5)) / totalRecs) * 100);
    return score;
  };
  
  const optimizationScore = calculateOptimizationScore();
  
  return (
    <Card className="w-full" data-testid="performance-optimizer">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Performance Optimizer</CardTitle>
            <CardDescription>
              Actionable recommendations to improve your ShopBot performance
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-medium">Optimization Score</p>
              <p className="text-2xl font-bold">{optimizationScore}%</p>
            </div>
            <div className="h-14 w-14 rounded-full border-4 border-muted flex items-center justify-center">
              <Zap className={`h-6 w-6 ${optimizationScore >= 70 ? 'text-green-500' : optimizationScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`} />
            </div>
          </div>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'all' | 'high_impact' | 'in_progress' | 'completed')}
          className="mt-4"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="high_impact">High Impact</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredRecommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recommendations found for the selected filter.</p>
            </div>
          ) : (
            filteredRecommendations.map(rec => (
              <div 
                key={rec.id}
                className="border rounded-lg overflow-hidden transition-all"
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(rec.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full 
                        ${rec.category === 'conversation' ? 'bg-blue-100 text-blue-500' : 
                          rec.category === 'product' ? 'bg-purple-100 text-purple-500' : 
                          rec.category === 'customer' ? 'bg-yellow-100 text-yellow-500' : 
                          rec.category === 'technical' ? 'bg-slate-100 text-slate-500' : 
                          'bg-green-100 text-green-500'}`}
                      >
                        {getCategoryIcon(rec.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{rec.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {rec.category}
                          </Badge>
                          {getStatusBadge(rec.status)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-green-600">{rec.estimatedImprovement}</p>
                        <div className="flex gap-2 mt-1">
                          {getImpactBadge(rec.impact)}
                          {getEffortBadge(rec.effort)}
                        </div>
                      </div>
                      
                      {expandedRecommendation === rec.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  <div className="sm:hidden mt-2">
                    <p className="text-sm font-medium text-green-600">{rec.estimatedImprovement}</p>
                    <div className="flex gap-2 mt-1">
                      {getImpactBadge(rec.impact)}
                      {getEffortBadge(rec.effort)}
                    </div>
                  </div>
                  
                  {rec.status !== 'completed' && rec.status !== 'not_started' && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">Implementation Progress</p>
                        <p className="text-xs font-medium">{getImplementationProgress(rec)}%</p>
                      </div>
                      <Progress value={getImplementationProgress(rec)} className="h-1" />
                    </div>
                  )}
                </div>
                
                {expandedRecommendation === rec.id && (
                  <div className="p-4 pt-0 border-t mt-2">
                    <p className="text-muted-foreground mb-4">{rec.description}</p>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Implementation Steps</h4>
                        <div className="space-y-2">
                          {rec.steps.map(step => (
                            <div 
                              key={step.id}
                              className="flex items-start gap-2"
                            >
                              <div 
                                className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center cursor-pointer
                                  ${step.completed ? 'bg-primary border-primary' : 'border-muted-foreground'}`}
                                onClick={() => toggleStep(rec.id, step.id)}
                              >
                                {step.completed && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                              </div>
                              <p className={`text-sm ${step.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {step.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {rec.resources && rec.resources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Resources</h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {rec.resources.map((resource, i) => (
                              <Button 
                                key={i} 
                                variant="outline" 
                                className="justify-start"
                                asChild
                              >
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                  {resource.type === 'documentation' && <AlertCircle className="h-4 w-4 mr-2" />}
                                  {resource.type === 'video' && <Lightbulb className="h-4 w-4 mr-2" />}
                                  {resource.type === 'template' && <Clock className="h-4 w-4 mr-2" />}
                                  {resource.type === 'example' && <CheckCircle2 className="h-4 w-4 mr-2" />}
                                  {resource.title}
                                </a>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 pt-2">
                        {rec.status !== 'completed' && (
                          <Button 
                            variant="outline"
                            onClick={() => updateStatus(rec.id, 'dismissed')}
                          >
                            Dismiss
                          </Button>
                        )}
                        
                        {rec.status === 'not_started' && (
                          <Button 
                            onClick={() => updateStatus(rec.id, 'in_progress')}
                          >
                            Start Implementation
                          </Button>
                        )}
                        
                        {rec.status === 'in_progress' && (
                          <Button 
                            onClick={() => updateStatus(rec.id, 'completed')}
                            disabled={!rec.steps.every(step => step.completed)}
                          >
                            Mark as Completed
                          </Button>
                        )}
                        
                        {rec.status === 'completed' && (
                          <Button 
                            variant="outline"
                            onClick={() => updateStatus(rec.id, 'in_progress')}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col items-start">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          <p>
            Recommendations are updated weekly based on your ShopBot performance data.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}

export { PerformanceOptimizer };
