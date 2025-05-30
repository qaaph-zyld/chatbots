/**
 * Team Collaboration Service
 * 
 * This service provides team collaboration features for the chatbot platform,
 * including shared workspaces, real-time collaboration, and team management.
 */

// Use mock utilities for testing
const { logger, generateUuid } = require('../../utils/mock-utils');

/**
 * Team Collaboration Service class
 */
class TeamCollaborationService {
  /**
   * Initialize the team collaboration service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      maxTeamSize: parseInt(process.env.MAX_TEAM_SIZE || '50'),
      maxWorkspacesPerTeam: parseInt(process.env.MAX_WORKSPACES_PER_TEAM || '20'),
      maxProjectsPerWorkspace: parseInt(process.env.MAX_PROJECTS_PER_WORKSPACE || '50'),
      sessionTimeout: parseInt(process.env.COLLABORATION_SESSION_TIMEOUT || '3600000'), // 1 hour
      ...options
    };

    // Storage for teams, workspaces, and projects
    this.teams = new Map();
    this.workspaces = new Map();
    this.projects = new Map();
    this.members = new Map();
    this.activeSessions = new Map();
    this.collaborationHistory = new Map();

    logger.info('Team Collaboration Service initialized with options:', this.options);
  }

  /**
   * Create a new team
   * @param {Object} teamData - Team data
   * @returns {Object} - Creation result
   */
  createTeam(teamData) {
    try {
      const { name, description, ownerId } = teamData;

      if (!name) {
        throw new Error('Team name is required');
      }

      if (!ownerId) {
        throw new Error('Team owner ID is required');
      }

      // Generate team ID
      const teamId = generateUuid();

      // Create team object
      const team = {
        id: teamId,
        name,
        description: description || '',
        ownerId,
        members: [{ userId: ownerId, role: 'owner', joinedAt: new Date().toISOString() }],
        workspaces: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store team
      this.teams.set(teamId, team);

      logger.info(`Created team: ${name}`, { teamId, ownerId });
      return { success: true, team };
    } catch (error) {
      logger.error('Error creating team:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get team by ID
   * @param {string} teamId - Team ID
   * @returns {Object} - Team data
   */
  getTeam(teamId) {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      return { success: true, team };
    } catch (error) {
      logger.error('Error getting team:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update team information
   * @param {string} teamId - Team ID
   * @param {Object} updateData - Data to update
   * @returns {Object} - Update result
   */
  updateTeam(teamId, updateData) {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      // Update team properties
      if (updateData.name) {
        team.name = updateData.name;
      }

      if (updateData.description !== undefined) {
        team.description = updateData.description;
      }

      team.updatedAt = new Date().toISOString();

      // Store updated team
      this.teams.set(teamId, team);

      logger.info(`Updated team: ${team.name}`, { teamId });
      return { success: true, team };
    } catch (error) {
      logger.error('Error updating team:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID making the request
   * @returns {Object} - Deletion result
   */
  deleteTeam(teamId, userId) {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      // Check if user is the owner
      const isOwner = team.members.some(member => member.userId === userId && member.role === 'owner');

      if (!isOwner) {
        throw new Error('Only the team owner can delete the team');
      }

      // Delete all workspaces associated with the team
      for (const workspaceId of team.workspaces) {
        this.workspaces.delete(workspaceId);
      }

      // Delete the team
      this.teams.delete(teamId);

      logger.info(`Deleted team: ${team.name}`, { teamId, userId });
      return { success: true, message: `Team ${team.name} deleted successfully` };
    } catch (error) {
      logger.error('Error deleting team:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add a member to a team
   * @param {string} teamId - Team ID
   * @param {Object} memberData - Member data
   * @returns {Object} - Addition result
   */
  addTeamMember(teamId, memberData) {
    try {
      const { userId, role = 'member', invitedBy } = memberData;

      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!invitedBy) {
        throw new Error('Inviter ID is required');
      }

      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      // Check if user is already a member
      const existingMember = team.members.find(member => member.userId === userId);

      if (existingMember) {
        throw new Error(`User ${userId} is already a member of this team`);
      }

      // Check if team size limit is reached
      if (team.members.length >= this.options.maxTeamSize) {
        throw new Error(`Team size limit of ${this.options.maxTeamSize} members reached`);
      }

      // Check if inviter has permission to add members
      const inviter = team.members.find(member => member.userId === invitedBy);

      if (!inviter || (inviter.role !== 'owner' && inviter.role !== 'admin')) {
        throw new Error('Only team owners and admins can add members');
      }

      // Add member to team
      const member = {
        userId,
        role,
        invitedBy,
        joinedAt: new Date().toISOString()
      };

      team.members.push(member);
      team.updatedAt = new Date().toISOString();

      logger.info(`Added member to team: ${team.name}`, { teamId, userId, role });
      return { success: true, member };
    } catch (error) {
      logger.error('Error adding team member:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a member from a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to remove
   * @param {string} requestedBy - User ID making the request
   * @returns {Object} - Removal result
   */
  removeTeamMember(teamId, userId, requestedBy) {
    try {
      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      // Check if user is a member
      const memberIndex = team.members.findIndex(member => member.userId === userId);

      if (memberIndex === -1) {
        throw new Error(`User ${userId} is not a member of this team`);
      }

      // Check if requester has permission to remove members
      const requester = team.members.find(member => member.userId === requestedBy);

      if (!requester) {
        throw new Error('Requester is not a member of this team');
      }

      const memberToRemove = team.members[memberIndex];

      // Check permissions
      if (requester.role !== 'owner' && 
          (requester.role !== 'admin' || memberToRemove.role === 'owner' || memberToRemove.role === 'admin')) {
        throw new Error('Insufficient permissions to remove this member');
      }

      // Cannot remove the owner
      if (memberToRemove.role === 'owner' && team.members.filter(m => m.role === 'owner').length === 1) {
        throw new Error('Cannot remove the only owner of the team');
      }

      // Remove member
      team.members.splice(memberIndex, 1);
      team.updatedAt = new Date().toISOString();

      logger.info(`Removed member from team: ${team.name}`, { teamId, userId, requestedBy });
      return { success: true, message: `User ${userId} removed from team ${team.name}` };
    } catch (error) {
      logger.error('Error removing team member:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a workspace within a team
   * @param {Object} workspaceData - Workspace data
   * @returns {Object} - Creation result
   */
  createWorkspace(workspaceData) {
    try {
      const { name, description, teamId, createdBy } = workspaceData;

      if (!name) {
        throw new Error('Workspace name is required');
      }

      if (!teamId) {
        throw new Error('Team ID is required');
      }

      if (!createdBy) {
        throw new Error('Creator ID is required');
      }

      const team = this.teams.get(teamId);

      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      // Check if creator is a member of the team
      const creator = team.members.find(member => member.userId === createdBy);

      if (!creator) {
        throw new Error('Creator is not a member of this team');
      }

      // Check if workspace limit is reached
      if (team.workspaces.length >= this.options.maxWorkspacesPerTeam) {
        throw new Error(`Workspace limit of ${this.options.maxWorkspacesPerTeam} per team reached`);
      }

      // Generate workspace ID
      const workspaceId = generateUuid();

      // Create workspace object
      const workspace = {
        id: workspaceId,
        name,
        description: description || '',
        teamId,
        createdBy,
        members: team.members.map(member => ({
          userId: member.userId,
          role: member.role,
          joinedAt: new Date().toISOString()
        })),
        projects: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store workspace
      this.workspaces.set(workspaceId, workspace);

      // Add workspace to team
      team.workspaces.push(workspaceId);
      team.updatedAt = new Date().toISOString();

      logger.info(`Created workspace: ${name}`, { workspaceId, teamId, createdBy });
      return { success: true, workspace };
    } catch (error) {
      logger.error('Error creating workspace:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workspace by ID
   * @param {string} workspaceId - Workspace ID
   * @returns {Object} - Workspace data
   */
  getWorkspace(workspaceId) {
    try {
      const workspace = this.workspaces.get(workspaceId);

      if (!workspace) {
        throw new Error(`Workspace with ID ${workspaceId} not found`);
      }

      return { success: true, workspace };
    } catch (error) {
      logger.error('Error getting workspace:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a project within a workspace
   * @param {Object} projectData - Project data
   * @returns {Object} - Creation result
   */
  createProject(projectData) {
    try {
      const { name, description, workspaceId, createdBy } = projectData;

      if (!name) {
        throw new Error('Project name is required');
      }

      if (!workspaceId) {
        throw new Error('Workspace ID is required');
      }

      if (!createdBy) {
        throw new Error('Creator ID is required');
      }

      const workspace = this.workspaces.get(workspaceId);

      if (!workspace) {
        throw new Error(`Workspace with ID ${workspaceId} not found`);
      }

      // Check if creator is a member of the workspace
      const creator = workspace.members.find(member => member.userId === createdBy);

      if (!creator) {
        throw new Error('Creator is not a member of this workspace');
      }

      // Check if project limit is reached
      if (workspace.projects.length >= this.options.maxProjectsPerWorkspace) {
        throw new Error(`Project limit of ${this.options.maxProjectsPerWorkspace} per workspace reached`);
      }

      // Generate project ID
      const projectId = generateUuid();

      // Create project object
      const project = {
        id: projectId,
        name,
        description: description || '',
        workspaceId,
        createdBy,
        members: workspace.members.map(member => ({
          userId: member.userId,
          role: member.role,
          joinedAt: new Date().toISOString()
        })),
        resources: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store project
      this.projects.set(projectId, project);

      // Add project to workspace
      workspace.projects.push(projectId);
      workspace.updatedAt = new Date().toISOString();

      logger.info(`Created project: ${name}`, { projectId, workspaceId, createdBy });
      return { success: true, project };
    } catch (error) {
      logger.error('Error creating project:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Start a collaboration session
   * @param {Object} sessionData - Session data
   * @returns {Object} - Session result
   */
  startCollaborationSession(sessionData) {
    try {
      const { projectId, userId, resourceId } = sessionData;

      if (!projectId) {
        throw new Error('Project ID is required');
      }

      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!resourceId) {
        throw new Error('Resource ID is required');
      }

      const project = this.projects.get(projectId);

      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      // Check if user is a member of the project
      const member = project.members.find(member => member.userId === userId);

      if (!member) {
        throw new Error('User is not a member of this project');
      }

      // Generate session ID
      const sessionId = generateUuid();

      // Create session object
      const session = {
        id: sessionId,
        projectId,
        resourceId,
        participants: [{ userId, joinedAt: new Date().toISOString() }],
        changes: [],
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        status: 'active'
      };

      // Store session
      this.activeSessions.set(sessionId, session);

      // Add to collaboration history
      const historyEntry = {
        id: generateUuid(),
        type: 'session_started',
        sessionId,
        projectId,
        resourceId,
        userId,
        timestamp: new Date().toISOString(),
        details: { action: 'started_session' }
      };

      this.collaborationHistory.set(historyEntry.id, historyEntry);

      logger.info(`Started collaboration session`, { sessionId, projectId, resourceId, userId });
      return { success: true, session };
    } catch (error) {
      logger.error('Error starting collaboration session:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Join a collaboration session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Object} - Join result
   */
  joinCollaborationSession(sessionId, userId) {
    try {
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      if (session.status !== 'active') {
        throw new Error(`Session is not active`);
      }

      const project = this.projects.get(session.projectId);

      if (!project) {
        throw new Error(`Project with ID ${session.projectId} not found`);
      }

      // Check if user is a member of the project
      const member = project.members.find(member => member.userId === userId);

      if (!member) {
        throw new Error('User is not a member of this project');
      }

      // Check if user is already in the session
      const existingParticipant = session.participants.find(p => p.userId === userId);

      if (existingParticipant) {
        throw new Error('User is already in this session');
      }

      // Add user to session
      session.participants.push({ userId, joinedAt: new Date().toISOString() });
      session.lastActivityAt = new Date().toISOString();

      // Add to collaboration history
      const historyEntry = {
        id: generateUuid(),
        type: 'session_joined',
        sessionId,
        projectId: session.projectId,
        resourceId: session.resourceId,
        userId,
        timestamp: new Date().toISOString(),
        details: { action: 'joined_session' }
      };

      this.collaborationHistory.set(historyEntry.id, historyEntry);

      logger.info(`User joined collaboration session`, { sessionId, userId });
      return { success: true, session };
    } catch (error) {
      logger.error('Error joining collaboration session:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record a change in a collaboration session
   * @param {string} sessionId - Session ID
   * @param {Object} changeData - Change data
   * @returns {Object} - Change result
   */
  recordChange(sessionId, changeData) {
    try {
      const { userId, type, content } = changeData;

      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!type) {
        throw new Error('Change type is required');
      }

      const session = this.activeSessions.get(sessionId);

      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      if (session.status !== 'active') {
        throw new Error(`Session is not active`);
      }

      // Check if user is a participant in the session
      const participant = session.participants.find(p => p.userId === userId);

      if (!participant) {
        throw new Error('User is not a participant in this session');
      }

      // Create change object
      const change = {
        id: generateUuid(),
        userId,
        type,
        content: content || {},
        timestamp: new Date().toISOString()
      };

      // Add change to session
      session.changes.push(change);
      session.lastActivityAt = new Date().toISOString();

      // Add to collaboration history
      const historyEntry = {
        id: generateUuid(),
        type: 'resource_changed',
        sessionId,
        projectId: session.projectId,
        resourceId: session.resourceId,
        userId,
        timestamp: new Date().toISOString(),
        details: { action: 'made_change', changeType: type }
      };

      this.collaborationHistory.set(historyEntry.id, historyEntry);

      logger.info(`Recorded change in collaboration session`, { sessionId, userId, type });
      return { success: true, change };
    } catch (error) {
      logger.error('Error recording change:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * End a collaboration session
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Object} - End result
   */
  endCollaborationSession(sessionId, userId) {
    try {
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      if (session.status !== 'active') {
        throw new Error(`Session is already ended`);
      }

      // Check if user is a participant in the session
      const participant = session.participants.find(p => p.userId === userId);

      if (!participant) {
        throw new Error('User is not a participant in this session');
      }

      // End session
      session.status = 'ended';
      session.endedAt = new Date().toISOString();
      session.endedBy = userId;

      // Add to collaboration history
      const historyEntry = {
        id: generateUuid(),
        type: 'session_ended',
        sessionId,
        projectId: session.projectId,
        resourceId: session.resourceId,
        userId,
        timestamp: new Date().toISOString(),
        details: { action: 'ended_session' }
      };

      this.collaborationHistory.set(historyEntry.id, historyEntry);

      logger.info(`Ended collaboration session`, { sessionId, userId });
      return { success: true, session };
    } catch (error) {
      logger.error('Error ending collaboration session:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get collaboration history
   * @param {Object} filters - Filters to apply
   * @returns {Object} - History result
   */
  getCollaborationHistory(filters = {}) {
    try {
      let historyItems = Array.from(this.collaborationHistory.values());
      
      // Apply filters
      if (filters.userId) {
        historyItems = historyItems.filter(item => item.userId === filters.userId);
      }
      
      if (filters.projectId) {
        historyItems = historyItems.filter(item => item.projectId === filters.projectId);
      }
      
      if (filters.resourceId) {
        historyItems = historyItems.filter(item => item.resourceId === filters.resourceId);
      }
      
      if (filters.type) {
        historyItems = historyItems.filter(item => item.type === filters.type);
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate).getTime();
        historyItems = historyItems.filter(item => new Date(item.timestamp).getTime() >= startDate);
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate).getTime();
        historyItems = historyItems.filter(item => new Date(item.timestamp).getTime() <= endDate);
      }
      
      // Sort by timestamp (newest first)
      historyItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;
      const paginatedItems = historyItems.slice(offset, offset + limit);
      
      return { 
        success: true, 
        history: paginatedItems,
        pagination: {
          total: historyItems.length,
          page,
          limit,
          pages: Math.ceil(historyItems.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting collaboration history:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = { teamCollaborationService: new TeamCollaborationService() };
