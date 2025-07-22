'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  useProductionReadiness, 
  CheckResult, 
  CheckCategory, 
  ReadinessReport 
} from '@/lib/quality/ProductionReadinessChecker';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  RefreshCw,
  Shield,
  Gauge,
  Search,
  Smartphone,
  CheckCheck,
  BarChart3
} from 'lucide-react';

// Helper functions
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString();
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const getStatusIcon = (status: 'pass' | 'warn' | 'fail' | 'info') => {
  switch (status) {
    case 'pass':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'warn':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'fail':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    default:
      return null;
  }
};

const getStatusColor = (status: 'pass' | 'warn' | 'fail' | 'info') => {
  switch (status) {
    case 'pass':
      return 'bg-green-100 text-green-800';
    case 'warn':
      return 'bg-yellow-100 text-yellow-800';
    case 'fail':
      return 'bg-red-100 text-red-800';
    case 'info':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getCategoryIcon = (category: CheckCategory) => {
  switch (category) {
    case 'performance':
      return <Gauge className="h-5 w-5" />;
    case 'accessibility':
      return <CheckCheck className="h-5 w-5" />;
    case 'seo':
      return <Search className="h-5 w-5" />;
    case 'security':
      return <Shield className="h-5 w-5" />;
    case 'compatibility':
      return <Smartphone className="h-5 w-5" />;
    case 'general':
      return <BarChart3 className="h-5 w-5" />;
    default:
      return null;
  }
};

const getCategoryName = (category: CheckCategory): string => {
  switch (category) {
    case 'performance':
      return 'Performance';
    case 'accessibility':
      return 'Accessibility';
    case 'seo':
      return 'SEO';
    case 'security':
      return 'Security';
    case 'compatibility':
      return 'Compatibility';
    case 'general':
      return 'General';
    default:
      return category;
  }
};

// Components
interface CheckItemProps {
  check: CheckResult;
}

const CheckItem: React.FC<CheckItemProps> = ({ check }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div 
      className="border rounded-md p-4 mb-3 cursor-pointer hover:bg-gray-50"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon(check.status)}
          <div>
            <h4 className="font-medium">{check.name}</h4>
            <p className="text-sm text-gray-600">{check.message}</p>
          </div>
        </div>
        <Badge className={getStatusColor(check.status)}>
          {check.status.toUpperCase()}
        </Badge>
      </div>
      
      {expanded && check.details && (
        <div className="mt-3 pt-3 border-t text-sm text-gray-600">
          {check.details}
        </div>
      )}
    </div>
  );
};

interface CategorySummaryProps {
  category: CheckCategory;
  summary: {
    total: number;
    pass: number;
    warn: number;
    fail: number;
    score: number;
  };
  onSelect: () => void;
}

const CategorySummary: React.FC<CategorySummaryProps> = ({ category, summary, onSelect }) => {
  let statusColor = 'text-green-500';
  if (summary.score < 70) statusColor = 'text-red-500';
  else if (summary.score < 90) statusColor = 'text-yellow-500';
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onSelect}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {getCategoryIcon(category)}
            <CardTitle className="text-sm font-medium">{getCategoryName(category)}</CardTitle>
          </div>
          <Badge className={summary.score >= 90 ? 'bg-green-100 text-green-800' : summary.score >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
            {summary.score}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Progress value={summary.score} className="h-2 mb-2" />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{summary.pass} passed</span>
          <span>{summary.warn} warnings</span>
          <span>{summary.fail} failed</span>
        </div>
      </CardContent>
    </Card>
  );
};

interface ProductionReadinessDashboardProps {
  compact?: boolean;
}

