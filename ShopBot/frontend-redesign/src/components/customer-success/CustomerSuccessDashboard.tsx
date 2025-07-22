/**
 * Customer Success Dashboard
 * AI-powered customer success prediction and proactive engagement interface
 * Part of Phase 3: Market Leadership - Advanced Reporting & Insights
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  Users, TrendingUp, AlertTriangle, CheckCircle, Target, Brain,
  Phone, Mail, Calendar, Zap, Shield, Heart, Activity, Award,
  ArrowUp, ArrowDown, Minus, Clock, Star, MessageSquare
} from 'lucide-react';

import CustomerSuccessService from '../../services/CustomerSuccessService';
import { 
  CustomerSuccessProfile, SuccessAnalytics, PredictionResult,
  SuccessRecommendation, RiskLevel, HealthScore
} from '../../types/CustomerSuccessTypes';

const CustomerSuccessDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profiles, setProfiles] = useState<CustomerSuccessProfile[]>([]);
  const [analytics, setAnalytics] = useState<SuccessAnalytics | null>(null);
  const [predictions, setPredictions] = useState<Map<string, PredictionResult[]>>(new Map());
  const [recommendations, setRecommendations] = useState<Map<string, SuccessRecommendation[]>>(new Map());
  const [selectedProfile, setSelectedProfile] = useState<CustomerSuccessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const successService = CustomerSuccessService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allProfiles = successService.getAllProfiles();
      const analyticsData = await successService.getSuccessAnalytics();
      
      setProfiles(allProfiles);
      setAnalytics(analyticsData);
      
      // Load predictions and recommendations for each profile
      const predictionsMap = new Map();
      const recommendationsMap = new Map();
      
      for (const profile of allProfiles) {
        const profilePredictions = await successService.generatePredictions(profile.customerId);
        const profileRecommendations = await successService.generateRecommendations(profile.customerId);
        
        predictionsMap.set(profile.id, profilePredictions);
        recommendationsMap.set(profile.id, profileRecommendations);
      }
      
      setPredictions(predictionsMap);
      setRecommendations(recommendationsMap);
    } catch (error) {
      console.error('Error loading customer success data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshHealthScore = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;

    try {
      const newHealthScore = await successService.calculateHealthScore(profile.customerId);
      const updatedProfiles = profiles.map(p => 
        p.id === profileId ? { ...p, healthScore: newHealthScore } : p
      );
      setProfiles(updatedProfiles);
    } catch (error) {
      console.error('Error refreshing health score:', error);
    }
  };

  const triggerEngagement = async (profileId: string) => {
    try {
      const actions = await successService.triggerEngagement(profileId, 'at_risk_engagement');
      alert(`Triggered ${actions.length} engagement actions successfully!`);
    } catch (error) {
      console.error('Error triggering engagement:', error);
    }
  };

  const getRiskColor = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <Heart className="h-4 w-4 text-green-600" />;
    if (score >= 60) return <Activity className="h-4 w-4 text-yellow-600" />;
    if (score >= 40) return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    return <Shield className="h-4 w-4 text-red-600" />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <ArrowDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-blue-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatProbability = (prob: number) => `${Math.round(prob * 100)}%`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Customer Success Prediction
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered customer success forecasting and proactive engagement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadData} disabled={isLoading} size="sm" variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.overview.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Healthy Customers</p>
                <p className="text-2xl font-bold text-green-600">{analytics.overview.healthyCustomers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">At Risk</p>
                <p className="text-2xl font-bold text-red-600">{analytics.overview.atRiskCustomers}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Health Score</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(analytics.overview.averageHealthScore)}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            {analytics && (
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Risk Distribution
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Low Risk</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(analytics.riskAnalysis.riskDistribution.low / analytics.overview.totalCustomers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{analytics.riskAnalysis.riskDistribution.low}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medium Risk</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ width: `${(analytics.riskAnalysis.riskDistribution.medium / analytics.overview.totalCustomers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{analytics.riskAnalysis.riskDistribution.medium}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High Risk</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${(analytics.riskAnalysis.riskDistribution.high / analytics.overview.totalCustomers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{analytics.riskAnalysis.riskDistribution.high}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Critical Risk</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${(analytics.riskAnalysis.riskDistribution.critical / analytics.overview.totalCustomers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{analytics.riskAnalysis.riskDistribution.critical}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top Risk Factors */}
            {analytics && (
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Top Risk Factors
                </h3>
                
                <div className="space-y-3">
                  {analytics.riskAnalysis.topRiskFactors.map((factor, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{factor.name}</span>
                        <span className="text-sm text-red-600">
                          {Math.round(factor.frequency * 100)}% frequency
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{factor.description}</p>
                      <p className="text-xs text-blue-600">
                        <strong>Mitigation:</strong> {factor.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map(profile => (
              <div key={profile.id} className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{profile.customerName}</h3>
                    <p className="text-sm text-gray-600">{profile.segment} • {profile.tier}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(profile.riskLevel)}`}>
                    {profile.riskLevel} risk
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      {getHealthIcon(profile.healthScore.overall)}
                      Health Score
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{profile.healthScore.overall}</span>
                      {getTrendIcon(profile.healthScore.trend)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Churn Risk</span>
                    <span className="font-medium text-red-600">
                      {formatProbability(profile.churnProbability)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expansion Opportunity</span>
                    <span className="font-medium text-green-600">
                      {formatProbability(profile.expansionProbability)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Interaction</span>
                    <span className="text-sm">
                      {Math.round((Date.now() - profile.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => refreshHealthScore(profile.id)} 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                  >
                    <Activity className="h-3 w-3 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    onClick={() => triggerEngagement(profile.id)} 
                    size="sm"
                    className="flex-1"
                  >
                    <MessageSquare className="h-3 w-3 mr-2" />
                    Engage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="space-y-4">
            {profiles.map(profile => {
              const profilePredictions = predictions.get(profile.id) || [];
              if (profilePredictions.length === 0) return null;

              return (
                <div key={profile.id} className="bg-white p-6 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    {profile.customerName} - AI Predictions
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profilePredictions.map(prediction => (
                      <div key={prediction.predictionType} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium capitalize">{prediction.predictionType} Prediction</h4>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatProbability(prediction.probability)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round(prediction.confidence * 100)}% confidence
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <h5 className="text-sm font-medium">Key Factors:</h5>
                          {prediction.factors.slice(0, 2).map((factor, index) => (
                            <div key={index} className="text-sm">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                factor.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'
                              }`}></span>
                              {factor.name} ({factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%)
                            </div>
                          ))}
                        </div>
                        
                        <div className="text-xs text-gray-600">
                          <strong>Timeline:</strong> {prediction.timeline}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="space-y-4">
            {profiles.map(profile => {
              const profileRecommendations = recommendations.get(profile.id) || [];
              if (profileRecommendations.length === 0) return null;

              return (
                <div key={profile.id} className="bg-white p-6 rounded-lg border shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    {profile.customerName} - Success Recommendations
                  </h3>
                  
                  <div className="space-y-4">
                    {profileRecommendations.map(rec => (
                      <div key={rec.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{rec.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              rec.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {rec.priority}
                            </span>
                            <span className="text-xs text-gray-500">{rec.impact} impact</span>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <h5 className="text-sm font-medium mb-2">Action Items:</h5>
                          <div className="space-y-1">
                            {rec.actions.slice(0, 2).map(action => (
                              <div key={action.id} className="text-sm flex items-center gap-2">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span>{action.title}</span>
                                <span className="text-gray-500">({action.owner})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span><strong>Expected:</strong> {rec.expectedOutcome}</span>
                          <span><strong>Timeline:</strong> {rec.timeline}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerSuccessDashboard;
