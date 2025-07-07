/**
 * Unit tests for the main application (app.js)
 */

const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Mock dependencies
const expressMock = {
  json: sinon.stub().returns((req, res, next) => next()),
  urlencoded: sinon.stub().returns((req, res, next) => next()),
  static: sinon.stub().returns((req, res, next) => next())
};

const expressAppMock = {
  use: sinon.stub(),
  get: sinon.stub(),
  post: sinon.stub(),
  put: sinon.stub(),
  delete: sinon.stub(),
  listen: sinon.stub()
};

const expressMockFactory = sinon.stub().returns(expressAppMock);
expressMockFactory.json = expressMock.json;
expressMockFactory.urlencoded = expressMock.urlencoded;
expressMockFactory.static = expressMock.static;

const httpMock = {
  createServer: sinon.stub().returns({
    listen: sinon.stub().callsFake((port, callback) => {
      if (callback) callback();
      return this;
    })
  })
};

const loggerMock = {
  info: sinon.stub(),
  error: sinon.stub(),
  warn: sinon.stub(),
  debug: sinon.stub()
};

const dbConnectionMock = {
  connectDB: sinon.stub().resolves()
};

const configMock = {
  port: 3000,
  useRedisRateLimit: false,
  services: {
    paymentGateway: { url: 'http://mock-payment.test' },
    emailService: { url: 'http://mock-email.test' }
  }
};

const apiRoutesMock = sinon.stub();
const swaggerRoutesMock = sinon.stub();
const trainingRoutesMock = { trainingRoutes: sinon.stub() };
const chatbotServiceMock = {
  initialize: sinon.stub().resolves()
};

const pluginLoaderMock = {
  loadAllPlugins: sinon.stub().resolves(),
  initializePlugins: sinon.stub().resolves()
};

const integrationManagerMock = {
  initialize: sinon.stub().resolves()
};

const usageMonitoringServiceMock = {
  initialize: sinon.stub().resolves()
};

const scalingServiceMock = {
  initialize: sinon.stub().resolves()
};

const scalingMiddlewareMock = {
  trackRequest: sinon.stub()
};

const rateLimitMock = {
  applyRateLimiting: sinon.stub()
};

const monitoringServiceMock = {
  initialize: sinon.stub().resolves()
};

const alertServiceMock = {
  initialize: sinon.stub().resolves()
};

const healthCheckServiceMock = {
  initialize: sinon.stub().resolves()
};

const paymentRetrySchedulerMock = {
  initScheduler: sinon.stub()
};

const trainingServiceMock = {
  setBotService: sinon.stub()
};

describe('App', () => {
  let app;
  let server;
  let initializeApp;
  
  beforeEach(() => {
    // Reset all stubs
    sinon.reset();
    
    // Mock require statements
    const appModule = proxyquire('../../../src/app', {
      'express': expressMockFactory,
      'http': httpMock,
      '@data/connection': dbConnectionMock,
      '@api/routes': apiRoutesMock,
      '@api/swagger': swaggerRoutesMock,
      '@modules/training': trainingRoutesMock,
      '@modules/bot/core': chatbotServiceMock,
      '@utils': { logger: loggerMock },
      '@utils/pluginLoader': { pluginLoader: pluginLoaderMock },
      '@modules/integrations/integration.manager': integrationManagerMock,
      '@modules/monitoring/usage.service': usageMonitoringServiceMock,
      '@modules/scaling/scaling.service': scalingServiceMock,
      '@modules/scaling/scaling.middleware': scalingMiddlewareMock,
      '@core/config': configMock,
      '@middleware/rate-limit': rateLimitMock,
      './billing/jobs/payment-retry-scheduler': paymentRetrySchedulerMock,
      './services/monitoring.service': monitoringServiceMock,
      './services/alert.service': alertServiceMock,
      './services/health-check.service': healthCheckServiceMock,
      '@src/training': trainingServiceMock
    });
    
    app = appModule.app;
    server = appModule.server;
    initializeApp = appModule.initializeApp;
  });
  
  describe('Express app initialization', () => {
    it('should create an Express application', () => {
      expect(expressMockFactory.called).to.be.true;
    });
    
    it('should apply middleware', () => {
      expect(expressAppMock.use.called).to.be.true;
    });
    
    it('should apply JSON body parser', () => {
      expect(expressMock.json.called).to.be.true;
    });
    
    it('should apply URL-encoded body parser', () => {
      expect(expressMock.urlencoded.called).to.be.true;
    });
    
    it('should apply rate limiting', () => {
      expect(rateLimitMock.applyRateLimiting.called).to.be.true;
    });
    
    it('should register API routes', () => {
      const apiRoutesCall = expressAppMock.use.args.find(args => args[0] === '/api');
      expect(apiRoutesCall).to.exist;
    });
    
    it('should register training routes', () => {
      const trainingRoutesCall = expressAppMock.use.args.find(args => args[0] === '/api/training');
      expect(trainingRoutesCall).to.exist;
    });
  });
  
  describe('initializeApp function', () => {
    it('should connect to the database', async () => {
      await initializeApp();
      expect(dbConnectionMock.connectDB.called).to.be.true;
    });
    
    it('should initialize the payment retry scheduler', async () => {
      await initializeApp();
      expect(paymentRetrySchedulerMock.initScheduler.called).to.be.true;
    });
    
    it('should load and initialize plugins', async () => {
      await initializeApp();
      expect(pluginLoaderMock.loadAllPlugins.called).to.be.true;
      expect(pluginLoaderMock.initializePlugins.called).to.be.true;
    });
    
    it('should initialize the chatbot service', async () => {
      await initializeApp();
      expect(chatbotServiceMock.initialize.called).to.be.true;
    });
    
    it('should initialize the integration manager', async () => {
      await initializeApp();
      expect(integrationManagerMock.initialize.called).to.be.true;
    });
    
    it('should initialize the usage monitoring service', async () => {
      await initializeApp();
      expect(usageMonitoringServiceMock.initialize.called).to.be.true;
    });
    
    it('should initialize the scaling service', async () => {
      await initializeApp();
      expect(scalingServiceMock.initialize.called).to.be.true;
    });
    
    it('should initialize the monitoring service', async () => {
      await initializeApp();
      expect(monitoringServiceMock.initialize.called).to.be.true;
    });
    
    it('should initialize the alert service', async () => {
      await initializeApp();
      expect(alertServiceMock.initialize.called).to.be.true;
    });
    
    it('should initialize the health check service', async () => {
      await initializeApp();
      expect(healthCheckServiceMock.initialize.called).to.be.true;
    });
    
    it('should handle initialization errors gracefully', async () => {
      const error = new Error('Test error');
      dbConnectionMock.connectDB.rejects(error);
      
      await initializeApp();
      
      expect(loggerMock.error.called).to.be.true;
    });
  });
  
  describe('Module exports', () => {
    it('should export the app and server', () => {
      expect(app).to.exist;
      expect(server).to.exist;
    });
  });
});
