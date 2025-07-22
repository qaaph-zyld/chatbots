// Multi-platform Integration Dashboard
// Comprehensive dashboard for managing cross-platform integrations, unified customer profiles, and real-time synchronization

import React, { useState, useEffect } from 'react';
import { 
  PlatformConnection, 
  UnifiedCustomerProfile, 
  SyncStatus, 
  PlatformMetrics,
  CustomerSearchQuery,
  TimeRange
} from '../../types/MultiPlatformTypes';
import MultiPlatformService from '../../services/MultiPlatformService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Download,
  Settings,
  Plus,
  Search,
  Filter,
  Zap,
  Globe,
  Database,
  Sync
} from 'lucide-react';

interface MultiPlatformDashboardProps {
  className?: string;
  compactMode?: boolean;
}

const MultiPlatformDashboard: React.FC<MultiPlatformDashboardProps> = ({
  className = '',
  compactMode = false
}) => {
  // State management
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([]);
  const [customers, setCustomers] = useState<UnifiedCustomerProfile[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<Map<string, SyncStatus>>(new Map());
  const [metrics, setMetrics] = useState<Map<string, PlatformMetrics>>(new Map());
  const [searchQuery, setSearchQuery] = useState<CustomerSearchQuery>({});
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const platformList = MultiPlatformService.getPlatforms();
      setPlatforms(platformList);

      const statusMap = new Map<string, SyncStatus>();
      platformList.forEach(platform => {
        const status = MultiPlatformService.getLastSyncStatus(platform.id);
        statusMap.set(platform.id, status);
      });
      setSyncStatuses(statusMap);

      const metricsMap = new Map<string, PlatformMetrics>();
      for (const platform of platformList.filter(p => p.status === 'connected')) {
        try {
          const platformMetrics = await MultiPlatformService.getPlatformMetrics(platform.id, selectedTimeRange);
          metricsMap.set(platform.id, platformMetrics);
        } catch (error) {
          console.error(`Error loading metrics for platform ${platform.id}:`, error);
        }
      }
      setMetrics(metricsMap);

      const customerList = await MultiPlatformService.searchCustomers(searchQuery);
      setCustomers(customerList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleSyncPlatform = async (platformId: string) => {
    try {
      await MultiPlatformService.syncPlatform(platformId);
      await loadDashboardData();
    } catch (error) {
      console.error('Error syncing platform:', error);
    }
  };

  const handleSyncAll = async () => {
    try {
      await MultiPlatformService.syncAllPlatforms();
      await loadDashboardData();
    } catch (error) {
      console.error('Error syncing all platforms:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'connected': 'text-green-500',
      'disconnected': 'text-gray-500',
      'syncing': 'text-blue-500',
      'error': 'text-red-500',
      'pending': 'text-yellow-500',
      'maintenance': 'text-orange-500'
    };
    return colors[status as keyof typeof colors] || 'text-gray-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'syncing': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  // Calculate overview metrics
  const overviewMetrics = {
    totalPlatforms: platforms.length,
    connectedPlatforms: platforms.filter(p => p.status === 'connected').length,
    totalCustomers: customers.length,
    totalRevenue: Array.from(metrics.values()).reduce((sum, m) => sum + m.totalRevenue, 0),
    totalOrders: Array.from(metrics.values()).reduce((sum, m) => sum + m.totalOrders, 0),
    averageResponseTime: Array.from(metrics.values()).reduce((sum, m) => sum + m.responseTime, 0) / Math.max(metrics.size, 1)
  };

  return (
    <div className={`multi-platform-dashboard ${className}`} data-testid="multi-platform-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-500" />
            Multi-platform Integration
          </h2>
          <p className="text-gray-600 mt-1">
            Manage cross-platform integrations and unified customer profiles
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            data-testid="refresh-button"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleSyncAll}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            data-testid="sync-all-button"
          >
            <Sync className="w-4 h-4" />
            Sync All
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="platforms-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Connected Platforms</p>
              <p className="text-2xl font-bold text-gray-900">
                {overviewMetrics.connectedPlatforms}/{overviewMetrics.totalPlatforms}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              Active integrations
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="customers-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {overviewMetrics.totalCustomers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="revenue-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${overviewMetrics.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border" data-testid="performance-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(overviewMetrics.averageResponseTime)}ms
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Zap className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="sync">Synchronization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Status</h3>
              <div className="space-y-3">
                {platforms.slice(0, compactMode ? 3 : 5).map(platform => (
                  <div key={platform.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={getStatusColor(platform.status)}>
                        {getStatusIcon(platform.status)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{platform.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{platform.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getStatusColor(platform.status)}`}>
                        {platform.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        {platform.lastSync.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {Array.from({ length: compactMode ? 3 : 5 }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Platform sync completed
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(Date.now() - i * 3600000).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-green-500">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Platform Connections</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                  <Plus className="w-4 h-4" />
                  Add Platform
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {platforms.map(platform => {
                  const syncStatus = syncStatuses.get(platform.id);
                  const platformMetrics = metrics.get(platform.id);
                  
                  return (
                    <div key={platform.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={getStatusColor(platform.status)}>
                            {getStatusIcon(platform.status)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{platform.type}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSyncPlatform(platform.id)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            data-testid={`sync-platform-${platform.id}`}
                          >
                            Sync
                          </button>
                          <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {platformMetrics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                              {platformMetrics.totalOrders.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">Orders</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                              ${platformMetrics.totalRevenue.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">Revenue</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                              {platformMetrics.customerCount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">Customers</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                              {Math.round(platformMetrics.responseTime)}ms
                            </p>
                            <p className="text-sm text-gray-600">Response Time</p>
                          </div>
                        </div>
                      )}
                      
                      {syncStatus?.isRunning && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-blue-900">
                              {syncStatus.currentOperation || 'Syncing...'}
                            </p>
                            <p className="text-sm text-blue-700">{syncStatus.progress}%</p>
                          </div>
                          <div className="w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${syncStatus.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Unified Customer Profiles</h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setSearchQuery({ ...searchQuery, name: e.target.value })}
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
                {customers.slice(0, compactMode ? 5 : 10).map(customer => (
                  <div key={customer.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {customer.firstName} {customer.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${customer.lifetimeValue.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">Lifetime Value</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{customer.totalOrders}</p>
                        <p className="text-sm text-gray-600">Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          ${Math.round(customer.averageOrderValue)}
                        </p>
                        <p className="text-sm text-gray-600">Avg Order</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{customer.platforms.length}</p>
                        <p className="text-sm text-gray-600">Platforms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Synchronization Tab */}
        <TabsContent value="sync" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Synchronization Status</h3>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {platforms.map(platform => {
                  const syncStatus = syncStatuses.get(platform.id);
                  
                  return (
                    <div key={platform.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                          <p className="text-sm text-gray-600">
                            Last sync: {platform.lastSync.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-sm ${getStatusColor(platform.status)}`}>
                            {platform.status}
                          </span>
                          <button
                            onClick={() => handleSyncPlatform(platform.id)}
                            disabled={syncStatus?.isRunning}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                          >
                            {syncStatus?.isRunning ? 'Syncing...' : 'Sync Now'}
                          </button>
                        </div>
                      </div>
                      
                      {syncStatus?.isRunning && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-700">
                              {syncStatus.currentOperation || 'Processing...'}
                            </p>
                            <p className="text-sm text-gray-600">{syncStatus.progress}%</p>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${syncStatus.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {platform.metrics.totalRequests.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Total Requests</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">
                            {platform.metrics.successfulRequests.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Successful</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-red-600">
                            {platform.metrics.failedRequests.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">Failed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">
                            {Math.round(platform.metrics.uptime * 100) / 100}%
                          </p>
                          <p className="text-sm text-gray-600">Uptime</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiPlatformDashboard;
