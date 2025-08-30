/**
 * Unit tests for the server entry point (server.js)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('Server', () => {
  let serverMock;
  let loggerMock;
  let configMock;
  let clusterManagerMock;
  let processMock;
  let server;
  
  beforeEach(() => {
    // Create mocks
    serverMock = {
      listen: sinon.stub().callsFake((port, callback) => {
        if (callback) callback();
        return serverMock;
      }),
      close: sinon.stub().callsFake((callback) => {
        if (callback) callback();
        return serverMock;
      })
    };
    
    loggerMock = {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
      debug: sinon.stub()
    };
    
    configMock = {
      port: 3000
    };
    
    clusterManagerMock = {
      initialize: sinon.stub().resolves()
    };
    
    // Mock process events
    processMock = {
      on: sinon.stub(),
      exit: sinon.stub()
    };
    
    // Reset all stubs
    sinon.reset();
  });
  
  describe('Server initialization', () => {
    beforeEach(() => {
      // Save original process
      const originalProcess = global.process;
      
      // Replace process with mock
      global.process = processMock;
      
      // Mock dependencies
      const mocks = {
        '@src/app': { server: serverMock },
        '@src/utils': { logger: loggerMock },
        '@src/config': configMock,
        '@src/scaling\\\\\\\\cluster': { clusterManager: clusterManagerMock }
      };
      
      // Load the module with mocked dependencies
      server = proxyquire('../../../src/server', mocks);
      
      // Restore original process
      global.process = originalProcess;
    });
    
    it('should initialize clustering', () => {
      expect(clusterManagerMock.initialize.called).to.be.true;
    });
    
    it('should handle cluster initialization errors', () => {
      // Get the error callback from initialize
      const errorCallback = clusterManagerMock.initialize.args[0][1];
      
      // Simulate an error
      const error = new Error('Test error');
      errorCallback(error);
      
      expect(loggerMock.error.called).to.be.true;
      expect(processMock.exit.called).to.be.true;
      expect(processMock.exit.args[0][0]).to.equal(1);
    });
  });
  
  describe('Server start function', () => {
    let startServer;
    
    beforeEach(() => {
      // Mock dependencies with direct access to startServer
      const mocks = {
        '@src/app': { server: serverMock },
        '@src/utils': { logger: loggerMock },
        '@src/config': configMock,
        '@src/scaling\\\\\\\\cluster': { clusterManager: clusterManagerMock }
      };
      
      // Extract the startServer function
      const moduleWithExports = `
        ${require('fs').readFileSync('src/server.js', 'utf8')}
        module.exports = { server, startServer };
      `;
      
      // Use a temporary file to load the modified module
      require('fs').writeFileSync('temp-server.js', moduleWithExports);
      const exported = proxyquire('../../../temp-server.js', mocks);
      startServer = exported.startServer;
      
      // Clean up temporary file
      require('fs').unlinkSync('temp-server.js');
    });
    
    it('should start the server on the specified port', async () => {
      await startServer();
      expect(serverMock.listen.called).to.be.true;
      expect(serverMock.listen.args[0][0]).to.equal(3000);
    });
    
    it('should log server startup information', async () => {
      await startServer();
      expect(loggerMock.info.called).to.be.true;
      expect(loggerMock.info.args.some(args => args[0].includes('Server running'))).to.be.true;
    });
  });
  
  describe('Error handling', () => {
    beforeEach(() => {
      // Save original process
      const originalProcess = global.process;
      
      // Replace process with mock
      global.process = processMock;
      
      // Mock dependencies
      const mocks = {
        '@src/app': { server: serverMock },
        '@src/utils': { logger: loggerMock },
        '@src/config': configMock,
        '@src/scaling\\\\\\\\cluster': { clusterManager: clusterManagerMock }
      };
      
      // Load the module with mocked dependencies
      server = proxyquire('../../../src/server', mocks);
      
      // Restore original process
      global.process = originalProcess;
    });
    
    it('should set up handlers for unhandled promise rejections', () => {
      expect(processMock.on.args.some(args => args[0] === 'unhandledRejection')).to.be.true;
    });
    
    it('should set up handlers for uncaught exceptions', () => {
      expect(processMock.on.args.some(args => args[0] === 'uncaughtException')).to.be.true;
    });
    
    it('should set up handlers for SIGTERM', () => {
      expect(processMock.on.args.some(args => args[0] === 'SIGTERM')).to.be.true;
    });
    
    it('should handle unhandled promise rejections gracefully', () => {
      // Get the rejection handler
      const rejectionHandler = processMock.on.args.find(args => args[0] === 'unhandledRejection')[1];
      
      // Simulate a rejection
      const error = new Error('Test error');
      rejectionHandler(error);
      
      expect(loggerMock.error.called).to.be.true;
      expect(serverMock.close.called).to.be.true;
    });
    
    it('should handle uncaught exceptions gracefully', () => {
      // Get the exception handler
      const exceptionHandler = processMock.on.args.find(args => args[0] === 'uncaughtException')[1];
      
      // Simulate an exception
      const error = new Error('Test error');
      exceptionHandler(error);
      
      expect(loggerMock.error.called).to.be.true;
      expect(serverMock.close.called).to.be.true;
    });
    
    it('should handle SIGTERM gracefully', () => {
      // Get the SIGTERM handler
      const sigtermHandler = processMock.on.args.find(args => args[0] === 'SIGTERM')[1];
      
      // Simulate a SIGTERM
      sigtermHandler();
      
      expect(loggerMock.info.called).to.be.true;
      expect(serverMock.close.called).to.be.true;
    });
  });
  
  describe('Module exports', () => {
    it('should export the server', () => {
      expect(server).to.exist;
    });
  });
});
