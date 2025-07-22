/**
 * Automation Workflow Dashboard
 * Advanced workflow automation and orchestration interface
 * Part of Phase 3: Market Leadership - Enterprise Tools & Strategic Integration
 */

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Square, Settings, Plus, Eye, Edit, Trash2,
  Clock, CheckCircle, XCircle, AlertTriangle, BarChart3,
  Zap, GitBranch, Calendar, Users, Activity, TrendingUp
} from 'lucide-react';
import AutomationWorkflowService from '../../services/AutomationWorkflowService';
import { 
  Workflow, WorkflowExecution, WorkflowTemplate, WorkflowMetrics,
  WorkflowStatus, ExecutionStatus 
} from '../../types/AutomationWorkflowTypes';

interface AutomationWorkflowDashboardProps {
  className?: string;
  compactMode?: boolean;
}

const AutomationWorkflowDashboard: React.FC<AutomationWorkflowDashboardProps> = ({
  className = '',
  compactMode = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [workflowMetrics, setWorkflowMetrics] = useState<Map<string, WorkflowMetrics>>(new Map());
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showExecutionDetails, setShowExecutionDetails] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);

  const workflowService = AutomationWorkflowService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allWorkflows = workflowService.getAllWorkflows();
      setWorkflows(allWorkflows);
      
      setTemplates(workflowService.getAllTemplates());
      
      // Load recent executions
      const recentExecutions: WorkflowExecution[] = [];
      allWorkflows.forEach(workflow => {
        const workflowExecutions = workflowService.getWorkflowExecutions(workflow.id);
        recentExecutions.push(...workflowExecutions.slice(-10)); // Last 10 executions per workflow
      });
      setExecutions(recentExecutions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()));
      
      // Load metrics for each workflow
      const metricsMap = new Map<string, WorkflowMetrics>();
      allWorkflows.forEach(workflow => {
        const metrics = workflowService.getWorkflowMetrics(workflow.id);
        if (metrics) {
          metricsMap.set(workflow.id, metrics);
        }
      });
      setWorkflowMetrics(metricsMap);
      
    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerWorkflow = async (workflowId: string) => {
    try {
      setLoading(true);
      await workflowService.triggerWorkflow(workflowId, {}, 'user_1');
      await loadData();
    } catch (error) {
      console.error('Error triggering workflow:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkflowStatus = async (workflowId: string, status: WorkflowStatus) => {
    try {
      await workflowService.updateWorkflow(workflowId, { status });
      await loadData();
    } catch (error) {
      console.error('Error updating workflow status:', error);
    }
  };

  const getStatusIcon = (status: WorkflowStatus | ExecutionStatus) => {
    switch (status) {
      case 'active':
      case 'running':
        return <Play className="h-4 w-4 text-green-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: WorkflowStatus | ExecutionStatus) => {
    switch (status) {
      case 'active':
      case 'running':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderOverviewTab = () => {
    const activeWorkflows = workflows.filter(w => w.status === 'active').length;
    const totalExecutions = Array.from(workflowMetrics.values()).reduce((sum, m) => sum + m.totalExecutions, 0);
    const avgSuccessRate = Array.from(workflowMetrics.values()).reduce((sum, m) => sum + m.successRate, 0) / workflowMetrics.size || 0;
    const recentExecutions = executions.slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{activeWorkflows}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">{totalExecutions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{avgSuccessRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Executions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Executions</h3>
          <div className="space-y-3">
            {recentExecutions.map((execution) => {
              const workflow = workflows.find(w => w.id === execution.workflowId);
              return (
                <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{workflow?.name || 'Unknown Workflow'}</p>
                      <p className="text-xs text-gray-500">
                        Started: {execution.startTime.toLocaleString()}
                        {execution.duration && ` • Duration: ${Math.round(execution.duration / 1000)}s`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedExecution(execution);
                        setShowExecutionDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Workflows */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Workflows</h3>
          <div className="space-y-3">
            {workflows
              .filter(w => workflowMetrics.has(w.id))
              .sort((a, b) => {
                const metricsA = workflowMetrics.get(a.id)!;
                const metricsB = workflowMetrics.get(b.id)!;
                return metricsB.successRate - metricsA.successRate;
              })
              .slice(0, 5)
              .map((workflow) => {
                const metrics = workflowMetrics.get(workflow.id)!;
                return (
                  <div key={workflow.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{workflow.name}</p>
                      <p className="text-xs text-gray-500">{workflow.category} • {metrics.totalExecutions} executions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{metrics.successRate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">{Math.round(metrics.averageDuration / 1000)}s avg</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  const renderWorkflowsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Workflow Management</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </button>
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => {
          const metrics = workflowMetrics.get(workflow.id);
          return (
            <div key={workflow.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(workflow.status)}
                  <h4 className="text-lg font-medium text-gray-900">{workflow.name}</h4>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{workflow.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Type: {workflow.type}</span>
                  <span>Category: {workflow.category}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Steps: {workflow.steps.length}</span>
                  <span>Triggers: {workflow.triggers.length}</span>
                </div>
                {metrics && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Executions: {metrics.totalExecutions}</span>
                    <span>Success: {metrics.successRate.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTriggerWorkflow(workflow.id)}
                    disabled={workflow.status !== 'active'}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Run
                  </button>
                  
                  {workflow.status === 'active' ? (
                    <button
                      onClick={() => handleUpdateWorkflowStatus(workflow.id, 'paused')}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateWorkflowStatus(workflow.id, 'active')}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Activate
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => setSelectedWorkflow(workflow)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-900">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderExecutionsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Execution History</h3>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {executions.map((execution) => {
            const workflow = workflows.find(w => w.id === execution.workflowId);
            return (
              <li key={execution.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(execution.status)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{workflow?.name || 'Unknown Workflow'}</div>
                      <div className="text-sm text-gray-500">
                        Started: {execution.startTime.toLocaleString()}
                        {execution.endTime && ` • Ended: ${execution.endTime.toLocaleString()}`}
                      </div>
                      <div className="text-xs text-gray-400">
                        Triggered by: {execution.triggeredBy.type} • 
                        {execution.duration ? ` Duration: ${Math.round(execution.duration / 1000)}s` : ' Running...'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                      {execution.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedExecution(execution);
                        setShowExecutionDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Workflow Templates</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">★ {template.rating}</span>
                <span className="text-xs text-gray-500">{template.downloads} downloads</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Category: {template.category}</span>
                <span>Version: {template.version}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Author: {template.author}</span>
                <span>Popularity: {template.popularity}%</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {tag}
                </span>
              ))}
            </div>

            <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'workflows', name: 'Workflows', icon: GitBranch },
    { id: 'executions', name: 'Executions', icon: Activity },
    { id: 'templates', name: 'Templates', icon: Users }
  ];

  return (
    <div className={`automation-workflow-dashboard ${className}`} data-testid="automation-workflow-dashboard">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Automation Workflows</h2>
        <p className="text-gray-600">Design, execute, and monitor intelligent workflow automation</p>
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
        {!loading && activeTab === 'workflows' && renderWorkflowsTab()}
        {!loading && activeTab === 'executions' && renderExecutionsTab()}
        {!loading && activeTab === 'templates' && renderTemplatesTab()}
      </div>
    </div>
  );
};

export default AutomationWorkflowDashboard;
