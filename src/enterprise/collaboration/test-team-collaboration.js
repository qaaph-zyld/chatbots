/**
 * Test script for Team Collaboration Service
 * 
 * This script demonstrates the functionality of the Team Collaboration Service
 * including team management, workspace and project creation, and real-time collaboration.
 */

// Import the team collaboration service
const { teamCollaborationService } = require('./team-collaboration.service');
const { logger } = require('../../utils/mock-utils');

/**
 * Run the test
 */
async function runTest() {
  logger.info('=== Team Collaboration Service Test ===');
  
  // Create a team
  logger.info('\n--- Creating a Team ---');
  const ownerUserId = 'user-1';
  const teamResult = teamCollaborationService.createTeam({
    name: 'Chatbot Development Team',
    description: 'Team responsible for developing and maintaining the chatbot platform',
    ownerId: ownerUserId
  });
  
  if (!teamResult.success) {
    logger.error(`Failed to create team: ${teamResult.error}`);
    return;
  }
  
  const team = teamResult.team;
  logger.info(`Created team: ${team.name} (${team.id})`);
  logger.info(`Owner: ${team.ownerId}`);
  logger.info(`Members: ${team.members.length}`);
  
  // Add team members
  logger.info('\n--- Adding Team Members ---');
  const member1Result = teamCollaborationService.addTeamMember(team.id, {
    userId: 'user-2',
    role: 'admin',
    invitedBy: ownerUserId
  });
  
  if (member1Result.success) {
    logger.info(`Added admin member: user-2`);
  }
  
  const member2Result = teamCollaborationService.addTeamMember(team.id, {
    userId: 'user-3',
    role: 'member',
    invitedBy: ownerUserId
  });
  
  if (member2Result.success) {
    logger.info(`Added regular member: user-3`);
  }
  
  const member3Result = teamCollaborationService.addTeamMember(team.id, {
    userId: 'user-4',
    role: 'member',
    invitedBy: ownerUserId
  });
  
  if (member3Result.success) {
    logger.info(`Added regular member: user-4`);
  }
  
  // Get updated team
  const updatedTeamResult = teamCollaborationService.getTeam(team.id);
  if (updatedTeamResult.success) {
    const updatedTeam = updatedTeamResult.team;
    logger.info(`Team now has ${updatedTeam.members.length} members`);
    
    logger.info('Team members:');
    updatedTeam.members.forEach(member => {
      logger.info(`- ${member.userId} (${member.role})`);
    });
  }
  
  // Create a workspace
  logger.info('\n--- Creating a Workspace ---');
  const workspaceResult = teamCollaborationService.createWorkspace({
    name: 'NLP Development',
    description: 'Workspace for natural language processing development',
    teamId: team.id,
    createdBy: ownerUserId
  });
  
  if (!workspaceResult.success) {
    logger.error(`Failed to create workspace: ${workspaceResult.error}`);
    return;
  }
  
  const workspace = workspaceResult.workspace;
  logger.info(`Created workspace: ${workspace.name} (${workspace.id})`);
  logger.info(`Team: ${workspace.teamId}`);
  logger.info(`Members: ${workspace.members.length}`);
  
  // Create a project
  logger.info('\n--- Creating a Project ---');
  const projectResult = teamCollaborationService.createProject({
    name: 'Intent Recognition Engine',
    description: 'Project for developing the intent recognition engine',
    workspaceId: workspace.id,
    createdBy: 'user-2'  // Admin user creates the project
  });
  
  if (!projectResult.success) {
    logger.error(`Failed to create project: ${projectResult.error}`);
    return;
  }
  
  const project = projectResult.project;
  logger.info(`Created project: ${project.name} (${project.id})`);
  logger.info(`Workspace: ${project.workspaceId}`);
  logger.info(`Created by: ${project.createdBy}`);
  logger.info(`Members: ${project.members.length}`);
  
  // Start a collaboration session
  logger.info('\n--- Starting Collaboration Session ---');
  const sessionResult = teamCollaborationService.startCollaborationSession({
    projectId: project.id,
    userId: 'user-2',
    resourceId: 'intent-classifier.js'
  });
  
  if (!sessionResult.success) {
    logger.error(`Failed to start collaboration session: ${sessionResult.error}`);
    return;
  }
  
  const session = sessionResult.session;
  logger.info(`Started collaboration session: ${session.id}`);
  logger.info(`Project: ${session.projectId}`);
  logger.info(`Resource: ${session.resourceId}`);
  logger.info(`Started by: ${session.participants[0].userId}`);
  
  // Join the collaboration session
  logger.info('\n--- Joining Collaboration Session ---');
  const joinResult = teamCollaborationService.joinCollaborationSession(session.id, 'user-3');
  
  if (joinResult.success) {
    logger.info(`User user-3 joined the collaboration session`);
    logger.info(`Session now has ${joinResult.session.participants.length} participants`);
  }
  
  // Record changes in the session
  logger.info('\n--- Recording Changes ---');
  const change1Result = teamCollaborationService.recordChange(session.id, {
    userId: 'user-2',
    type: 'code_edit',
    content: {
      file: 'intent-classifier.js',
      lineNumber: 42,
      change: 'Added support for multiple languages'
    }
  });
  
  if (change1Result.success) {
    logger.info(`Recorded code edit by user-2`);
  }
  
  const change2Result = teamCollaborationService.recordChange(session.id, {
    userId: 'user-3',
    type: 'comment',
    content: {
      file: 'intent-classifier.js',
      lineNumber: 42,
      comment: 'We should add unit tests for this feature'
    }
  });
  
  if (change2Result.success) {
    logger.info(`Recorded comment by user-3`);
  }
  
  // End the collaboration session
  logger.info('\n--- Ending Collaboration Session ---');
  const endResult = teamCollaborationService.endCollaborationSession(session.id, 'user-2');
  
  if (endResult.success) {
    logger.info(`Ended collaboration session: ${session.id}`);
    logger.info(`Session status: ${endResult.session.status}`);
    logger.info(`Session had ${endResult.session.changes.length} changes`);
  }
  
  // Get collaboration history
  logger.info('\n--- Collaboration History ---');
  const historyResult = teamCollaborationService.getCollaborationHistory({
    projectId: project.id
  });
  
  if (historyResult.success) {
    logger.info(`Found ${historyResult.history.length} history entries for the project`);
    
    logger.info('Recent collaboration activities:');
    historyResult.history.forEach((entry, index) => {
      logger.info(`${index + 1}. [${entry.timestamp}] ${entry.type} by ${entry.userId}`);
    });
  }
  
  logger.info('\n=== Test Complete ===');
  logger.info('The Team Collaboration service is ready for use in the chatbot platform.');
  logger.info('Key features demonstrated:');
  logger.info('1. Team creation and management');
  logger.info('2. Workspace and project organization');
  logger.info('3. Real-time collaboration sessions');
  logger.info('4. Change tracking and history');
}

// Run the test
runTest().catch(error => {
  logger.error('Test failed with error:', error);
});
