'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table as TableIcon, 
  Plus, 
  X, 
  Save, 
  Download, 
  Share2, 
  Calendar, 
  Filter, 
  ArrowDownUp,
  Trash2
} from 'lucide-react';

// Types for report configuration
type ReportType = 'conversations' | 'customers' | 'orders' | 'products' | 'performance';
type ViewType = 'table' | 'bar' | 'line' | 'pie';
type FilterOperator = 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
type GroupByOption = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'category' | 'status' | 'source' | 'none';
type SortDirection = 'asc' | 'desc';

interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string;
}

interface SortCondition {
  field: string;
  direction: SortDirection;
}

interface ReportConfig {
  name: string;
  type: ReportType;
  viewType: ViewType;
  filters: FilterCondition[];
  groupBy: GroupByOption;
  sortBy: SortCondition[];
  columns: string[];
}

// Mock data for field options based on report type
const fieldOptions: Record<ReportType, string[]> = {
  conversations: ['date', 'customer_id', 'duration', 'topic', 'sentiment', 'resolution', 'agent_id'],
  customers: ['name', 'email', 'join_date', 'orders_count', 'total_spent', 'last_order_date', 'segment'],
  orders: ['order_id', 'date', 'customer_id', 'total', 'items_count', 'status', 'payment_method'],
  products: ['product_id', 'name', 'category', 'price', 'inventory', 'sales_count', 'rating'],
  performance: ['date', 'response_time', 'resolution_time', 'satisfaction', 'accuracy', 'conversations_count']
};

// Mock saved reports
const savedReports = [
  {
    id: '1',
    name: 'Monthly Conversation Analysis',
    type: 'conversations',
    lastRun: '2025-07-15'
  },
  {
    id: '2',
    name: 'Customer Retention Report',
    type: 'customers',
    lastRun: '2025-07-10'
  },
  {
    id: '3',
    name: 'Product Performance by Category',
    type: 'products',
    lastRun: '2025-07-05'
  }
];

