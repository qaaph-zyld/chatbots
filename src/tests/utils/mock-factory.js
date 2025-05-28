/**
 * Mock Factory
 * 
 * Factory for creating mock objects for testing
 */

const sinon = require('sinon');
const { mockDeep } = require('jest-mock-extended');

/**
 * Create a mock logger
 * @returns {Object} - Mock logger
 */
const createMockLogger = () => {
  return {
    info: sinon.spy(),
    warn: sinon.spy(),
    error: sinon.spy(),
    debug: sinon.spy()
  };
};

/**
 * Create a mock response object
 * @returns {Object} - Mock response
 */
const createMockResponse = () => {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  res.send = sinon.stub().returns(res);
  res.end = sinon.stub().returns(res);
  res.setHeader = sinon.stub().returns(res);
  return res;
};

/**
 * Create a mock request object
 * @param {Object} options - Request options
 * @returns {Object} - Mock request
 */
const createMockRequest = (options = {}) => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user || null,
    method: options.method || 'GET',
    path: options.path || '/',
    ...options
  };
};

/**
 * Create a mock service
 * @param {string} serviceName - Service name
 * @param {Array<string>} methods - Method names
 * @returns {Object} - Mock service
 */
const createMockService = (serviceName, methods = []) => {
  const mockService = {};
  
  methods.forEach(method => {
    mockService[method] = sinon.stub();
  });
  
  return mockService;
};

/**
 * Create a mock model
 * @param {string} modelName - Model name
 * @param {Array<Object>} data - Mock data
 * @returns {Object} - Mock model
 */
const createMockModel = (modelName, data = []) => {
  const mockModel = function(doc) {
    this._doc = { ...doc };
    this.save = sinon.stub().resolves(this._doc);
  };
  
  mockModel.find = sinon.stub().resolves(data);
  mockModel.findById = sinon.stub().callsFake(id => {
    const doc = data.find(item => item._id.toString() === id.toString());
    return Promise.resolve(doc);
  });
  mockModel.findOne = sinon.stub().callsFake(filter => {
    const doc = data.find(item => {
      for (const key in filter) {
        if (item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
    return Promise.resolve(doc);
  });
  mockModel.create = sinon.stub().callsFake(doc => {
    const newDoc = { ...doc, _id: `mock_id_${Date.now()}` };
    data.push(newDoc);
    return Promise.resolve(newDoc);
  });
  mockModel.updateOne = sinon.stub().resolves({ nModified: 1 });
  mockModel.deleteOne = sinon.stub().resolves({ deletedCount: 1 });
  
  return mockModel;
};

/**
 * Create a deep mock of a service or model
 * @param {string} name - Name of the service or model
 * @returns {Object} - Deep mock
 */
const createDeepMock = (name) => {
  return mockDeep();
};

module.exports = {
  createMockLogger,
  createMockResponse,
  createMockRequest,
  createMockService,
  createMockModel,
  createDeepMock
};