export function ProductionReadinessDashboard({ compact = false }: ProductionReadinessDashboardProps) {
  const { report, loading, runChecks } = useProductionReadiness();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCategory, setSelectedCategory] = useState<CheckCategory | null>(null);
  
  useEffect(() => {
    if (!report) {
      runChecks();
    }
  }, [report, runChecks]);
  
  const handleRefresh = () => {
    runChecks();
  };
  
  const handleCategorySelect = (category: CheckCategory) => {
    setSelectedCategory(category);
    setActiveTab('category');
  };
  
  // Get checks for the selected category
  const getCategoryChecks = (): CheckResult[] => {
    if (!report || !selectedCategory) return [];
    return report.checks.filter(check => check.id.startsWith(getCategoryPrefix(selectedCategory)));
  };
  
  const getCategoryPrefix = (category: CheckCategory): string => {
    switch (category) {
      case 'performance': return 'perf-';
      case 'accessibility': return 'a11y-';
      case 'seo': return 'seo-';
      case 'security': return 'sec-';
      case 'compatibility': return 'compat-';
      case 'general': return 'general-';
    }
  };
  
  // Get readiness status
  const getReadinessStatus = (): { label: string; color: string } => {
    if (!report) return { label: 'Unknown', color: 'text-gray-500' };
    
    const score = report.overallScore;
    if (score >= 90) {
      return { label: 'Production Ready', color: 'text-green-500' };
    } else if (score >= 80) {
      return { label: 'Almost Ready', color: 'text-blue-500' };
    } else if (score >= 60) {
      return { label: 'Needs Improvement', color: 'text-yellow-500' };
    } else {
      return { label: 'Not Ready', color: 'text-red-500' };
    }
  };
  
  const readinessStatus = getReadinessStatus();
  
  // Count issues by severity
  const countIssues = (): { warnings: number; failures: number } => {
    if (!report) return { warnings: 0, failures: 0 };
    
    return report.checks.reduce(
      (counts, check) => {
        if (check.status === 'warn') counts.warnings++;
        if (check.status === 'fail') counts.failures++;
        return counts;
      },
      { warnings: 0, failures: 0 }
    );
  };
  
  const issues = countIssues();
  
  // Adjust layout based on compact mode
  return (
    <div className={`${compact ? '' : 'container mx-auto py-6'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Production Readiness Dashboard</h1>
        <Button 
          onClick={handleRefresh} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running Checks...' : 'Run Checks'}
        </Button>
      </div>
      
      {!report && loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Running production readiness checks...</p>
        </div>
      ) : !report ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No readiness report available. Run checks to generate a report.</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="category">Category Details</TabsTrigger>
            <TabsTrigger value="all">All Checks</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Readiness Score</CardTitle>
                  <CheckCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <div className="text-2xl font-bold">{report.overallScore}</div>
                    <span className={`ml-2 ${readinessStatus.color}`}>{readinessStatus.label}</span>
                  </div>
                  <Progress value={report.overallScore} className="h-2 mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDate(report.timestamp)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(report.timestamp)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{issues.warnings}</div>
                  <p className="text-xs text-muted-foreground">
                    Require attention
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failures</CardTitle>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{issues.failures}</div>
                  <p className="text-xs text-muted-foreground">
                    Must be fixed before release
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(report.categories).map(([category, summary]) => (
                <CategorySummary 
                  key={category}
                  category={category as CheckCategory}
                  summary={summary}
                  onSelect={() => handleCategorySelect(category as CheckCategory)}
                />
              ))}
            </div>
            
            {(issues.warnings > 0 || issues.failures > 0) && (
              <Alert className={issues.failures > 0 ? 'bg-red-50' : 'bg-yellow-50'}>
                {issues.failures > 0 ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {issues.failures > 0 
                    ? `${issues.failures} critical issues must be resolved` 
                    : `${issues.warnings} warnings require attention`}
                </AlertTitle>
                <AlertDescription>
                  {issues.failures > 0 
                    ? 'These issues must be fixed before deploying to production.' 
                    : 'Consider addressing these warnings to improve quality.'}
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          {/* Category Details Tab */}
          <TabsContent value="category" className="space-y-6">
            {selectedCategory ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  {getCategoryIcon(selectedCategory)}
                  <h2 className="text-xl font-bold">{getCategoryName(selectedCategory)} Checks</h2>
                </div>
                
                <div className="space-y-4">
                  {getCategoryChecks().map((check, index) => (
                    <CheckItem key={index} check={check} />
                  ))}
                </div>
                
                {getCategoryChecks().length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No checks found for this category
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Select a category from the overview tab to see detailed results
              </div>
            )}
          </TabsContent>
          
          {/* All Checks Tab */}
          <TabsContent value="all" className="space-y-6">
            <div className="space-y-4">
              {report.checks.map((check, index) => (
                <CheckItem key={index} check={check} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
