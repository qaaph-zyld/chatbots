/**
 * Enterprise Collaboration Dashboard
 * Role-based permissions and team collaboration interface
 * Part of Phase 3: Market Leadership - Enterprise Tools & Strategic Integration
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Shield, Activity, Search, Plus, Settings, 
  UserPlus, Crown, Eye, Lock, AlertTriangle, CheckCircle,
  Calendar, MessageSquare, FileText, BarChart3, Globe
} from 'lucide-react';
import EnterpriseCollaborationService from '../../services/EnterpriseCollaborationService';
import { 
  User, Role, Team, Project, Activity as ActivityType, 
  AuditLog, SearchResult, Organization 
} from '../../types/EnterpriseCollaborationTypes';

interface EnterpriseCollaborationDashboardProps {
  className?: string;
  compactMode?: boolean;
}

const EnterpriseCollaborationDashboard: React.FC<EnterpriseCollaborationDashboardProps> = ({
  className = '',
  compactMode = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  
  // Form states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const collaborationService = EnterpriseCollaborationService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setUsers(collaborationService.getAllUsers());
      setRoles(collaborationService.getAllRoles());
      setTeams(collaborationService.getAllTeams());
      setProjects(collaborationService.getAllProjects());
      setActivities(collaborationService.getActivities().slice(-50)); // Last 50 activities
      setAuditLogs(collaborationService.getAuditLogs().slice(-50)); // Last 50 audit logs
      setOrganization(collaborationService.getOrganization('org_1'));
    } catch (error) {
      console.error('Error loading collaboration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await collaborationService.searchResources(searchQuery, 'user_1');
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await collaborationService.createUser(userData, 'user_1');
      await loadData();
      setShowUserForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await collaborationService.assignRole(userId, roleId, 'user_1');
      await loadData();
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Roles</p>
              <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Teams</p>
              <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Status */}
      {organization && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security & Compliance Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">MFA Required: {organization.settings.security.mfaRequired ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">SSO: {organization.settings.security.ssoEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">Audit Logging: {organization.settings.security.auditLogging ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">GDPR: {organization.settings.compliance.gdprEnabled ? 'Compliant' : 'Not Enabled'}</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">SOC2: {organization.settings.compliance.soc2Enabled ? 'Compliant' : 'Not Enabled'}</span>
            </div>
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">Session Timeout: {organization.settings.security.sessionTimeout}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.timestamp.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">User Management</h3>
        <button
          onClick={() => setShowUserForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                      {user.roles.some(role => role.level === 'system') && (
                        <Crown className="h-4 w-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">
                      Roles: {user.roles.map(role => role.name).join(', ')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-blue-600 hover:text-blue-900"
                  >
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

  const renderRolesTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Role Management</h3>
        <button
          onClick={() => setShowRoleForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">{role.name}</h4>
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600 mb-4">{role.description}</p>
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Level: {role.level}</div>
              <div className="text-xs text-gray-500">Permissions: {role.permissions.length}</div>
              <div className="text-xs text-gray-500">
                Users: {users.filter(user => user.roles.some(r => r.id === role.id)).length}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTeamsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
        <button
          onClick={() => setShowTeamForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">{team.name}</h4>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600 mb-4">{team.description}</p>
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Type: {team.type}</div>
              <div className="text-xs text-gray-500">Members: {team.members.length}</div>
              <div className="text-xs text-gray-500">Projects: {team.projects.length}</div>
              <div className="text-xs text-gray-500">Visibility: {team.settings.visibility}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Audit & Security Logs</h3>
      
      {/* Audit Logs */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {auditLogs.map((log) => (
            <li key={log.id}>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className={`h-5 w-5 mr-3 ${
                      log.result === 'success' ? 'text-green-500' : 
                      log.result === 'failure' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.details.description}</div>
                      <div className="text-sm text-gray-500">
                        {log.event} - {log.action} - {log.resourceType}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">{log.timestamp.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{log.ipAddress}</div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderSearchTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Search & Discovery</h3>
      
      {/* Search Input */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users, teams, projects..."
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {searchResults.map((result) => (
              <li key={result.id}>
                <div className="px-4 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {result.type === 'user' && <Users className="h-5 w-5 text-blue-500" />}
                      {result.type === 'team' && <Users className="h-5 w-5 text-purple-500" />}
                      {result.type === 'project' && <FileText className="h-5 w-5 text-orange-500" />}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{result.title}</div>
                      <div className="text-sm text-gray-500">{result.description}</div>
                      <div className="text-xs text-gray-400">Type: {result.type} | Score: {result.score.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'roles', name: 'Roles', icon: Shield },
    { id: 'teams', name: 'Teams', icon: Users },
    { id: 'audit', name: 'Audit', icon: AlertTriangle },
    { id: 'search', name: 'Search', icon: Search }
  ];

  return (
    <div className={`enterprise-collaboration-dashboard ${className}`} data-testid="enterprise-collaboration-dashboard">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Enterprise Collaboration</h2>
        <p className="text-gray-600">Manage users, roles, teams, and security settings</p>
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
        {!loading && activeTab === 'users' && renderUsersTab()}
        {!loading && activeTab === 'roles' && renderRolesTab()}
        {!loading && activeTab === 'teams' && renderTeamsTab()}
        {!loading && activeTab === 'audit' && renderAuditTab()}
        {!loading && activeTab === 'search' && renderSearchTab()}
      </div>
    </div>
  );
};

export default EnterpriseCollaborationDashboard;
