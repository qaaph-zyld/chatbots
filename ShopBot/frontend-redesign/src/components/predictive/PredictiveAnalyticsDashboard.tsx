// Predictive Analytics Dashboard
// AI-powered dashboard for customer behavior prediction, churn analysis, and proactive engagement recommendations

import React, { useState, useEffect } from 'react';
import { 
  CustomerBehaviorProfile, 
  ProactiveRecommendation,
  BehaviorInsight,
  ModelPerformance
} from '../../types/PredictiveAnalyticsTypes';
import PredictiveAnalyticsService from '../../services/PredictiveAnalyticsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Target, 
  Lightbulb,
  RefreshCw,
  Download,
  Search,
  Filter,
  DollarSign,
  CheckCircle,
  Shield
} from 'lucide-react';

interface PredictiveAnalyticsDashboardProps {
  className?: string;
  compactMode?: boolean;
}

const PredictiveAnalyticsDashboard: React.FC<PredictiveAnalyticsDashboardProps> = ({
  className = '',
  compactMode = false
}) => {
  // State management
  const [customerProfiles, setCustomerProfiles] = useState<CustomerBehaviorProfile[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerInsights, setCustomerInsights] = useState<BehaviorInsight[]>([]);
  const [recommendations, setRecommendations] = useState<ProactiveRecommendation[]>([]);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load sample customer profiles
      const sampleCustomers = ['customer_1', 'customer_2', 'customer_3', 'customer_4', 'customer_5'];
      const profiles: CustomerBehaviorProfile[] = [];
      
      for (const customerId of sampleCustomers) {
        const profile = await PredictiveAnalyticsService.analyzeCustomerBehavior(customerId);
        profiles.push(profile);
      }
      
      setCustomerProfiles(profiles);
      
      // Load model performance
      const performance = await PredictiveAnalyticsService.getModelPerformance();
      setModelPerformance(performance);
      
      // Set default selected customer
      if (profiles.length > 0 && !selectedCustomer) {
        setSelectedCustomer(profiles[0].customerId);
        await loadCustomerDetails(profiles[0].customerId);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerDetails = async (customerId: string) => {
    try {
      const insights = await PredictiveAnalyticsService.getBehaviorInsights(customerId);
      setCustomerInsights(insights);
      
      const recs = await PredictiveAnalyticsService.generateProactiveRecommendations(customerId);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading customer details:', error);
    }
  };

  const handleCustomerSelect = async (customerId: string) => {
    setSelectedCustomer(customerId);
    await loadCustomerDetails(customerId);
  };

  const handleRefresh = async () => {
    await loadDashboardData();
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-100';
    if (score >= 60) return 'text-orange-500 bg-orange-100';
    if (score >= 40) return 'text-yellow-500 bg-yellow-100';
    return 'text-green-500 bg-green-100';
  };

  const getRiskIcon = (score: number) => {
    if (score >= 80) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'urgent': 'bg-red-500 text-white',
      'high': 'bg-orange-500 text-white',
      'medium': 'bg-yellow-500 text-white',
      'low': 'bg-green-500 text-white'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  // Calculate overview metrics
  const overviewMetrics = {
    totalCustomers: customerProfiles.length,
    highRiskCustomers: customerProfiles.filter(p => p.predictiveScores.churnRisk.score >= 70).length,
    averageLifetimeValue: Math.round(customerProfiles.reduce((sum, p) => sum + p.predictiveScores.lifetimeValue.currentValue, 0) / Math.max(customerProfiles.length, 1)),
    totalRecommendations: recommendations.length,
    modelAccuracy: modelPerformance?.accuracy || 0
  };

  const selectedProfile = customerProfiles.find(p => p.customerId === selectedCustomer);

  return (
    <div className={`predictive-analytics-dashboard ${className}`} data-testid="predictive-analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Predictive Customer Analytics
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered customer behavior prediction and proactive engagement
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
            data-testid="refresh-button"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="total-customers-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {overviewMetrics.totalCustomers}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="high-risk-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-red-500">
                {overviewMetrics.highRiskCustomers}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="avg-ltv-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg LTV</p>
              <p className="text-2xl font-bold text-green-500">
                ${overviewMetrics.averageLifetimeValue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="recommendations-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Recommendations</p>
              <p className="text-2xl font-bold text-purple-500">
                {overviewMetrics.totalRecommendations}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Lightbulb className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="model-accuracy-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Model Accuracy</p>
              <p className="text-2xl font-bold text-blue-500">
                {Math.round(overviewMetrics.modelAccuracy * 100)}%
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Churn Risk Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Risk Distribution</h3>
              <div className="space-y-3">
                {[
                  { range: '80-100%', count: customerProfiles.filter(p => p.predictiveScores.churnRisk.score >= 80).length, color: 'bg-red-500' },
                  { range: '60-79%', count: customerProfiles.filter(p => p.predictiveScores.churnRisk.score >= 60 && p.predictiveScores.churnRisk.score < 80).length, color: 'bg-orange-500' },
                  { range: '40-59%', count: customerProfiles.filter(p => p.predictiveScores.churnRisk.score >= 40 && p.predictiveScores.churnRisk.score < 60).length, color: 'bg-yellow-500' },
                  { range: '0-39%', count: customerProfiles.filter(p => p.predictiveScores.churnRisk.score < 40).length, color: 'bg-green-500' }
                ].map(item => (
                  <div key={item.range} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${item.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{item.range}</span>
                    </div>
                    <span className="text-sm text-gray-600">{item.count} customers</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Insights */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Insights</h3>
              <div className="space-y-3">
                {customerInsights.slice(0, compactMode ? 3 : 5).map((insight, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Lightbulb className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{insight.insight}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-600">
                            Confidence: {Math.round(insight.confidence * 100)}%
                          </span>
                          <span className="text-xs text-gray-600">
                            Impact: {Math.round(insight.impact * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Customer Behavior Profiles</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {customerProfiles.filter(profile => 
                  profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
                ).slice(0, compactMode ? 5 : 10).map(profile => (
                  <div 
                    key={profile.customerId} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCustomer === profile.customerId ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleCustomerSelect(profile.customerId)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {profile.firstName} {profile.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{profile.email}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(profile.predictiveScores.churnRisk.score)}`}>
                          {getRiskIcon(profile.predictiveScores.churnRisk.score)}
                          <span className="ml-1">{profile.predictiveScores.churnRisk.score}% Risk</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          ${profile.predictiveScores.lifetimeValue.currentValue.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Current LTV</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {Math.round(profile.predictiveScores.nextPurchase.probability * 100)}%
                        </p>
                        <p className="text-sm text-gray-600">Purchase Prob.</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {profile.predictiveScores.loyaltyIndex.tier}
                        </p>
                        <p className="text-sm text-gray-600">Loyalty Tier</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {selectedProfile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Details */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedProfile.firstName} {selectedProfile.lastName} - Detailed Analysis
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-700">Churn Risk</p>
                      <p className="text-2xl font-bold text-red-600">
                        {selectedProfile.predictiveScores.churnRisk.score}%
                      </p>
                      <p className="text-xs text-red-600">
                        {selectedProfile.predictiveScores.churnRisk.timeframe}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-700">Predicted LTV</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${selectedProfile.predictiveScores.lifetimeValue.predictedValue.toLocaleString()}
                      </p>
                      <p className="text-xs text-green-600">
                        {selectedProfile.predictiveScores.lifetimeValue.timeframe}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-700">Next Purchase Probability</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xl font-bold text-blue-600">
                        {Math.round(selectedProfile.predictiveScores.nextPurchase.probability * 100)}%
                      </p>
                      <p className="text-sm text-blue-600">
                        within {selectedProfile.predictiveScores.nextPurchase.timeframe}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Behavioral Insights */}
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavioral Insights</h3>
                <div className="space-y-3">
                  {customerInsights.map((insight, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">{insight.insight}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          Confidence: {Math.round(insight.confidence * 100)}%
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${insight.actionable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {insight.actionable ? 'Actionable' : 'Informational'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Proactive Recommendations</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {recommendations.map(rec => (
                  <div key={rec.recommendationId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                          {rec.priority}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {rec.type.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-green-600">
                          {Math.round(rec.expectedImpact.revenueIncrease * 100)}%
                        </p>
                        <p className="text-xs text-gray-600">Revenue Impact</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">
                          {Math.round(rec.expectedImpact.churnReduction * 100)}%
                        </p>
                        <p className="text-xs text-gray-600">Churn Reduction</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-600">
                          {Math.round(rec.expectedImpact.confidence * 100)}%
                        </p>
                        <p className="text-xs text-gray-600">Confidence</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-600">
                          {rec.implementation.timeline}
                        </p>
                        <p className="text-xs text-gray-600">Timeline</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Target: {rec.success.primaryMetric} - {rec.success.targetValue}
                      </div>
                      <button className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600">
                        Implement
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
