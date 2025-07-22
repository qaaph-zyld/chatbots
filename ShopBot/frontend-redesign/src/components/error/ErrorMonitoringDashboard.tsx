'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useErrorContext } from './GlobalErrorProvider';
import { ErrorSeverity, StructuredError } from '@/lib/error/ErrorHandlingService';
import { AlertCircle, XCircle, AlertTriangle, Info, Search, Filter, RefreshCw, Trash2, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, LineChart } from '@/components/charts';

// Helper functions
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

const getSeverityIcon = (severity: ErrorSeverity) => {
  switch (severity) {
    case ErrorSeverity.FATAL:
      return <XCircle className="h-4 w-4 text-red-500" />;
    case ErrorSeverity.ERROR:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case ErrorSeverity.WARNING:
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case ErrorSeverity.INFO:
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

const getSeverityColor = (severity: ErrorSeverity): string => {
  switch (severity) {
    case ErrorSeverity.FATAL:
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case ErrorSeverity.ERROR:
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
    case ErrorSeverity.WARNING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case ErrorSeverity.INFO:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

export function ErrorMonitoringDashboard() {
  const { errors, clearErrors, clearError } = useErrorContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | 'all'>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [sortField, setSortField] = useState<keyof StructuredError>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedError, setSelectedError] = useState<StructuredError | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Filter and sort errors
  const filteredErrors = errors.filter(error => {
    // Apply search filter
    const searchMatch = searchTerm === '' || 
      error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (error.code && error.code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply severity filter
    const severityMatch = severityFilter === 'all' || error.severity === severityFilter;
    
    // Apply time range filter
    const now = Date.now();
    let timeLimit = 0;
    switch (timeRange) {
      case '1h':
        timeLimit = now - 60 * 60 * 1000;
        break;
      case '6h':
        timeLimit = now - 6 * 60 * 60 * 1000;
        break;
      case '24h':
        timeLimit = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        timeLimit = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case '30d':
        timeLimit = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        timeLimit = 0;
    }
    
    const timeMatch = timeRange === 'all' || error.timestamp >= timeLimit;
    
    return searchMatch && severityMatch && timeMatch;
  }).sort((a, b) => {
    // Sort by the selected field
    const fieldA = a[sortField];
    const fieldB = b[sortField];
    
    if (fieldA === fieldB) return 0;
    
    // Handle different types of fields
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB) 
        : fieldB.localeCompare(fieldA);
    }
    
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sortDirection === 'asc' 
        ? fieldA - fieldB 
        : fieldB - fieldA;
    }
    
    // Default sort by timestamp if fields are incomparable
    return sortDirection === 'asc' 
      ? a.timestamp - b.timestamp 
      : b.timestamp - a.timestamp;
  });

  // Handle sort toggle
  const toggleSort = (field: keyof StructuredError) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Prepare chart data
  const prepareErrorCountByTimeData = () => {
    // Group errors by hour for the last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    // Create hourly buckets
    const hourlyBuckets: { [hour: string]: { [severity: string]: number } } = {};
    for (let i = 0; i < 24; i++) {
      const date = new Date(last24Hours);
      date.setHours(date.getHours() + i);
      const hourKey = date.toLocaleTimeString([], { hour: '2-digit', hour12: false });
      hourlyBuckets[hourKey] = {
        [ErrorSeverity.FATAL]: 0,
        [ErrorSeverity.ERROR]: 0,
        [ErrorSeverity.WARNING]: 0,
        [ErrorSeverity.INFO]: 0
      };
    }
    
    // Count errors by severity and hour
    errors.forEach(error => {
      const errorDate = new Date(error.timestamp);
      if (errorDate >= last24Hours) {
        const hourKey = errorDate.toLocaleTimeString([], { hour: '2-digit', hour12: false });
        if (hourlyBuckets[hourKey]) {
          hourlyBuckets[hourKey][error.severity]++;
        }
      }
    });
    
    // Format data for chart
    return {
      labels: Object.keys(hourlyBuckets),
      datasets: [
        {
          label: 'Fatal',
          data: Object.values(hourlyBuckets).map(bucket => bucket[ErrorSeverity.FATAL]),
          backgroundColor: 'rgba(220, 38, 38, 0.5)',
          borderColor: 'rgba(220, 38, 38, 1)',
        },
        {
          label: 'Error',
          data: Object.values(hourlyBuckets).map(bucket => bucket[ErrorSeverity.ERROR]),
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          borderColor: 'rgba(239, 68, 68, 1)',
        },
        {
          label: 'Warning',
          data: Object.values(hourlyBuckets).map(bucket => bucket[ErrorSeverity.WARNING]),
          backgroundColor: 'rgba(234, 179, 8, 0.5)',
          borderColor: 'rgba(234, 179, 8, 1)',
        },
        {
          label: 'Info',
          data: Object.values(hourlyBuckets).map(bucket => bucket[ErrorSeverity.INFO]),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
        }
      ]
    };
  };

  const prepareErrorsByTypeData = () => {
    // Group errors by message (simplified)
    const errorTypes: { [message: string]: number } = {};
    errors.forEach(error => {
      // Use first 50 chars of message as key to group similar errors
      const key = error.message.substring(0, 50);
      errorTypes[key] = (errorTypes[key] || 0) + 1;
    });
    
    // Sort by count and take top 10
    const topErrors = Object.entries(errorTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      labels: topErrors.map(([message]) => message),
      datasets: [
        {
          label: 'Count',
          data: topErrors.map(([, count]) => count),
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgba(99, 102, 241, 1)',
        }
      ]
    };
  };

  // Error statistics
  const errorStats = {
    total: errors.length,
    fatal: errors.filter(e => e.severity === ErrorSeverity.FATAL).length,
    error: errors.filter(e => e.severity === ErrorSeverity.ERROR).length,
    warning: errors.filter(e => e.severity === ErrorSeverity.WARNING).length,
    info: errors.filter(e => e.severity === ErrorSeverity.INFO).length,
    recent24h: errors.filter(e => e.timestamp > Date.now() - 24 * 60 * 60 * 1000).length
  };

  // Export errors as JSON
  const exportErrors = () => {
    const dataStr = JSON.stringify(filteredErrors, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `error-log-${new Date().toISOString()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Error Monitoring Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => clearErrors()}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportErrors}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Error List</TabsTrigger>
          <TabsTrigger value="details">Error Details</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errorStats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Fatal Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  <div className="text-2xl font-bold">{errorStats.fatal}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                  <div className="text-2xl font-bold">{errorStats.error}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  <div className="text-2xl font-bold">{errorStats.warning}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{errorStats.recent24h}</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Errors Over Time</CardTitle>
                <CardDescription>Last 24 hours</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <LineChart data={prepareErrorCountByTimeData()} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Error Types</CardTitle>
                <CardDescription>Most frequent errors</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <BarChart data={prepareErrorsByTypeData()} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Error List Tab */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Error Log</CardTitle>
              <CardDescription>
                Showing {filteredErrors.length} of {errors.length} errors
              </CardDescription>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search errors..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select
                    value={severityFilter}
                    onValueChange={(value) => setSeverityFilter(value as ErrorSeverity | 'all')}
                  >
                    <SelectTrigger className="w-[130px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value={ErrorSeverity.FATAL}>Fatal</SelectItem>
                      <SelectItem value={ErrorSeverity.ERROR}>Error</SelectItem>
                      <SelectItem value={ErrorSeverity.WARNING}>Warning</SelectItem>
                      <SelectItem value={ErrorSeverity.INFO}>Info</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={timeRange}
                    onValueChange={setTimeRange}
                  >
                    <SelectTrigger className="w-[130px]">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="6h">Last 6 Hours</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">
                        <button 
                          className="flex items-center"
                          onClick={() => toggleSort('severity')}
                        >
                          Severity
                          {sortField === 'severity' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="ml-1 h-4 w-4" /> 
                              : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button 
                          className="flex items-center"
                          onClick={() => toggleSort('message')}
                        >
                          Message
                          {sortField === 'message' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="ml-1 h-4 w-4" /> 
                              : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="w-[180px]">
                        <button 
                          className="flex items-center"
                          onClick={() => toggleSort('timestamp')}
                        >
                          Time
                          {sortField === 'timestamp' && (
                            sortDirection === 'asc' 
                              ? <ChevronUp className="ml-1 h-4 w-4" /> 
                              : <ChevronDown className="ml-1 h-4 w-4" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredErrors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          No errors found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredErrors.map((error) => (
                        <TableRow 
                          key={error.timestamp} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedError(error);
                            setActiveTab('details');
                          }}
                        >
                          <TableCell>
                            <Badge className={getSeverityColor(error.severity)}>
                              <div className="flex items-center gap-1">
                                {getSeverityIcon(error.severity)}
                                <span>{error.severity}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {error.message.length > 100 
                              ? `${error.message.substring(0, 100)}...` 
                              : error.message}
                          </TableCell>
                          <TableCell>{formatDate(error.timestamp)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearError(error.timestamp);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredErrors.length} of {errors.length} errors
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Error Details Tab */}
        <TabsContent value="details">
          {selectedError ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getSeverityIcon(selectedError.severity)}
                      Error Details
                    </CardTitle>
                    <CardDescription>
                      {formatDate(selectedError.timestamp)}
                    </CardDescription>
                  </div>
                  <Badge className={getSeverityColor(selectedError.severity)}>
                    {selectedError.severity}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Message</h3>
                  <div className="bg-muted p-3 rounded-md">
                    {selectedError.message}
                  </div>
                </div>
                
                {selectedError.code && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Error Code</h3>
                    <div className="bg-muted p-3 rounded-md font-mono">
                      {selectedError.code}
                    </div>
                  </div>
                )}
                
                {selectedError.stack && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Stack Trace</h3>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-auto max-h-[300px]">
                      <pre>{selectedError.stack}</pre>
                    </div>
                  </div>
                )}
                
                {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Context</h3>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-auto max-h-[200px]">
                      <pre>{JSON.stringify(selectedError.context, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('errors')}
                >
                  Back to List
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => {
                    clearError(selectedError.timestamp);
                    setSelectedError(null);
                    setActiveTab('errors');
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Error Selected</h3>
                <p className="text-muted-foreground mt-1">
                  Select an error from the list to view details
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setActiveTab('errors')}
                >
                  View Error List
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