export function ReportBuilder() {
  // State for report configuration
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    name: 'New Report',
    type: 'conversations',
    viewType: 'table',
    filters: [],
    groupBy: 'none',
    sortBy: [],
    columns: []
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'saved'>('build');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newFilterField, setNewFilterField] = useState('');
  const [newFilterOperator, setNewFilterOperator] = useState<FilterOperator>('equals');
  const [newFilterValue, setNewFilterValue] = useState('');
  
  // Handle report type change
  const handleReportTypeChange = (type: ReportType) => {
    setReportConfig(prev => ({
      ...prev,
      type,
      filters: [],
      columns: []
    }));
  };
  
  // Add a new filter
  const addFilter = () => {
    if (!newFilterField) return;
    
    const newFilter: FilterCondition = {
      id: `filter-${Date.now()}`,
      field: newFilterField,
      operator: newFilterOperator,
      value: newFilterValue
    };
    
    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
    
    // Reset filter inputs
    setNewFilterField('');
    setNewFilterOperator('equals');
    setNewFilterValue('');
  };
  
  // Remove a filter
  const removeFilter = (id: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== id)
    }));
  };
  
  // Toggle a column selection
  const toggleColumn = (column: string) => {
    setReportConfig(prev => {
      const isSelected = prev.columns.includes(column);
      return {
        ...prev,
        columns: isSelected
          ? prev.columns.filter(c => c !== column)
          : [...prev.columns, column]
      };
    });
  };
  
  // Generate report
  const generateReport = () => {
    setIsGenerating(true);
    setActiveTab('preview');
    
    // Simulate API call delay
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  };
  
  // Save report
  const saveReport = () => {
    // In a real implementation, this would save to an API
    alert(`Report "${reportConfig.name}" saved successfully!`);
  };
  
  // Get operator label
  const getOperatorLabel = (operator: FilterOperator) => {
    switch (operator) {
      case 'equals': return 'equals';
      case 'contains': return 'contains';
      case 'greater': return 'greater than';
      case 'less': return 'less than';
      case 'between': return 'between';
      case 'in': return 'in list';
    }
  };
  
  return (
    <Card className="w-full" data-testid="report-builder">
      <CardHeader>
        <CardTitle>Custom Report Builder</CardTitle>
        <CardDescription>
          Create, customize, and save reports with advanced filtering and grouping
        </CardDescription>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'build' | 'preview' | 'saved')}
          className="mt-4"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="build">Build Report</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent>
        <TabsContent value="build" className="space-y-6 mt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input 
                id="report-name" 
                value={reportConfig.name}
                onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter report name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select 
                value={reportConfig.type}
                onValueChange={(value) => handleReportTypeChange(value as ReportType)}
              >
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversations">Conversations</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>View Type</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={reportConfig.viewType === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportConfig(prev => ({ ...prev, viewType: 'table' }))}
                className="flex items-center gap-1"
              >
                <TableIcon className="h-4 w-4" />
                Table
              </Button>
              <Button
                variant={reportConfig.viewType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportConfig(prev => ({ ...prev, viewType: 'bar' }))}
                className="flex items-center gap-1"
              >
                <BarChart3 className="h-4 w-4" />
                Bar Chart
              </Button>
              <Button
                variant={reportConfig.viewType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportConfig(prev => ({ ...prev, viewType: 'line' }))}
                className="flex items-center gap-1"
              >
                <LineChart className="h-4 w-4" />
                Line Chart
              </Button>
              <Button
                variant={reportConfig.viewType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportConfig(prev => ({ ...prev, viewType: 'pie' }))}
                className="flex items-center gap-1"
              >
                <PieChart className="h-4 w-4" />
                Pie Chart
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Filters</Label>
              <Badge variant="outline" className="font-normal">
                {reportConfig.filters.length} active filters
              </Badge>
            </div>
            
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
              <Select value={newFilterField} onValueChange={setNewFilterField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions[reportConfig.type].map(field => (
                    <SelectItem key={field} value={field}>
                      {field.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={newFilterOperator} 
                onValueChange={(value) => setNewFilterOperator(value as FilterOperator)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">equals</SelectItem>
                  <SelectItem value="contains">contains</SelectItem>
                  <SelectItem value="greater">greater than</SelectItem>
                  <SelectItem value="less">less than</SelectItem>
                  <SelectItem value="between">between</SelectItem>
                  <SelectItem value="in">in list</SelectItem>
                </SelectContent>
              </Select>
              
              <Input 
                value={newFilterValue}
                onChange={(e) => setNewFilterValue(e.target.value)}
                placeholder="Enter value"
              />
              
              <Button 
                onClick={addFilter} 
                disabled={!newFilterField || !newFilterValue}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {reportConfig.filters.length > 0 ? (
              <div className="space-y-2 mt-2">
                {reportConfig.filters.map(filter => (
                  <div 
                    key={filter.id} 
                    className="flex items-center justify-between bg-muted/50 p-2 rounded-md"
                  >
                    <span className="text-sm">
                      <span className="font-medium">{filter.field.replace('_', ' ')}</span>
                      {' '}
                      <span className="text-muted-foreground">{getOperatorLabel(filter.operator)}</span>
                      {' '}
                      <span className="font-medium">{filter.value}</span>
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeFilter(filter.id)}
                      className="h-6 w-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-sm text-muted-foreground border border-dashed rounded-md">
                No filters applied. Report will include all data.
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <Label className="text-base">Group By</Label>
            <Select 
              value={reportConfig.groupBy}
              onValueChange={(value) => setReportConfig(prev => ({ ...prev, groupBy: value as GroupByOption }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Grouping</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="source">Source</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <Label className="text-base">Columns</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {fieldOptions[reportConfig.type].map(field => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`column-${field}`}
                    checked={reportConfig.columns.includes(field)}
                    onCheckedChange={() => toggleColumn(field)}
                  />
                  <Label 
                    htmlFor={`column-${field}`}
                    className="text-sm font-normal"
                  >
                    {field.replace('_', ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline">Reset</Button>
            <Button onClick={generateReport}>Generate Report</Button>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Generating your report...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{reportConfig.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {reportConfig.type.charAt(0).toUpperCase() + reportConfig.type.slice(1)} report
                    {reportConfig.groupBy !== 'none' && ` grouped by ${reportConfig.groupBy}`}
                    {reportConfig.filters.length > 0 && ` with ${reportConfig.filters.length} filters`}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={saveReport}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md p-4 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    {reportConfig.viewType === 'table' ? (
                      <>
                        <TableIcon className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />
                        Table view with {reportConfig.columns.length} columns
                      </>
                    ) : reportConfig.viewType === 'bar' ? (
                      <>
                        <BarChart3 className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />
                        Bar chart visualization
                      </>
                    ) : reportConfig.viewType === 'line' ? (
                      <>
                        <LineChart className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />
                        Line chart visualization
                      </>
                    ) : (
                      <>
                        <PieChart className="h-16 w-16 mx-auto mb-2 text-muted-foreground/50" />
                        Pie chart visualization
                      </>
                    )}
                  </p>
                  <p className="mt-2">
                    In a production environment, this would display your actual report data.
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="mt-0">
          <div className="space-y-4">
            {savedReports.map(report => (
              <div 
                key={report.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border rounded-md hover:bg-muted/50 transition-colors"
              >
                <div>
                  <h3 className="font-medium">{report.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">{report.type}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Last run: {report.lastRun}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowDownUp className="h-3 w-3 mr-1" />
                    Run
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Create New Report
            </Button>
          </div>
        </TabsContent>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Reports are automatically saved to your account
        </p>
      </CardFooter>
    </Card>
  );
}
