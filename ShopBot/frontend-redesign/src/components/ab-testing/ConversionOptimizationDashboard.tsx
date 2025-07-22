/**
 * Conversion Optimization Dashboard
 * Comprehensive dashboard for managing A/B tests, analyzing conversion barriers, and implementing psychology triggers
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye,
  MousePointer,
  DollarSign,
  Percent
} from 'lucide-react';
import { useABTesting } from '../../contexts/ABTestingContext';
import {
  ABTestExperiment,
  ConversionBarrier,
  PsychologyTrigger,
  ConversionFunnel,
  ABTestResults
} from '../../types/ABTestingTypes';

interface ConversionOptimizationDashboardProps {
  className?: string;
  compactMode?: boolean;
}

export function ConversionOptimizationDashboard({ 
  className = '',
  compactMode = false 
}: ConversionOptimizationDashboardProps) {
  const { currentExperiments, loading, error } = useABTesting();
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [conversionBarriers, setConversionBarriers] = useState<ConversionBarrier[]>([]);
  const [psychologyTriggers, setPsychologyTriggers] = useState<PsychologyTrigger[]>([]);
  const [funnelData, setFunnelData] = useState<ConversionFunnel | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading conversion barriers
    setConversionBarriers([
      {
        id: 'barrier_1',
        name: 'High Cart Abandonment',
        type: 'friction',
        description: '68% of users abandon cart at checkout',
        impact: 'high',
        frequency: 1200,
        location: { page: 'checkout', element: 'payment_form', position: 'step_3' },
        identificationMethod: 'analytics',
        suggestedSolutions: ['Simplify payment form', 'Add trust badges', 'Offer guest checkout'],
        priority: 9,
        status: 'identified'
      },
      {
        id: 'barrier_2',
        name: 'Pricing Page Confusion',
        type: 'confusion',
        description: 'Users spend 5+ minutes on pricing without converting',
        impact: 'medium',
        frequency: 800,
        location: { page: 'pricing', element: 'pricing_table', position: 'center' },
        identificationMethod: 'heatmap',
        suggestedSolutions: ['Highlight recommended plan', 'Add comparison tooltips', 'Simplify feature list'],
        priority: 7,
        status: 'testing'
      }
    ]);

    // Simulate psychology triggers
    setPsychologyTriggers([
      {
        id: 'trigger_1',
        name: 'Social Proof Counter',
        type: 'social_proof',
        description: 'Display active user count',
        implementation: {
          component: 'SocialProofCounter',
          props: { showCount: true, animate: true },
          placement: ['homepage', 'pricing']
        },
        effectiveness: { conversionLift: 23, confidenceLevel: 95, testResults: [] },
        applicablePages: ['homepage', 'pricing'],
        targetAudience: ['new_visitors'],
        isActive: true
      },
      {
        id: 'trigger_2',
        name: 'Urgency Timer',
        type: 'scarcity',
        description: 'Limited time offer countdown',
        implementation: {
          component: 'UrgencyTimer',
          props: { duration: 3600, style: 'prominent' },
          placement: ['checkout']
        },
        effectiveness: { conversionLift: 31, confidenceLevel: 92, testResults: [] },
        applicablePages: ['checkout'],
        targetAudience: ['cart_abandoners'],
        isActive: false
      }
    ]);

    // Simulate funnel data
    setFunnelData({
      id: 'main_funnel',
      name: 'Main Conversion Funnel',
      description: 'Homepage to purchase conversion flow',
      stages: [
        {
          id: 'stage_1',
          name: 'Homepage Visit',
          description: 'Initial landing page visit',
          order: 1,
          entryPoints: ['organic', 'paid', 'direct'],
          exitPoints: ['bounce', 'navigation'],
          metrics: {
            visitors: 10000,
            conversions: 3000,
            conversionRate: 0.3,
            dropoffRate: 0.7,
            averageTimeSpent: 45
          },
          barriers: [],
          optimizations: { active: [], planned: [], tested: [] }
        },
        {
          id: 'stage_2',
          name: 'Product Interest',
          description: 'User explores products/features',
          order: 2,
          entryPoints: ['homepage_cta', 'navigation'],
          exitPoints: ['bounce', 'back_button'],
          metrics: {
            visitors: 3000,
            conversions: 1500,
            conversionRate: 0.5,
            dropoffRate: 0.5,
            averageTimeSpent: 120
          },
          barriers: [],
          optimizations: { active: [], planned: [], tested: [] }
        },
        {
          id: 'stage_3',
          name: 'Pricing Consideration',
          description: 'User views pricing options',
          order: 3,
          entryPoints: ['product_page', 'features_page'],
          exitPoints: ['bounce', 'comparison_shopping'],
          metrics: {
            visitors: 1500,
            conversions: 450,
            conversionRate: 0.3,
            dropoffRate: 0.7,
            averageTimeSpent: 180
          },
          barriers: [conversionBarriers[1]],
          optimizations: { active: [], planned: [], tested: [] }
        },
        {
          id: 'stage_4',
          name: 'Purchase Decision',
          description: 'User proceeds to checkout',
          order: 4,
          entryPoints: ['pricing_page', 'trial_signup'],
          exitPoints: ['cart_abandonment', 'payment_failure'],
          metrics: {
            visitors: 450,
            conversions: 144,
            conversionRate: 0.32,
            dropoffRate: 0.68,
            averageTimeSpent: 300
          },
          barriers: [conversionBarriers[0]],
          optimizations: { active: [psychologyTriggers[0]], planned: [psychologyTriggers[1]], tested: [] }
        }
      ],
      overallMetrics: {
        totalVisitors: 10000,
        totalConversions: 144,
        overallConversionRate: 0.0144,
        averageTimeToConvert: 645,
        revenue: 43200
      },
      optimizationOpportunities: {
        highImpact: [conversionBarriers[0]],
        quickWins: [],
        longTerm: [conversionBarriers[1]]
      },
      lastAnalyzed: new Date()
    });
  }, []);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const activeExperiments = currentExperiments.filter(exp => exp.status === 'active');
    const completedExperiments = currentExperiments.filter(exp => exp.status === 'completed');
    
    const totalConversions = funnelData?.overallMetrics.totalConversions || 0;
    const conversionRate = funnelData?.overallMetrics.overallConversionRate || 0;
    const revenue = funnelData?.overallMetrics.revenue || 0;
    
    const activeTriggers = psychologyTriggers.filter(t => t.isActive).length;
    const identifiedBarriers = conversionBarriers.filter(b => b.status === 'identified').length;

    return {
      activeExperiments: activeExperiments.length,
      completedExperiments: completedExperiments.length,
      totalConversions,
      conversionRate: (conversionRate * 100).toFixed(2),
      revenue,
      activeTriggers,
      identifiedBarriers
    };
  }, [currentExperiments, funnelData, psychologyTriggers, conversionBarriers]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load conversion optimization data: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conversion Optimization</h2>
          <p className="text-gray-600">A/B testing, barrier analysis, and psychology triggers</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Play className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className={`grid ${compactMode ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tests</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.activeExperiments}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.conversionRate}%</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Impact</p>
                <p className="text-2xl font-bold text-gray-900">${(dashboardMetrics.revenue / 1000).toFixed(0)}K</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Triggers</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.activeTriggers}</p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experiments">A/B Tests</TabsTrigger>
          <TabsTrigger value="barriers">Barriers</TabsTrigger>
          <TabsTrigger value="triggers">Psychology</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Conversion Funnel Analysis
              </CardTitle>
              <CardDescription>
                Track user journey and identify optimization opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {funnelData && (
                <div className="space-y-4">
                  {funnelData.stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{stage.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{stage.metrics.visitors.toLocaleString()} visitors</span>
                            <span>{stage.metrics.conversions.toLocaleString()} conversions</span>
                            <span className="font-medium">{(stage.metrics.conversionRate * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <Progress 
                          value={stage.metrics.conversionRate * 100} 
                          className="h-2"
                        />
                        {stage.barriers.length > 0 && (
                          <div className="mt-2 flex items-center text-sm text-amber-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            {stage.barriers.length} barrier{stage.barriers.length > 1 ? 's' : ''} identified
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Social Proof Counter activated on homepage</span>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">New A/B test "Checkout Flow V2" started</span>
                  <span className="text-xs text-gray-400">1 day ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Conversion barrier identified in pricing page</span>
                  <span className="text-xs text-gray-400">2 days ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active A/B Tests</CardTitle>
              <CardDescription>
                Monitor running experiments and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentExperiments.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active experiments</p>
                  <Button className="mt-4">Create Your First Test</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentExperiments.map((experiment) => (
                    <div key={experiment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{experiment.name}</h4>
                          <p className="text-sm text-gray-600">{experiment.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={experiment.status === 'active' ? 'default' : 'secondary'}>
                            {experiment.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Sample Size:</span>
                          <span className="ml-2 font-medium">{experiment.sampleSize.current}/{experiment.sampleSize.required}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-2 font-medium">{experiment.confidence}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-2 font-medium">{experiment.duration.estimatedDuration} days</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barriers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Conversion Barriers
              </CardTitle>
              <CardDescription>
                Identified obstacles preventing user conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionBarriers.map((barrier) => (
                  <div key={barrier.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{barrier.name}</h4>
                          <Badge variant={barrier.impact === 'high' ? 'destructive' : barrier.impact === 'medium' ? 'default' : 'secondary'}>
                            {barrier.impact} impact
                          </Badge>
                          <Badge variant="outline">
                            {barrier.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{barrier.description}</p>
                        <div className="text-xs text-gray-500">
                          {barrier.location.page} • {barrier.frequency.toLocaleString()} affected users
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={barrier.status === 'identified' ? 'secondary' : barrier.status === 'testing' ? 'default' : 'outline'}>
                          {barrier.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Fix
                        </Button>
                      </div>
                    </div>
                    {barrier.suggestedSolutions.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2">Suggested Solutions:</p>
                        <div className="flex flex-wrap gap-1">
                          {barrier.suggestedSolutions.map((solution, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {solution}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Psychology Triggers
              </CardTitle>
              <CardDescription>
                Behavioral psychology elements to boost conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {psychologyTriggers.map((trigger) => (
                  <div key={trigger.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{trigger.name}</h4>
                          <Badge variant="outline">
                            {trigger.type.replace('_', ' ')}
                          </Badge>
                          {trigger.isActive && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{trigger.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>+{trigger.effectiveness.conversionLift}% conversion lift</span>
                          <span>{trigger.effectiveness.confidenceLevel}% confidence</span>
                          <span>{trigger.applicablePages.length} page{trigger.applicablePages.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant={trigger.isActive ? "default" : "outline"} 
                          size="sm"
                        >
                          {trigger.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pages:</span>
                        <div className="flex space-x-1">
                          {trigger.applicablePages.map((page, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {page}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ConversionOptimizationDashboard;
