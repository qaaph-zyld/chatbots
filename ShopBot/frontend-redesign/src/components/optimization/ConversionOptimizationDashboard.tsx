'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LineChart, BarChart } from '@/components/charts';
import { 
  useConversionOptimizer, 
  ConversionFunnel, 
  FunnelAnalytics, 
  OptimizationRecommendation
} from '@/lib/optimization/ConversionOptimizer';
import { 
  TrendingUp, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3, 
  LineChart as LineChartIcon,
  Lightbulb
} from 'lucide-react';

// Helper functions
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60000).toFixed(1)} min`;
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const getImpactColor = (impact: 'high' | 'medium' | 'low'): string => {
  switch (impact) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getEffortColor = (effort: 'high' | 'medium' | 'low'): string => {
  switch (effort) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Components
interface FunnelCardProps {
  funnel: ConversionFunnel;
  analytics?: FunnelAnalytics | undefined;
  onSelect: () => void;
}

const FunnelCard: React.FC<FunnelCardProps> = ({ funnel, analytics, onSelect }) => {
  const conversionRate = analytics?.conversionRate || 0;
  const expectedRate = funnel.expectedConversionRate || 0;
  const isPerformingWell = expectedRate > 0 ? conversionRate >= expectedRate * 0.9 : conversionRate > 0.1;
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">{funnel.name}</CardTitle>
          {analytics && (
            <Badge className={isPerformingWell ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {formatPercentage(analytics.conversionRate)}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          {funnel.steps.length} steps • {analytics ? formatDate(analytics.timestamp) : 'No data'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {analytics ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Conversion Rate</span>
              <div className="flex items-center">
                {expectedRate > 0 && (
                  <span className="text-xs text-gray-400 mr-2">
                    Target: {formatPercentage(expectedRate)}
                  </span>
                )}
                <span className={`text-sm ${isPerformingWell ? 'text-green-600' : 'text-yellow-600'}`}>
                  {formatPercentage(analytics.conversionRate)}
                </span>
              </div>
            </div>
            <Progress 
              value={expectedRate > 0 ? (conversionRate / expectedRate) * 100 : conversionRate * 100} 
              className="h-2"
            />
          </>
        ) : (
          <div className="text-center py-2 text-gray-400 text-sm">
            No analytics available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface RecommendationCardProps {
  recommendation: OptimizationRecommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  return (
    <Alert className="mb-4">
      <Lightbulb className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {recommendation.title}
        <div className="flex gap-1">
          <Badge className={getImpactColor(recommendation.impact)}>
            {recommendation.impact} impact
          </Badge>
          <Badge className={getEffortColor(recommendation.effort)}>
            {recommendation.effort} effort
          </Badge>
        </div>
      </AlertTitle>
      <AlertDescription>
        <p className="mt-1">{recommendation.description}</p>
        <p className="text-sm font-medium mt-2">Potential gain: {recommendation.potentialGain}</p>
        {recommendation.implementationSteps && (
          <div className="mt-2">
            <p className="text-sm font-medium">Implementation steps:</p>
            <ul className="list-disc pl-5 text-sm mt-1">
              {recommendation.implementationSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

interface ConversionOptimizationDashboardProps {
  compact?: boolean;
}

export function ConversionOptimizationDashboard({ compact = false }: ConversionOptimizationDashboardProps) {
  const { funnels, analytics, recommendations, trackAction, trackConversion, defineFunnel } = useConversionOptimizer();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  
  // Get the selected funnel and its analytics
  const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);
  const selectedAnalytics = analytics.find(a => a.funnelId === selectedFunnelId);
  
  // Prepare funnel visualization data
  const prepareFunnelData = (funnel?: ConversionFunnel, analytics?: FunnelAnalytics) => {
    if (!funnel || !analytics) return { labels: [], datasets: [{ label: 'Steps', data: [] }] };
    
    return {
      labels: funnel.steps,
      datasets: [
        {
          label: 'Completions',
          data: funnel.steps.map(step => analytics.stepCompletions[step] || 0),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
        }
      ]
    };
  };
  
  // Prepare drop-off visualization data
  const prepareDropOffData = (analytics?: FunnelAnalytics) => {
    if (!analytics || !analytics.dropOffPoints?.length) {
      return { labels: [], datasets: [{ label: 'Drop-off Rate', data: [] }] };
    }
    
    return {
      labels: analytics.dropOffPoints.map(p => p.step),
      datasets: [
        {
          label: 'Drop-off Rate',
          data: analytics.dropOffPoints.map(p => p.dropOffRate * 100),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
        }
      ]
    };
  };
  
  // Calculate overall conversion health
  const calculateOverallHealth = (): number => {
    if (analytics.length === 0) return 100;
    
    let score = 100;
    let totalWeight = 0;
    
    analytics.forEach(a => {
      const funnel = funnels.find(f => f.id === a.funnelId);
      if (!funnel) return;
      
      const weight = funnel.id === 'purchase_funnel' ? 3 : 1; // Weight purchase funnel higher
      totalWeight += weight;
      
      if (funnel.expectedConversionRate) {
        const ratio = a.conversionRate / funnel.expectedConversionRate;
        if (ratio < 0.5) {
          score -= 30 * weight;
        } else if (ratio < 0.8) {
          score -= 15 * weight;
        } else if (ratio < 0.95) {
          score -= 5 * weight;
        }
      } else if (a.conversionRate < 0.05) {
        score -= 20 * weight;
      } else if (a.conversionRate < 0.1) {
        score -= 10 * weight;
      }
      
      // Penalize for high drop-off points
      const highDropOffs = a.dropOffPoints?.filter(p => p.dropOffRate > 0.5).length || 0;
      score -= highDropOffs * 5 * weight;
    });
    
    return Math.max(0, Math.min(100, totalWeight > 0 ? score / totalWeight : score));
  };
  
  const overallHealth = calculateOverallHealth();
  
  // Get health status
  const getHealthStatus = (): { label: string; color: string } => {
    if (overallHealth >= 90) {
      return { label: 'Excellent', color: 'text-green-500' };
    } else if (overallHealth >= 70) {
      return { label: 'Good', color: 'text-blue-500' };
    } else if (overallHealth >= 50) {
      return { label: 'Fair', color: 'text-yellow-500' };
    } else {
      return { label: 'Needs Improvement', color: 'text-red-500' };
    }
  };
  
  const healthStatus = getHealthStatus();
  
  // Adjust layout based on compact mode
  return (
    <div className={`${compact ? '' : 'container mx-auto py-6'}`}>
      {!compact && (
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Conversion Optimization Dashboard</h1>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className={`space-y-4 ${compact ? 'text-sm' : ''}`}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnels">Conversion Funnels</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Health</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">{Math.round(overallHealth)}</div>
                  <span className={`ml-2 ${healthStatus.color}`}>{healthStatus.label}</span>
                </div>
                <Progress value={overallHealth} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Funnels</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{funnels.length}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.length} with data
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recommendations.length}</div>
                <p className="text-xs text-muted-foreground">
                  {recommendations.filter(r => r.impact === 'high').length} high impact
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Conversion</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {analytics.length > 0 ? (
                  <>
                    <div className="text-2xl font-bold">
                      {formatPercentage(Math.max(...analytics.map(a => a.conversionRate)))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Best performing funnel
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnels</CardTitle>
                <CardDescription>
                  Performance of your key conversion funnels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnels.length > 0 ? (
                    funnels.slice(0, 3).map((funnel, index) => {
                      const funnelAnalytics = analytics.find(a => a.funnelId === funnel.id);
                      return (
                        <FunnelCard 
                          key={index} 
                          funnel={funnel} 
                          analytics={funnelAnalytics}
                          onSelect={() => {
                            setSelectedFunnelId(funnel.id);
                            setActiveTab('funnels');
                          }}
                        />
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No funnels defined yet
                    </div>
                  )}
                  
                  {funnels.length > 3 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('funnels')}
                    >
                      View all {funnels.length} funnels
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Recommendations</CardTitle>
                <CardDescription>
                  Actionable insights to improve your conversion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.length > 0 ? (
                    recommendations
                      .sort((a, b) => {
                        const impactValue = { high: 3, medium: 2, low: 1 };
                        return impactValue[b.impact] - impactValue[a.impact];
                      })
                      .slice(0, 2)
                      .map((recommendation, index) => (
                        <RecommendationCard key={index} recommendation={recommendation} />
                      ))
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No recommendations available yet
                    </div>
                  )}
                  
                  {recommendations.length > 2 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('recommendations')}
                    >
                      View all {recommendations.length} recommendations
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Funnels Tab */}
        <TabsContent value="funnels">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnels</CardTitle>
                  <CardDescription>
                    Select a funnel to view detailed analytics
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto">
                  <div className="space-y-4">
                    {funnels.map((funnel, index) => {
                      const funnelAnalytics = analytics.find(a => a.funnelId === funnel.id);
                      return (
                        <FunnelCard 
                          key={index} 
                          funnel={funnel} 
                          analytics={funnelAnalytics}
                          onSelect={() => setSelectedFunnelId(funnel.id)}
                        />
                      );
                    })}
                    
                    {funnels.length === 0 && (
                      <div className="text-center py-4 text-gray-400">
                        No funnels defined yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              {selectedFunnel ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{selectedFunnel.name}</CardTitle>
                          <CardDescription>
                            {selectedFunnel.description || `${selectedFunnel.steps.length} steps conversion funnel`}
                          </CardDescription>
                        </div>
                        {selectedAnalytics && (
                          <Badge className={selectedAnalytics.conversionRate >= 0.1 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {formatPercentage(selectedAnalytics.conversionRate)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedAnalytics ? (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Funnel Performance</h3>
                            <div className="h-64">
                              <BarChart data={prepareFunnelData(selectedFunnel, selectedAnalytics)} />
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Drop-off Points</h3>
                            <div className="h-64">
                              <LineChart data={prepareDropOffData(selectedAnalytics)} />
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Conversion Metrics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card>
                                <CardHeader className="py-2">
                                  <CardTitle className="text-sm">Conversion Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">{formatPercentage(selectedAnalytics.conversionRate)}</div>
                                  {selectedFunnel.expectedConversionRate && (
                                    <div className="flex items-center mt-1">
                                      <span className="text-xs text-gray-500 mr-2">Target:</span>
                                      <span className="text-sm">{formatPercentage(selectedFunnel.expectedConversionRate)}</span>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardHeader className="py-2">
                                  <CardTitle className="text-sm">Average Time</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">{formatDuration(selectedAnalytics.averageCompletionTime)}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    From first to last step
                                  </div>
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardHeader className="py-2">
                                  <CardTitle className="text-sm">Total Entries</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">{selectedAnalytics.totalEntries}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Last updated: {formatDate(selectedAnalytics.timestamp)}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Steps Analysis</h3>
                            <div className="space-y-2">
                              {selectedFunnel.steps.map((step, index) => {
                                const completions = selectedAnalytics.stepCompletions[step] || 0;
                                const dropOff = selectedAnalytics.dropOffPoints?.find(p => p.step === step);
                                const dropOffRate = dropOff ? dropOff.dropOffRate : 0;
                                const isLastStep = index === selectedFunnel.steps.length - 1;
                                
                                return (
                                  <div key={index} className="flex items-center">
                                    <div className="w-1/4 text-sm">{step}</div>
                                    <div className="w-1/2">
                                      <Progress 
                                        value={(completions / selectedAnalytics.totalEntries) * 100} 
                                        className="h-2"
                                      />
                                    </div>
                                    <div className="w-1/4 pl-4 flex items-center">
                                      <span className="text-sm">{completions} users</span>
                                      {!isLastStep && dropOffRate > 0.1 && (
                                        <div className="ml-2 flex items-center text-red-500 text-xs">
                                          <ArrowDownRight className="h-3 w-3 mr-1" />
                                          {formatPercentage(dropOffRate)}
                                        </div>
                                      )}
                                      {!isLastStep && dropOffRate <= 0.1 && dropOffRate > 0 && (
                                        <div className="ml-2 flex items-center text-green-500 text-xs">
                                          <ArrowUpRight className="h-3 w-3 mr-1" />
                                          Low drop-off
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-gray-400">
                          <LineChartIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <h3 className="text-lg font-medium">No analytics data available</h3>
                          <p className="mt-2">Analytics data will appear here as users interact with your funnel</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {selectedAnalytics && recommendations.some(r => r.targetArea === selectedFunnel.name || selectedFunnel.steps.includes(r.targetArea)) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Funnel-Specific Recommendations</CardTitle>
                        <CardDescription>
                          Actionable insights to improve this conversion funnel
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recommendations
                            .filter(r => r.targetArea === selectedFunnel.name || selectedFunnel.steps.includes(r.targetArea))
                            .map((recommendation, index) => (
                              <RecommendationCard key={index} recommendation={recommendation} />
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Filter className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-500">Select a Funnel</h3>
                    <p className="text-gray-400 mt-2">
                      Choose a funnel from the list to view detailed analytics
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Optimization Recommendations</CardTitle>
                  <CardDescription>
                    Actionable insights to improve your conversion rates
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recommendations.length > 0 ? (
                <div className="space-y-6">
                  {recommendations
                    .sort((a, b) => {
                      const impactValue = { high: 3, medium: 2, low: 1 };
                      return impactValue[b.impact] - impactValue[a.impact];
                    })
                    .map((recommendation, index) => (
                      <RecommendationCard key={index} recommendation={recommendation} />
                    ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <Lightbulb className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No recommendations available</h3>
                  <p className="mt-2">
                    Recommendations will appear here as more user data is collected
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
