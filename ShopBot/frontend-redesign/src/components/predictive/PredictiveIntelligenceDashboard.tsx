/**
 * Predictive Intelligence Dashboard
 * Comprehensive dashboard for ML behavior forecasting, purchase intent, and churn prediction
 * Part of Phase 3: Market Leadership - Predictive Intelligence
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  Brain, 
  Target, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Activity,
  Zap,
  Shield,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

// Import services
import MLBehaviorModel from '../../services/MLBehaviorModel';
import PurchaseIntentService from '../../services/PurchaseIntentService';
import ChurnPredictionService from '../../services/ChurnPredictionService';

const PredictiveIntelligenceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Service instances
  const [mlModel] = useState(() => MLBehaviorModel.getInstance());
  const [intentService] = useState(() => PurchaseIntentService.getInstance());
  const [churnService] = useState(() => ChurnPredictionService.getInstance());

  // Data states
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [intentAnalytics, setIntentAnalytics] = useState<any>(null);
  const [churnAnalytics, setChurnAnalytics] = useState<any>(null);
  const [highRiskCustomers, setHighRiskCustomers] = useState<any[]>([]);
  const [highIntentCustomers, setHighIntentCustomers] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load ML model metrics
      setModelMetrics(mlModel.getPerformanceMetrics());
      
      // Load intent analytics
      setIntentAnalytics(intentService.getAnalytics());
      
      // Load churn analytics
      setChurnAnalytics(churnService.getAnalytics());
      
      // Load high-risk customers
      setHighRiskCustomers(churnService.getHighRiskCustomers(0.7));
      
      // Load high-intent customers
      setHighIntentCustomers(intentService.getHighIntentCustomers(0.7));
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatNumber = (value: number) => value.toLocaleString();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Predictive Intelligence
          </h1>
          <p className="text-gray-600 mt-1">
            Advanced ML-powered customer behavior forecasting and retention automation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behavior">ML Models</TabsTrigger>
          <TabsTrigger value="intent">Purchase Intent</TabsTrigger>
          <TabsTrigger value="churn">Churn Prediction</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Model Accuracy</p>
                  <p className="text-2xl font-bold text-green-600">
                    {modelMetrics ? formatPercentage(modelMetrics.accuracy) : '--'}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Intent Customers</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(highIntentCustomers.length)}
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">At-Risk Customers</p>
                  <p className="text-2xl font-bold text-red-600">
                    {churnAnalytics ? formatNumber(churnAnalytics.totalAtRisk) : '--'}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {churnAnalytics ? formatPercentage(churnAnalytics.retentionRate) : '--'}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Intent Analytics
              </h3>
              {intentAnalytics && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Intents:</span>
                    <span className="font-medium">{formatNumber(intentAnalytics.totalIntents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Score:</span>
                    <span className="font-medium">{formatPercentage(intentAnalytics.averageIntentScore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate:</span>
                    <span className="font-medium">{formatPercentage(intentAnalytics.conversionRate)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Churn Prevention
              </h3>
              {churnAnalytics && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Predicted Churn Rate:</span>
                    <span className="font-medium text-red-600">
                      {formatPercentage(churnAnalytics.predictedChurnRate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Risk Score:</span>
                    <span className="font-medium">{formatPercentage(churnAnalytics.averageRiskScore)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue Protected:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(churnAnalytics.trends[0]?.revenueImpact || 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ML Models Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Model Performance Metrics
            </h3>
            {modelMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{formatPercentage(modelMetrics.accuracy)}</p>
                  <p className="text-sm text-gray-600">Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatPercentage(modelMetrics.precision)}</p>
                  <p className="text-sm text-gray-600">Precision</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{formatPercentage(modelMetrics.recall)}</p>
                  <p className="text-sm text-gray-600">Recall</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{formatPercentage(modelMetrics.f1Score)}</p>
                  <p className="text-sm text-gray-600">F1 Score</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Feature Importance</h3>
            <div className="space-y-3">
              {mlModel.getFeatureImportance().slice(0, 5).map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{feature.feature.replace(/_/g, ' ')}</span>
                    <span className="text-sm text-gray-500 ml-2">({feature.category})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${feature.importance * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{formatPercentage(feature.importance)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Purchase Intent Tab */}
        <TabsContent value="intent" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                High Intent Customers
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {highIntentCustomers.slice(0, 10).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">Customer {customer.customerId}</p>
                      <p className="text-sm text-gray-600">Category: {customer.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{formatPercentage(customer.intentScore)}</p>
                      <p className="text-sm text-gray-600">{customer.urgency} urgency</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Engagement Triggers</h3>
              <div className="space-y-3">
                {intentService.getActiveTriggers().slice(0, 4).map((trigger, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{trigger.title}</span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">CTR:</span>
                        <span className="ml-1 font-medium">{formatPercentage(trigger.performance.ctr)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Conv:</span>
                        <span className="ml-1 font-medium">{formatPercentage(trigger.performance.conversionRate)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue:</span>
                        <span className="ml-1 font-medium">{formatCurrency(trigger.performance.revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Churn Prediction Tab */}
        <TabsContent value="churn" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                High Risk Customers
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {highRiskCustomers.slice(0, 10).map((customer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded">
                    <div>
                      <p className="font-medium">Customer {customer.customerId}</p>
                      <p className="text-sm text-gray-600">
                        Time to churn: {customer.timeToChurn} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{formatPercentage(customer.riskScore)}</p>
                      <p className={`text-sm px-2 py-1 rounded ${
                        customer.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                        customer.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {customer.riskLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Retention Strategies</h3>
              <div className="space-y-3">
                {churnService.getAllRetentionStrategies().slice(0, 4).map((strategy, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{strategy.name}</span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        strategy.automation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {strategy.automation.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Effectiveness:</span>
                        <span className="ml-1 font-medium">{formatPercentage(strategy.effectiveness)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">ROI:</span>
                        <span className="ml-1 font-medium">{strategy.roi.toFixed(1)}x</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Retained:</span>
                        <span className="ml-1 font-medium">{strategy.performance.retained}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value="automation" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Automated Processes
            </h3>
            <div className="space-y-4">
              {churnService.getAllAutomations().map((automation, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{automation.name}</h4>
                      <p className="text-sm text-gray-600">
                        Frequency: {automation.schedule.frequency}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        automation.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {automation.isActive ? 'Running' : 'Stopped'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => churnService.toggleAutomation(automation.id)}
                      >
                        {automation.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Executions:</span>
                      <span className="ml-1 font-medium">{automation.performance.executions}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Customers:</span>
                      <span className="ml-1 font-medium">{formatNumber(automation.performance.customersProcessed)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Campaigns:</span>
                      <span className="ml-1 font-medium">{automation.performance.campaignsSent}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Revenue:</span>
                      <span className="ml-1 font-medium">{formatCurrency(automation.performance.revenueGenerated)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Key Insights & Trends
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Top Risk Factors</h4>
                <div className="space-y-2">
                  {churnAnalytics?.topRiskFactors?.slice(0, 5).map((factor, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{factor.factor.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${factor.frequency * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{formatPercentage(factor.frequency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Performance Trends</h4>
                <div className="space-y-3">
                  {churnAnalytics?.trends?.map((trend, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{trend.period}</span>
                        <span className={`text-sm ${trend.churnRateChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trend.churnRateChange > 0 ? '+' : ''}{formatPercentage(trend.churnRateChange)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Revenue Impact: {formatCurrency(trend.revenueImpact)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveIntelligenceDashboard;
