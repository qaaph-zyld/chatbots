/**
 * Security & Compliance Dashboard
 * Comprehensive security monitoring with vulnerability tracking, compliance validation, and threat detection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Bug,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Maximize2,
  Target
} from 'lucide-react';
import {
  SecurityVulnerability,
  SecurityIncident,
  SecurityMetrics,
  ComplianceStandard,
  SecurityAuditLog,
  SecurityRecommendation
} from '../../types/SecurityComplianceTypes';
import SecurityMonitoringService from '../../services/SecurityMonitoringService';

interface SecurityComplianceDashboardProps {
  className?: string;
  refreshInterval?: number;
  compactMode?: boolean;
}

interface SecurityMetricCardProps {
  title: string;
  value: number;
  total?: number;
  unit?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ReactNode;
  compactMode?: boolean;
}

const SecurityMetricCard: React.FC<SecurityMetricCardProps> = ({
  title, value, total, unit = '', severity = 'low', icon, compactMode = false
}) => {
  const severityColors = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-orange-600 bg-orange-50 border-orange-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className={`p-6 rounded-lg border ${severityColors[severity]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold">{value}</span>
          <span className="text-sm text-gray-500">{unit}</span>
          {total && <span className="text-lg text-gray-400">/ {total}</span>}
        </div>
        
        {total && <Progress value={(value / total) * 100} className="h-2" />}
      </div>
    </div>
  );
};

const VulnerabilityItem: React.FC<{ 
  vulnerability: SecurityVulnerability; 
  onStatusChange: (id: string, status: string) => void;
}> = ({ vulnerability, onStatusChange }) => {
  const severityColors = {
    info: 'border-blue-200 bg-blue-50',
    low: 'border-green-200 bg-green-50',
    medium: 'border-yellow-200 bg-yellow-50',
    high: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50'
  };

  const severityIcons = {
    info: <Eye className="h-4 w-4 text-blue-500" />,
    low: <CheckCircle className="h-4 w-4 text-green-500" />,
    medium: <Clock className="h-4 w-4 text-yellow-500" />,
    high: <AlertTriangle className="h-4 w-4 text-orange-500" />,
    critical: <XCircle className="h-4 w-4 text-red-500" />
  };

  return (
    <div className={`p-4 rounded-lg border ${severityColors[vulnerability.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {severityIcons[vulnerability.severity]}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{vulnerability.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{vulnerability.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span className="capitalize">{vulnerability.category.replace('_', ' ')}</span>
              <span>Detected: {vulnerability.detectedAt.toLocaleDateString()}</span>
              <span className="capitalize">{vulnerability.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onStatusChange(vulnerability.id, 'in_progress')}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            disabled={vulnerability.status === 'in_progress'}
          >
            In Progress
          </button>
          <button
            onClick={() => onStatusChange(vulnerability.id, 'resolved')}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
            disabled={vulnerability.status === 'resolved'}
          >
            Resolve
          </button>
        </div>
      </div>
    </div>
  );
};

const ComplianceStatusCard: React.FC<{ standard: ComplianceStandard }> = ({ standard }) => {
  const statusColors = {
    compliant: 'text-green-600 bg-green-50 border-green-200',
    non_compliant: 'text-red-600 bg-red-50 border-red-200',
    partial: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    pending_review: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const statusIcons = {
    compliant: <CheckCircle className="h-5 w-5 text-green-500" />,
    non_compliant: <XCircle className="h-5 w-5 text-red-500" />,
    partial: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    pending_review: <Clock className="h-5 w-5 text-blue-500" />
  };

  const metRequirements = standard.requirements.filter(req => req.status === 'met').length;
  const totalRequirements = standard.requirements.length;
  const compliancePercentage = totalRequirements > 0 ? (metRequirements / totalRequirements) * 100 : 100;

  return (
    <div className={`p-6 rounded-lg border ${statusColors[standard.status]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {statusIcons[standard.status]}
          <h3 className="text-lg font-semibold">{standard.name} {standard.version}</h3>
        </div>
        <span className="text-2xl font-bold">{compliancePercentage.toFixed(0)}%</span>
      </div>
      
      <div className="space-y-3">
        <Progress value={compliancePercentage} className="h-3" />
        <div className="flex justify-between text-sm text-gray-600">
          <span>{metRequirements} of {totalRequirements} requirements met</span>
          <span className="capitalize">{standard.status.replace('_', ' ')}</span>
        </div>
        <div className="text-xs text-gray-500">
          Last audit: {standard.lastAudit.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

const SecurityComplianceDashboard: React.FC<SecurityComplianceDashboardProps> = ({
  className = '',
  refreshInterval = 30000,
  compactMode = false
}) => {
  const [securityService] = useState(() => new SecurityMonitoringService());
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [complianceStandards, setComplianceStandards] = useState<ComplianceStandard[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [recommendations, setRecommendations] = useState<SecurityRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      
      const securityMetrics = securityService.getSecurityMetrics();
      const vulns = securityService.getVulnerabilities();
      const incs = securityService.getIncidents();
      const standards = securityService.getComplianceStandards();
      const logs = securityService.getAuditLogs().slice(-50);
      const recs = securityService.getSecurityRecommendations();

      setMetrics(securityMetrics);
      setVulnerabilities(vulns);
      setIncidents(incs);
      setComplianceStandards(standards);
      setAuditLogs(logs);
      setRecommendations(recs);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Failed to refresh security data:', error);
    } finally {
      setLoading(false);
    }
  }, [securityService]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshData, refreshInterval]);

  const handleVulnerabilityStatusChange = (id: string, status: string) => {
    setVulnerabilities(prev => prev.map(vuln => 
      vuln.id === id ? { ...vuln, status: status as any } : vuln
    ));
  };

  const runSecurityScan = async () => {
    setLoading(true);
    try {
      await securityService.runSecurityScan('static_analysis');
      setTimeout(refreshData, 3000);
    } catch (error) {
      console.error('Failed to run security scan:', error);
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-lg">Loading security data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security & Compliance Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Real-time security monitoring and compliance validation
            {lastUpdated && (
              <span className="ml-2 text-sm">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={runSecurityScan}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            disabled={loading}
          >
            <Bug className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Run Scan</span>
          </button>
          
          <button
            onClick={refreshData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Security Status Bar */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{metrics.vulnerabilities.critical}</div>
            <div className="text-sm text-gray-600">Critical Vulnerabilities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{metrics.incidents.open}</div>
            <div className="text-sm text-gray-600">Open Incidents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.compliance.overallScore}%</div>
            <div className="text-sm text-gray-600">Compliance Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.scans.coverage.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Scan Coverage</div>
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SecurityMetricCard
                title="Total Vulnerabilities"
                value={metrics.vulnerabilities.total}
                severity={metrics.vulnerabilities.critical > 0 ? 'critical' : 
                         metrics.vulnerabilities.high > 0 ? 'high' : 'low'}
                icon={<Bug className="h-5 w-5" />}
                compactMode={compactMode}
              />
              <SecurityMetricCard
                title="Security Incidents"
                value={metrics.incidents.open}
                total={metrics.incidents.total}
                severity={metrics.incidents.open > 5 ? 'high' : 
                         metrics.incidents.open > 0 ? 'medium' : 'low'}
                icon={<AlertTriangle className="h-5 w-5" />}
                compactMode={compactMode}
              />
              <SecurityMetricCard
                title="Compliance Score"
                value={metrics.compliance.overallScore}
                unit="%"
                severity={metrics.compliance.overallScore < 70 ? 'critical' :
                         metrics.compliance.overallScore < 85 ? 'medium' : 'low'}
                icon={<Shield className="h-5 w-5" />}
                compactMode={compactMode}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white border rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Recent Security Events</span>
              </h3>
              <div className="space-y-3">
                {auditLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{log.event}</div>
                      <div className="text-xs text-gray-500">
                        {log.timestamp.toLocaleString()} • {log.category}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      log.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      log.severity === 'error' ? 'bg-orange-100 text-orange-700' :
                      log.severity === 'warn' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {log.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white border rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Top Recommendations</span>
              </h3>
              <div className="space-y-3">
                {recommendations.slice(0, 3).map(rec => (
                  <div key={rec.id} className="p-3 bg-gray-50 rounded">
                    <div className="font-medium text-sm">{rec.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{rec.description}</div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        rec.impact === 'high' ? 'bg-red-100 text-red-700' :
                        rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rec.impact} impact
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Vulnerabilities</h3>
            <span className="text-sm text-gray-500">{vulnerabilities.length} total vulnerabilities</span>
          </div>
          
          {vulnerabilities.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Vulnerabilities Detected</h3>
              <p className="text-gray-500">All security scans passed successfully.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vulnerabilities.map(vulnerability => (
                <VulnerabilityItem
                  key={vulnerability.id}
                  vulnerability={vulnerability}
                  onStatusChange={handleVulnerabilityStatusChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Compliance Standards</h3>
            <span className="text-sm text-gray-500">{complianceStandards.length} standards monitored</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complianceStandards.map(standard => (
              <ComplianceStatusCard key={`${standard.name}-${standard.version}`} standard={standard} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Incidents</h3>
            <span className="text-sm text-gray-500">{incidents.length} total incidents</span>
          </div>
          
          {incidents.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Incidents</h3>
              <p className="text-gray-500">All systems are secure and operating normally.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map(incident => (
                <div key={incident.id} className="p-6 border rounded-lg bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{incident.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="capitalize">{incident.severity} severity</span>
                        <span className="capitalize">{incident.category.replace('_', ' ')}</span>
                        <span>Detected: {incident.detectedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      incident.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      incident.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Security Recommendations</h3>
            <span className="text-sm text-gray-500">{recommendations.length} recommendations</span>
          </div>
          
          <div className="space-y-4">
            {recommendations.map(rec => (
              <div key={rec.id} className="p-6 border rounded-lg bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rec.impact === 'high' ? 'bg-red-100 text-red-700' :
                        rec.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rec.impact} impact
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{rec.description}</p>
                    <div className="text-sm text-gray-500">
                      Category: {rec.category} • Priority: {rec.priority}/10
                    </div>
                  </div>
                  <div className="ml-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Implement
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityComplianceDashboard;
