/**
 * Unit tests for chatbot routes
 */

const sinon = require('sinon');
const httpMocks = require('node-mocks-http');

describe('Chatbot Routes', () => {
  let router;
  let chatbotControllerMock;
  let checkRoleMock;
  let routerStub;
  
  beforeEach(() => {
    // Create mock for chatbot controller
    chatbotControllerMock = {
      getAllChatbots: sinon.stub(),
      getChatbotById: sinon.stub(),
      createChatbot: sinon.stub(),
      updateChatbot: sinon.stub(),
      deleteChatbot: sinon.stub(),
      processMessage: sinon.stub(),
      getConversationHistory: sinon.stub()
    };
    
    // Create mock for checkRole middleware
    checkRoleMock = sinon.stub().returns((req, res, next) => next());
    
    // Mock express router
    routerStub = {
      get: sinon.stub(),
      post: sinon.stub(),
      put: sinon.stub(),
      delete: sinon.stub()
    };
    
    // Setup the router with mocked routes
    routerStub.get.withArgs('/').returns(routerStub);
    routerStub.get.withArgs('/:id').returns(routerStub);
    routerStub.get.withArgs('/:id/conversations').returns(routerStub);
    routerStub.post.withArgs('/').returns(routerStub);
    routerStub.post.withArgs('/:id/message').returns(routerStub);
    routerStub.put.withArgs('/:id').returns(routerStub);
    routerStub.delete.withArgs('/:id').returns(routerStub);
    
    // Mock the route setup
    routerStub.get.callsFake((path, handler) => {
      if (path === '/') {
        routerStub.getAllChatbotsHandler = handler;
      } else if (path === '/:id') {
        routerStub.getChatbotByIdHandler = handler;
      } else if (path === '/:id/conversations') {
        routerStub.getConversationHistoryHandler = handler;
      }
      return routerStub;
    });
    
    routerStub.post.callsFake((path, middleware, handler) => {
      if (path === '/') {
        routerStub.createChatbotMiddleware = middleware;
        routerStub.createChatbotHandler = handler;
      } else if (path === '/:id/message') {
        routerStub.processMessageHandler = handler;
      }
      return routerStub;
    });
    
    routerStub.put.callsFake((path, middleware, handler) => {
      if (path === '/:id') {
        routerStub.updateChatbotMiddleware = middleware;
        routerStub.updateChatbotHandler = handler;
      }
      return routerStub;
    });
    
    routerStub.delete.callsFake((path, middleware, handler) => {
      if (path === '/:id') {
        routerStub.deleteChatbotMiddleware = middleware;
        routerStub.deleteChatbotHandler = handler;
      }
      return routerStub;
    });
    
    // Mock the express module
    const expressMock = {
      Router: jest.fn().mockReturnValue(routerStub)
    };
    
    // Mock the controller and middleware modules
    jest.mock('../../../../src/api/controllers/chatbot.controller', () => ({
      chatbotController: chatbotControllerMock
    }));
    
    jest.mock('../../../../src/middleware', () => ({
      checkRole: checkRoleMock
    }));
    
    // Load the routes module
    router = require('../../../../src/api/routes/chatbot.routes');
  });
  
  describe('Route configuration', () => {
    it('should define GET / route for getting all chatbots', () => {
      expect(routerStub.get).toHaveBeenCalledWith('/', expect.any(Function));
    });
    
    it('should define GET /:id route for getting a chatbot by ID', () => {
      expect(routerStub.get).toHaveBeenCalledWith('/:id', expect.any(Function));
    });
    
    it('should define POST / route for creating a chatbot with admin role check', () => {
      expect(routerStub.post).toHaveBeenCalledWith('/', expect.any(Function), expect.any(Function));
      expect(checkRoleMock).toHaveBeenCalledWith('admin');
    });
    
    it('should define PUT /:id route for updating a chatbot with admin role check', () => {
      expect(routerStub.put).toHaveBeenCalledWith('/:id', expect.any(Function), expect.any(Function));
      expect(checkRoleMock).toHaveBeenCalledWith('admin');
    });
    
    it('should define DELETE /:id route for deleting a chatbot with admin role check', () => {
      expect(routerStub.delete).toHaveBeenCalledWith('/:id', expect.any(Function), expect.any(Function));
      expect(checkRoleMock).toHaveBeenCalledWith('admin');
    });
    
    it('should define POST /:id/message route for processing messages', () => {
      expect(routerStub.post).toHaveBeenCalledWith('/:id/message', expect.any(Function));
    });
    
    it('should define GET /:id/conversations route for getting conversation history', () => {
      expect(routerStub.get).toHaveBeenCalledWith('/:id/conversations', expect.any(Function));
    });
    
    afterEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });
  });
});
