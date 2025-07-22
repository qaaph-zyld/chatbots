/**
 * Strategic Partnership Dashboard
 * Enterprise partnership management and integration interface
 * Part of Phase 3: Market Leadership - Enterprise Tools & Strategic Integration
 */

import React, { useState, useEffect } from 'react';
import { 
  Handshake, TrendingUp, DollarSign, Users, Activity, Calendar,
  CheckCircle, AlertTriangle, Clock, Star, Globe, Shield,
  BarChart3, FileText, Settings, Plus, Eye, Edit
} from 'lucide-react';
import StrategicPartnershipService from '../../services/StrategicPartnershipService';
import { 
  Partnership, PartnershipActivity, PartnershipAnalytics,
  PartnershipStatus, PartnershipTier, ActivityStatus
} from '../../types/StrategicPartnershipTypes';

interface StrategicPartnershipDashboardProps {
  className?: string;
  compactMode?: boolean;
}

const StrategicPartnershipDashboard: React.FC<StrategicPartnershipDashboardProps> = ({
  className = '',
  compactMode = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [activities, setActivities] = useState<PartnershipActivity[]>([]);
  const [analytics, setAnalytics] = useState<PartnershipAnalytics | null>(null);
  const [selectedPartnership, setSelectedPartnership] = useState<Partnership | null>(null);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);

  const partnershipService = StrategicPartnershipService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setPartnerships(partnershipService.getAllPartnerships());
      setActivities(partnershipService.getAllActivities());
      setAnalytics(partnershipService.getAnalytics());
    } catch (error) {
      console.error('Error loading partnership data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: PartnershipStatus | ActivityStatus) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive':
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'terminated':
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: PartnershipStatus | ActivityStatus) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: PartnershipTier) => {
    switch (tier) {
      case 'diamond':
      case 'platinum':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'gold':
        return <Star className="h-4 w-4 text-yellow-600" />;
      case 'silver':
        return <Star className="h-4 w-4 text-gray-400" />;
      default:
        return <Star className="h-4 w-4 text-orange-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderOverviewTab = () => {
    if (!analytics) return <div>Loading analytics...</div>;

    const { overview, trends } = analytics;
    const recentActivities = activities.slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Handshake className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Partnerships</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalPartnerships}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Partnerships</p>
                <p className="text-2xl font-bold text-gray-900">{overview.activePartnerships}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.totalRevenue)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Partnership Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.averagePartnershipValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Partners */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Partners</h3>
          <div className="space-y-4">
            {overview.topPerformingPartners.slice(0, 5).map((partner) => (
              <div key={partner.partnerId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTierIcon(partner.tier)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{partner.partnerName}</p>
                    <p className="text-xs text-gray-500">Tier: {partner.tier} • NPS: {partner.satisfaction}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(partner.revenue)}</p>
                  <p className="text-xs text-green-600">+{partner.growth.toFixed(1)}% growth</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <div className="space-y-3">
            {trends.find(t => t.metric === 'revenue')?.data.slice(-6).map((dataPoint, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{dataPoint.date.toLocaleDateString()}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{formatCurrency(dataPoint.value)}</span>
                  {dataPoint.change !== undefined && (
                    <span className={`text-xs ${dataPoint.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {dataPoint.change >= 0 ? '+' : ''}{dataPoint.change.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activities</h3>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">
                    {activity.type} • Due: {activity.dueDate?.toLocaleDateString() || 'No due date'}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPartnershipsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Partnership Management</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Partnership
        </button>
      </div>

      {/* Partnerships Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partnerships.map((partnership) => (
          <div key={partnership.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(partnership.status)}
                <h4 className="text-lg font-medium text-gray-900">{partnership.partner.companyName}</h4>
              </div>
              <div className="flex items-center space-x-1">
                {getTierIcon(partnership.tier)}
                <span className="text-xs text-gray-500 capitalize">{partnership.tier}</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{partnership.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Type: {partnership.type}</span>
                <span>Category: {partnership.category}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Revenue: {formatCurrency(partnership.metrics.revenue.totalRevenue)}</span>
                <span>Growth: +{partnership.metrics.revenue.growthRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>SLA: {partnership.metrics.performance.slaCompliance.toFixed(1)}%</span>
                <span>NPS: {partnership.metrics.satisfaction.nps}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(partnership.status)}`}>
                {partnership.status}
              </span>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => setSelectedPartnership(partnership)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button className="text-gray-600 hover:text-gray-900">
                  <Edit className="h-4 w-4" />
                </button>
                <button className="text-gray-600 hover:text-gray-900">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderActivitiesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Partnership Activities</h3>
        <button
          onClick={() => setShowActivityForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Activity
        </button>
      </div>

      {/* Activities List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {activities.map((activity) => (
            <li key={activity.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(activity.status)}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                    <div className="text-sm text-gray-500">{activity.description}</div>
                    <div className="text-xs text-gray-400">
                      Type: {activity.type} • Priority: {activity.priority}
                      {activity.dueDate && ` • Due: ${activity.dueDate.toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                  <button className="text-blue-600 hover:text-blue-900">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => {
    if (!analytics) return <div>Loading analytics...</div>;

    const { benchmarks, forecasts } = analytics;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Partnership Analytics</h3>
        
        {/* Industry Benchmarks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Industry Benchmarks</h4>
          <div className="space-y-4">
            {benchmarks.map((benchmark, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{benchmark.metric.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{benchmark.industry} • {benchmark.source}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{benchmark.value}</p>
                  <p className="text-xs text-gray-500">{benchmark.percentile}th percentile</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Forecast */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Revenue Forecast</h4>
          <div className="space-y-4">
            {forecasts.map((forecast, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900 capitalize">{forecast.metric}</p>
                  <p className="text-xs text-gray-500">Confidence: {forecast.confidence}%</p>
                </div>
                <div className="space-y-2">
                  {forecast.predictions.slice(0, 3).map((prediction, predIndex) => (
                    <div key={predIndex} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{prediction.date.toLocaleDateString()}</span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(prediction.value)}</p>
                        <p className="text-xs text-gray-500">
                          Range: {formatCurrency(prediction.lowerBound)} - {formatCurrency(prediction.upperBound)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partnership Performance Matrix */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Partnership Performance Matrix</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partnerships.map((partnership) => (
              <div key={partnership.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-medium text-gray-900">{partnership.partner.companyName}</h5>
                  {getTierIcon(partnership.tier)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Revenue:</span>
                    <span className="ml-1 font-medium">{formatCurrency(partnership.metrics.revenue.totalRevenue)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Growth:</span>
                    <span className="ml-1 font-medium text-green-600">+{partnership.metrics.revenue.growthRate.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">SLA:</span>
                    <span className="ml-1 font-medium">{partnership.metrics.performance.slaCompliance.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Satisfaction:</span>
                    <span className="ml-1 font-medium">{partnership.metrics.satisfaction.nps}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'partnerships', name: 'Partnerships', icon: Handshake },
    { id: 'activities', name: 'Activities', icon: Activity },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className={`strategic-partnership-dashboard ${className}`} data-testid="strategic-partnership-dashboard">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Strategic Partnerships</h2>
        <p className="text-gray-600">Manage enterprise partnerships and strategic integrations</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 inline-block mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}
        
        {!loading && activeTab === 'overview' && renderOverviewTab()}
        {!loading && activeTab === 'partnerships' && renderPartnershipsTab()}
        {!loading && activeTab === 'activities' && renderActivitiesTab()}
        {!loading && activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
};

export default StrategicPartnershipDashboard;
