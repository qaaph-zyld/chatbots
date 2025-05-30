/**
 * Workflow Service Unit Tests
 */

const mongoose = require('mongoose');
const sinon = require('sinon');
const { mockDeep } = require('jest-mock-extended');

// Import the service to test
const workflowService = require('../../../services/workflow.service');

// Import models and dependencies
const Workflow = require('../../../models/workflow.model');
const WorkflowExecution = require('../../../models/workflow-execution.model');
const { logger } = require('../../../utils');

// Import test utilities
const { createMockModel } = require('../../utils/mock-factory');

// Mock dependencies
jest.mock('../../../models/workflow.model');
jest.mock('../../../models/workflow-execution.model');
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Workflow Service', () => {
  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  // Test creating a workflow
  describe('createWorkflow', () => {
    it('should create a workflow successfully', async () => {
      // Arrange
      const userId = 'user123';
      const workflowData = {
        chatbotId: new mongoose.Types.ObjectId(),
        name: 'Test Workflow',
        description: 'A test workflow',
        nodes: [
          {
            id: 'start',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {}
          },
          {
            id: 'message',
            type: 'message',
            position: { x: 300, y: 100 },
            data: {
              message: 'Hello, world!'
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'start',
            target: 'message'
          }
        ],
        isActive: true
      };
      
      const savedWorkflow = {
        ...workflowData,
        _id: new mongoose.Types.ObjectId(),
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Workflow.prototype.save = jest.fn().mockResolvedValue(savedWorkflow);
      
      // Mock the save function to return the savedWorkflow
      Workflow.prototype.save.mockImplementation(function() {
        // Copy properties from this to savedWorkflow
        Object.assign(savedWorkflow, this);
        return Promise.resolve(savedWorkflow);
      });
      
      // Act
      const result = await workflowService.createWorkflow(workflowData, userId);
      
      // Assert
      expect(Workflow.prototype.save).toHaveBeenCalled();
      expect(result).toEqual(savedWorkflow);
      expect(logger.info).toHaveBeenCalledWith(`Workflow created: ${savedWorkflow._id}`);
    });
    
    it('should throw error if workflow has no start node', async () => {
      // Arrange
      const userId = 'user123';
      const workflowData = {
        chatbotId: new mongoose.Types.ObjectId(),
        name: 'Invalid Workflow',
        description: 'A workflow without start node',
        nodes: [
          {
            id: 'message',
            type: 'message',
            position: { x: 300, y: 100 },
            data: {
              message: 'Hello, world!'
            }
          }
        ],
        edges: [],
        isActive: true
      };
      
      // Act & Assert
      await expect(workflowService.createWorkflow(workflowData, userId))
        .rejects
        .toThrow('Workflow must have a start node');
    });
  });
  
  // Test getting workflow by ID
  describe('getWorkflowById', () => {
    it('should get a workflow by ID', async () => {
      // Arrange
      const workflowId = new mongoose.Types.ObjectId();
      const chatbotId = new mongoose.Types.ObjectId();
      
      const mockWorkflow = {
        _id: workflowId,
        chatbotId,
        name: 'Test Workflow',
        description: 'A test workflow',
        nodes: [],
        edges: [],
        isActive: true,
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Workflow.findOne = jest.fn().mockResolvedValue(mockWorkflow);
      
      // Act
      const result = await workflowService.getWorkflowById(workflowId, chatbotId);
      
      // Assert
      expect(Workflow.findOne).toHaveBeenCalledWith({ _id: workflowId, chatbotId });
      expect(result).toEqual(mockWorkflow);
    });
    
    it('should return null when workflow not found', async () => {
      // Arrange
      const workflowId = new mongoose.Types.ObjectId();
      const chatbotId = new mongoose.Types.ObjectId();
      
      Workflow.findOne = jest.fn().mockResolvedValue(null);
      
      // Act
      const result = await workflowService.getWorkflowById(workflowId, chatbotId);
      
      // Assert
      expect(Workflow.findOne).toHaveBeenCalledWith({ _id: workflowId, chatbotId });
      expect(result).toBeNull();
    });
  });
  
  // Test starting workflow execution
  describe('startWorkflowExecution', () => {
    it('should start workflow execution successfully', async () => {
      // Arrange
      const workflowId = new mongoose.Types.ObjectId();
      const chatbotId = new mongoose.Types.ObjectId();
      const userId = 'user123';
      const conversationId = new mongoose.Types.ObjectId();
      
      const mockWorkflow = {
        _id: workflowId,
        chatbotId,
        name: 'Test Workflow',
        description: 'A test workflow',
        nodes: [
          {
            id: 'start',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {}
          },
          {
            id: 'message',
            type: 'message',
            position: { x: 300, y: 100 },
            data: {
              message: 'Hello, world!'
            }
          }
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'start',
            target: 'message'
          }
        ],
        isActive: true
      };
      
      const mockExecution = {
        _id: new mongoose.Types.ObjectId(),
        workflowId,
        chatbotId,
        userId,
        conversationId,
        currentNodeId: 'start',
        status: 'running',
        data: {},
        startedAt: new Date(),
        save: jest.fn()
      };
      
      Workflow.findOne = jest.fn().mockResolvedValue(mockWorkflow);
      WorkflowExecution.prototype.save = jest.fn().mockResolvedValue(mockExecution);
      
      // Mock the processNode method
      const originalProcessNode = workflowService.processNode;
      workflowService.processNode = jest.fn().mockResolvedValue({
        nextNodeId: 'message',
        output: {}
      });
      
      // Act
      const result = await workflowService.startWorkflowExecution(workflowId, chatbotId, userId, conversationId);
      
      // Assert
      expect(Workflow.findOne).toHaveBeenCalledWith({ _id: workflowId, chatbotId, isActive: true });
      expect(WorkflowExecution.prototype.save).toHaveBeenCalled();
      expect(workflowService.processNode).toHaveBeenCalledWith(mockExecution, 'start', mockWorkflow);
      expect(result).toEqual(mockExecution);
      
      // Restore the original method
      workflowService.processNode = originalProcessNode;
    });
    
    it('should throw error if workflow not found', async () => {
      // Arrange
      const workflowId = new mongoose.Types.ObjectId();
      const chatbotId = new mongoose.Types.ObjectId();
      const userId = 'user123';
      const conversationId = new mongoose.Types.ObjectId();
      
      Workflow.findOne = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(workflowService.startWorkflowExecution(workflowId, chatbotId, userId, conversationId))
        .rejects
        .toThrow('Workflow not found or not active');
    });
  });
  
  // Test getting workflow executions
  describe('getWorkflowExecutions', () => {
    it('should get all executions for a workflow', async () => {
      // Arrange
      const workflowId = new mongoose.Types.ObjectId();
      const chatbotId = new mongoose.Types.ObjectId();
      
      const mockExecutions = [
        {
          _id: new mongoose.Types.ObjectId(),
          workflowId,
          chatbotId,
          userId: 'user123',
          conversationId: new mongoose.Types.ObjectId(),
          status: 'completed',
          startedAt: new Date(Date.now() - 3600000),
          completedAt: new Date()
        },
        {
          _id: new mongoose.Types.ObjectId(),
          workflowId,
          chatbotId,
          userId: 'user456',
          conversationId: new mongoose.Types.ObjectId(),
          status: 'running',
          startedAt: new Date()
        }
      ];
      
      WorkflowExecution.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockExecutions)
        })
      });
      
      // Act
      const result = await workflowService.getWorkflowExecutions(workflowId, chatbotId);
      
      // Assert
      expect(WorkflowExecution.find).toHaveBeenCalledWith({ workflowId, chatbotId });
      expect(result).toEqual(mockExecutions);
    });
  });
});
