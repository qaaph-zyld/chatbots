/**
 * Custom Report Builder with Advanced Filtering
 * Drag-and-drop report creation with sophisticated filtering capabilities
 * Part of Phase 3: Market Leadership - Advanced Reporting & Insights
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  Plus, Trash2, Settings, Play, Save, Download, Filter, BarChart3, 
  Table, PieChart, LineChart, Calendar, Hash, Type, Layers, Zap
} from 'lucide-react';

import AdvancedReportingService from '../../services/AdvancedReportingService';
import { 
  ReportConfiguration, ReportFilter, MetricDefinition, DimensionDefinition,
  VisualizationConfig, ChartType, FilterOperator, FilterType
} from '../../types/AdvancedReportingTypes';

interface ReportBuilderState {
  name: string;
  description: string;
  category: string;
  type: string;
  selectedMetrics: string[];
  selectedDimensions: string[];
  filters: ReportFilter[];
  visualization: VisualizationConfig;
  isPreviewOpen: boolean;
  previewData: any;
}

const CustomReportBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [reportState, setReportState] = useState<ReportBuilderState>({
    name: '',
    description: '',
    category: 'revenue',
    type: 'dashboard',
    selectedMetrics: [],
    selectedDimensions: [],
    filters: [],
    visualization: {
      type: 'line',
      layout: {
        width: 800,
        height: 400,
        margin: { top: 20, right: 30, bottom: 40, left: 50 },
        responsive: true,
        grid: { show: true, color: '#e0e0e0', opacity: 0.5, strokeWidth: 1 }
      },
      styling: {
        colors: {
          primary: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
          secondary: ['#64748b', '#6b7280'],
          accent: ['#8b5cf6', '#ec4899'],
          neutral: ['#f8fafc', '#f1f5f9', '#e2e8f0'],
          semantic: { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' }
        },
        fonts: {
          family: 'Inter, sans-serif',
          sizes: { small: 12, medium: 14, large: 16, xlarge: 20 },
          weights: { light: 300, normal: 400, medium: 500, bold: 600 }
        },
        theme: {
          mode: 'light',
          background: '#ffffff',
          surface: '#f8fafc',
          border: '#e2e8f0',
          text: { primary: '#1e293b', secondary: '#64748b', disabled: '#94a3b8', inverse: '#ffffff' }
        }
      },
      interactions: {
        hover: true, click: true, zoom: true, pan: false, brush: false,
        tooltip: { enabled: true, format: '{series}: {value}', position: 'auto', style: {} },
        legend: { enabled: true, position: 'bottom', orientation: 'horizontal', style: {} }
      },
      annotations: []
    },
    isPreviewOpen: false,
    previewData: null
  });

  const [availableMetrics, setAvailableMetrics] = useState<MetricDefinition[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<DimensionDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reportingService = AdvancedReportingService.getInstance();

  useEffect(() => {
    const metrics = reportingService.getMetrics();
    const dimensions = reportingService.getDimensions();
    setAvailableMetrics(metrics);
    setAvailableDimensions(dimensions);
  }, []);

  const updateReportState = (updates: Partial<ReportBuilderState>) => {
    setReportState(prev => ({ ...prev, ...updates }));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      type: 'text',
      label: 'New Filter',
      required: false
    };
    updateReportState({ filters: [...reportState.filters, newFilter] });
  };

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    const updatedFilters = reportState.filters.map(filter =>
      filter.id === filterId ? { ...filter, ...updates } : filter
    );
    updateReportState({ filters: updatedFilters });
  };

  const removeFilter = (filterId: string) => {
    const updatedFilters = reportState.filters.filter(filter => filter.id !== filterId);
    updateReportState({ filters: updatedFilters });
  };

  const toggleMetric = (metricId: string) => {
    const isSelected = reportState.selectedMetrics.includes(metricId);
    const updatedMetrics = isSelected
      ? reportState.selectedMetrics.filter(id => id !== metricId)
      : [...reportState.selectedMetrics, metricId];
    updateReportState({ selectedMetrics: updatedMetrics });
  };

  const toggleDimension = (dimensionId: string) => {
    const isSelected = reportState.selectedDimensions.includes(dimensionId);
    const updatedDimensions = isSelected
      ? reportState.selectedDimensions.filter(id => id !== dimensionId)
      : [...reportState.selectedDimensions, dimensionId];
    updateReportState({ selectedDimensions: updatedDimensions });
  };

  const previewReport = async () => {
    if (!reportState.selectedMetrics.length) {
      alert('Please select at least one metric to preview the report.');
      return;
    }
    setIsLoading(true);
    try {
      const tempReportId = 'preview_' + Date.now();
      await reportingService.createReport({
        id: tempReportId,
        name: reportState.name || 'Preview Report',
        description: reportState.description || 'Report preview',
        type: reportState.type as any,
        category: reportState.category as any,
        dataSource: ['sales_db'],
        filters: reportState.filters,
        visualization: reportState.visualization,
        recipients: [],
        createdBy: 'user',
        isActive: true,
        tags: ['preview']
      });
      const previewData = await reportingService.executeQuery(tempReportId, reportState.filters);
      updateReportState({ previewData, isPreviewOpen: true });
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReport = async () => {
    if (!reportState.name.trim() || !reportState.selectedMetrics.length) {
      alert('Please enter a report name and select at least one metric.');
      return;
    }
    setIsSaving(true);
    try {
      await reportingService.createReport({
        name: reportState.name,
        description: reportState.description,
        type: reportState.type as any,
        category: reportState.category as any,
        dataSource: ['sales_db'],
        filters: reportState.filters,
        visualization: reportState.visualization,
        recipients: [],
        createdBy: 'user',
        isActive: true,
        tags: ['custom', reportState.category]
      });
      alert(`Report "${reportState.name}" saved successfully!`);
      // Reset form
      setReportState({
        ...reportState,
        name: '',
        description: '',
        selectedMetrics: [],
        selectedDimensions: [],
        filters: [],
        isPreviewOpen: false,
        previewData: null
      });
    } catch (error) {
      console.error('Error saving report:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const chartTypes: { value: ChartType; label: string }[] = [
    { value: 'line', label: 'Line Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'table', label: 'Data Table' }
  ];

  const filterOperators: { value: FilterOperator; label: string }[] = [
    { value: 'equals', label: 'Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Layers className="h-8 w-8 text-blue-600" />
            Custom Report Builder
          </h1>
          <p className="text-gray-600 mt-1">Create sophisticated reports with drag-and-drop simplicity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={previewReport} disabled={isLoading || !reportState.selectedMetrics.length} variant="outline" size="sm">
            {isLoading ? <Zap className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Preview
          </Button>
          <Button onClick={saveReport} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Report'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Report Name *</label>
                  <input
                    type="text"
                    value={reportState.name}
                    onChange={(e) => updateReportState({ name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter report name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={reportState.description}
                    onChange={(e) => updateReportState({ description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe what this report shows"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={reportState.category}
                    onChange={(e) => updateReportState({ category: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="customer">Customer</option>
                    <option value="marketing">Marketing</option>
                    <option value="operations">Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Report Type</label>
                  <select
                    value={reportState.type}
                    onChange={(e) => updateReportState({ type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="summary">Summary</option>
                    <option value="detailed">Detailed</option>
                    <option value="trend">Trend Analysis</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Select Metrics</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableMetrics.map(metric => (
                  <div key={metric.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={reportState.selectedMetrics.includes(metric.id)}
                      onChange={() => toggleMetric(metric.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-sm text-gray-600">{metric.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Select Dimensions</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableDimensions.map(dimension => (
                  <div key={dimension.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={reportState.selectedDimensions.includes(dimension.id)}
                      onChange={() => toggleDimension(dimension.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{dimension.name}</div>
                      <div className="text-sm text-gray-600">{dimension.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              <Button onClick={addFilter} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Filter
              </Button>
            </div>
            
            {reportState.filters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Filter className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No filters configured yet. Click "Add Filter" to create your first filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reportState.filters.map((filter, index) => (
                  <div key={filter.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Filter {index + 1}</span>
                      <Button onClick={() => removeFilter(filter.id)} size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        value={filter.field}
                        onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                        className="p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Field name"
                      />
                      <select
                        value={filter.operator}
                        onChange={(e) => updateFilter(filter.id, { operator: e.target.value as FilterOperator })}
                        className="p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        {filterOperators.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        className="p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        placeholder="Filter value"
                      />
                      <select
                        value={filter.type}
                        onChange={(e) => updateFilter(filter.id, { type: e.target.value as FilterType })}
                        className="p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Chart Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Chart Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {chartTypes.map(chart => (
                    <button
                      key={chart.value}
                      onClick={() => updateReportState({
                        visualization: { ...reportState.visualization, type: chart.value }
                      })}
                      className={`p-3 border rounded-lg text-sm transition-colors ${
                        reportState.visualization.type === chart.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {chart.label}
                    </button>
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

export default CustomReportBuilder;
