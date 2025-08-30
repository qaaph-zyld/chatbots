/**
 * Unit tests for the main application entry point (index.js)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('Index', () => {
  let expressMock;
  let appMock;
  let loggerMock;
  let chatbotServiceMock;
  let processMock;
  let index;
  
  beforeEach(() => {
    // Create mocks
    appMock = {
      use: sinon.stub(),
      get: sinon.stub(),
      listen: sinon.stub().callsFake((port, callback) => {
        if (callback) callback();
        return appMock;
      })
    };
    
    expressMock = sinon.stub().returns(appMock);
    expressMock.json = sinon.stub().returns(() => {});
    expressMock.urlencoded = sinon.stub().returns(() => {});
    expressMock.static = sinon.stub().returns(() => {});
    
    loggerMock = {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
      debug: sinon.stub()
    };
    
    chatbotServiceMock = {
      initialize: sinon.stub().resolves(true)
    };
    
    // Mock process events
    processMock = {
      env: {
        NODE_ENV: 'test',
        PORT: '3000'
      },
      on: sinon.stub(),
      exit: sinon.stub()
    };
    
    // Reset all stubs
    sinon.reset();
  });
  
  describe('Server initialization', () => {
    beforeEach(() => {
      // Mock dependencies
      const mocks = {
        'express': expressMock,
        'path': {
          join: sinon.stub().returns('/mocked/path')
        },
        'cors': sinon.stub().returns(() => {}),
        '@src/config': {},
        '@src/api\\routes': {},
        '@src/middleware': {},
        '@src/utils': { logger: loggerMock },
        '@src/services\\\\chatbot.service': { chatbotService: chatbotServiceMock },
        './middleware/request-logger': { requestLogger: () => {} },
        './middleware/api-key-auth': { apiKeyAuth: () => {} },
        './middleware/not-found': { notFoundMiddleware: () => {} },
        './middleware/error-handler': { errorMiddleware: () => {} },
        './routes/api': { apiRoutes: {} }
      };
      
      // Save original process
      const originalProcess = global.process;
      
      // Replace process with mock
      global.process = processMock;
      
      // Load the module with mocked dependencies
      index = proxyquire('../../../src/index', mocks);
      
      // Restore original process
      global.process = originalProcess;
    });
    
    it('should create an Express application', () => {
      expect(expressMock.called).to.be.true;
    });
    
    it('should apply middleware', () => {
      expect(appMock.use.called).to.be.true;
    });
    
    it('should set up API routes', () => {
      const apiRoutesCall = appMock.use.args.find(args => args[0] === '/api');
      expect(apiRoutesCall).to.exist;
    });
    
    it('should set up error handling middleware', () => {
      expect(appMock.use.callCount).to.be.at.least(3);
    });
  });
  
  describe('startServer function', () => {
    beforeEach(() => {
      // Mock dependencies with direct access to startServer
      const mocks = {
        'express': expressMock,
        'path': {
          join: sinon.stub().returns('/mocked/path')
        },
        'cors': sinon.stub().returns(() => {}),
        '@src/config': {},
        '@src/api\\routes': {},
        '@src/middleware': {},
        '@src/utils': { logger: loggerMock },
        '@src/services\\\\chatbot.service': { chatbotService: chatbotServiceMock },
        './middleware/request-logger': { requestLogger: () => {} },
        './middleware/api-key-auth': { apiKeyAuth: () => {} },
        './middleware/not-found': { notFoundMiddleware: () => {} },
        './middleware/error-handler': { errorMiddleware: () => {} },
        './routes/api': { apiRoutes: {} }
      };
      
      // Save original process
      const originalProcess = global.process;
      
      // Replace process with mock
      global.process = processMock;
      
      // Load the module with mocked dependencies and expose startServer
      const moduleWithExports = `
        ${require('fs').readFileSync('src/index.js', 'utf8')}
        module.exports = { app, startServer };
      `;
      
      // Use a temporary file to load the modified module
      require('fs').writeFileSync('temp-index.js', moduleWithExports);
      index = proxyquire('../../../temp-index.js', mocks);
      
      // Clean up temporary file
      require('fs').unlinkSync('temp-index.js');
      
      // Restore original process
      global.process = originalProcess;
    });
    
    it('should initialize the chatbot service', async () => {
      await index.startServer();
      expect(chatbotServiceMock.initialize.called).to.be.true;
    });
    
    it('should start the server on the specified port', async () => {
      await index.startServer();
      expect(appMock.listen.called).to.be.true;
      expect(appMock.listen.args[0][0]).to.equal('3000');
    });
    
    it('should log server startup information', async () => {
      await index.startServer();
      expect(loggerMock.info.called).to.be.true;
      expect(loggerMock.info.args.some(args => args[0].includes('Server running'))).to.be.true;
    });
    
    it('should exit process if chatbot service fails to initialize', async () => {
      chatbotServiceMock.initialize.resolves(false);
      await index.startServer();
      expect(processMock.exit.called).to.be.true;
      expect(processMock.exit.args[0][0]).to.equal(1);
    });
    
    it('should handle errors during startup', async () => {
      const error = new Error('Test error');
      chatbotServiceMock.initialize.rejects(error);
      await index.startServer();
      expect(loggerMock.error.called).to.be.true;
      expect(processMock.exit.called).to.be.true;
    });
  });
  
  describe('Error handling', () => {
    it('should set up handlers for uncaught exceptions', () => {
      expect(processMock.on.args.some(args => args[0] === 'uncaughtException')).to.be.true;
    });
    
    it('should set up handlers for unhandled promise rejections', () => {
      expect(processMock.on.args.some(args => args[0] === 'unhandledRejection')).to.be.true;
    });
  });
  
  describe('Module exports', () => {
    it('should export the app', () => {
      expect(index).to.exist;
    });
  });
});
