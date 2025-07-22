/**
 * Advanced Reporting Dashboard
 * Comprehensive analytics and business intelligence interface
 * Part of Phase 3: Market Leadership - Advanced Reporting & Insights
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Settings, 
  Download, 
  Share2,
  Plus,
  Search,
  Filter,
  Calendar,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Activity,
  Target
} from 'lucide-react';

import AdvancedReportingService from '../../services/AdvancedReportingService';
import { 
  ReportConfiguration, 
  DashboardConfig, 
  AnalyticsInsight, 
  MonitoringMetrics,
  DataSource,
  ReportError
} from '../../types/AdvancedReportingTypes';

const AdvancedReportingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState<ReportConfiguration[]>([]);
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null);
  const [errors, setErrors] = useState<ReportError[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const reportingService = AdvancedReportingService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load reports and dashboards
      const allReports = reportingService.getAllReports();
      const allDashboards = reportingService.getAllDashboards();
      const allDataSources = reportingService.getAllDataSources();
      const allInsights = reportingService.getInsights();
      const monitoringMetrics = reportingService.getMonitoringMetrics();
      const systemErrors = reportingService.getErrors();

      setReports(allReports);
      setDashboards(allDashboards);
      setDataSources(allDataSources);
      setInsights(allInsights);
      setMetrics(monitoringMetrics);
      setErrors(systemErrors.filter(e => !e.resolved));
    } catch (error) {
      console.error('Error loading reporting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      };
      
      const newInsights = await reportingService.generateInsights('revenue_dashboard', dateRange);
      setInsights(prev => [...newInsights, ...prev]);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (reportId: string) => {
    try {
      const exportUrl = await reportingService.exportReport(reportId, {
        format: 'pdf',
        options: {
          includeData: true,
          includeCharts: true,
          includeFilters: true,
          includeMetadata: true
        },
        destination: {
          type: 'download',
          target: 'local'
        }
      });
      
      // Simulate download
      window.open(exportUrl, '_blank');
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'syncing':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(reports.map(r => r.category)))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            Advanced Reporting & Insights
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analytics and business intelligence platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={generateInsights} disabled={isLoading} size="sm" variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Generate Insights
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.reportCount}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{metrics.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Load Time</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.round(metrics.averageLoadTime)}ms
                </p>
              </div>
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cache Hit Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(metrics.cacheHitRate * 100)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="datasources">Data Sources</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Reports */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Reports
              </h3>
              
              <div className="space-y-3">
                {reports.slice(0, 5).map(report => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-gray-600">{report.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => exportReport(report.id)} size="sm" variant="outline">
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Sources</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon('connected')}
                    <span className="text-sm font-medium">
                      {dataSources.filter(ds => ds.status === 'connected').length}/{dataSources.length} Connected
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Errors</span>
                  <div className="flex items-center gap-2">
                    {errors.length > 0 ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <span className="text-sm font-medium">{errors.length}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Query Performance</span>
                  <div className="flex items-center gap-2">
                    {metrics && metrics.averageLoadTime < 2000 ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">
                      {metrics ? `${Math.round(metrics.averageLoadTime)}ms avg` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map(report => (
              <div key={report.id} className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{report.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    report.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {report.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{report.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium capitalize">{report.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-medium">{report.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" className="flex-1">
                    <BarChart3 className="h-3 w-3 mr-2" />
                    View
                  </Button>
                  <Button onClick={() => exportReport(report.id)} size="sm" variant="outline">
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {insights.map(insight => (
              <div key={insight.id} className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      {insight.title}
                    </h3>
                    <p className="text-gray-600 mt-1">{insight.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(insight.impact)}`}>
                      {insight.impact} impact
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                
                {insight.recommendations.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Recommendations</h4>
                    <div className="space-y-2">
                      {insight.recommendations.map(rec => (
                        <div key={rec.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <div className="font-medium text-blue-900">{rec.title}</div>
                            <div className="text-sm text-blue-800">{rec.description}</div>
                            {rec.estimatedROI && (
                              <div className="text-xs text-blue-700 mt-1">
                                Estimated ROI: {rec.estimatedROI}x
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="datasources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dataSources.map(dataSource => (
              <div key={dataSource.id} className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    {dataSource.name}
                  </h3>
                  {getStatusIcon(dataSource.status)}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{dataSource.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{dataSource.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Refresh Rate:</span>
                    <span className="font-medium">{dataSource.refreshRate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Last Sync:</span>
                    <span className="font-medium">{dataSource.lastSync.toLocaleString()}</span>
                  </div>
                </div>
                
                <Button size="sm" variant="outline" className="w-full">
                  <Settings className="h-3 w-3 mr-2" />
                  Configure
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Query Volume:</span>
                    <span className="font-medium">{metrics.queryVolume}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Load Time:</span>
                    <span className="font-medium">{Math.round(metrics.averageLoadTime)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Error Rate:</span>
                    <span className="font-medium">{(metrics.errorRate * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cache Hit Rate:</span>
                    <span className="font-medium">{(metrics.cacheHitRate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                <div className="space-y-3">
                  {errors.length > 0 ? (
                    <div>
                      <h4 className="font-medium text-red-900 mb-2">Active Errors ({errors.length})</h4>
                      <div className="space-y-2">
                        {errors.slice(0, 3).map(error => (
                          <div key={error.id} className="text-sm bg-red-50 p-2 rounded">
                            <div className="font-medium text-red-800">{error.type}</div>
                            <div className="text-red-700">{error.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>All systems operational</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedReportingDashboard;
