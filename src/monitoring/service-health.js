/**
 * Service Health Check Utility
 * 
 * This module provides functionality to monitor the health of various services
 * that the application depends on, such as databases, external APIs, and other microservices.
 */

const EventEmitter = require('events');
const axios = require('axios');
const { promisify } = require('util');
const dns = require('dns');
const net = require('net');

// Promisify DNS lookup
const dnsLookup = promisify(dns.lookup);

class ServiceHealth extends EventEmitter {
  /**
   * Create a new service health monitor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      checkInterval: options.checkInterval || 60000, // 60 seconds
      timeout: options.timeout || 5000, // 5 seconds
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000, // 1 second
      services: options.services || [],
      logger: options.logger || console,
      alertThreshold: options.alertThreshold || 2, // Number of consecutive failures before alerting
      recoveryThreshold: options.recoveryThreshold || 2, // Number of consecutive successes before recovery
      ...options
    };
    
    this.isRunning = false;
    this.checkIntervalId = null;
    this.serviceStates = new Map();
    this.history = new Map();
    this.historyLimit = options.historyLimit || 100;
    
    // Initialize service states
    this._initializeServices();
    
    // Bind methods
    this._checkServices = this._checkServices.bind(this);
    this._checkService = this._checkService.bind(this);
  }

  /**
   * Initialize service states
   * @private
   */
  _initializeServices() {
    for (const service of this.options.services) {
      this.serviceStates.set(service.id, {
        id: service.id,
        name: service.name,
        type: service.type,
        status: 'unknown',
        lastCheck: null,
        lastSuccess: null,
        lastFailure: null,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        responseTime: null,
        error: null,
        details: {}
      });
      
      this.history.set(service.id, []);
    }
  }

  /**
   * Add a service to monitor
   * @param {Object} service - Service configuration
   * @param {string} service.id - Unique service identifier
   * @param {string} service.name - Display name for the service
   * @param {string} service.type - Service type (http, tcp, mongo, redis, etc.)
   * @param {Object} service.config - Service-specific configuration
   * @returns {ServiceHealth} This instance for chaining
   */
  addService(service) {
    if (!service.id) {
      throw new Error('Service must have an id');
    }
    
    if (this.serviceStates.has(service.id)) {
      throw new Error(`Service with id ${service.id} already exists`);
    }
    
    this.options.services.push(service);
    
    this.serviceStates.set(service.id, {
      id: service.id,
      name: service.name || service.id,
      type: service.type,
      status: 'unknown',
      lastCheck: null,
      lastSuccess: null,
      lastFailure: null,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      responseTime: null,
      error: null,
      details: {}
    });
    
    this.history.set(service.id, []);
    
    return this;
  }

  /**
   * Remove a service from monitoring
   * @param {string} serviceId - Service identifier
   * @returns {boolean} Whether the service was removed
   */
  removeService(serviceId) {
    const serviceIndex = this.options.services.findIndex(s => s.id === serviceId);
    
    if (serviceIndex === -1) {
      return false;
    }
    
    this.options.services.splice(serviceIndex, 1);
    this.serviceStates.delete(serviceId);
    this.history.delete(serviceId);
    
    return true;
  }

  /**
   * Start health monitoring
   * @returns {ServiceHealth} This instance for chaining
   */
  start() {
    if (this.isRunning) {
      return this;
    }
    
    this.options.logger.info('Starting service health monitoring');
    
    this.isRunning = true;
    
    // Perform initial check
    this._checkServices();
    
    // Start periodic checks
    this.checkIntervalId = setInterval(
      this._checkServices,
      this.options.checkInterval
    );
    
    this.emit('started');
    
    return this;
  }

  /**
   * Stop health monitoring
   * @returns {ServiceHealth} This instance for chaining
   */
  stop() {
    if (!this.isRunning) {
      return this;
    }
    
    this.options.logger.info('Stopping service health monitoring');
    
    this.isRunning = false;
    
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    
    this.emit('stopped');
    
    return this;
  }

  /**
   * Get the current health status of all services
   * @returns {Object} Health status object
   */
  getStatus() {
    const services = {};
    let overallStatus = 'healthy';
    let degraded = false;
    
    for (const [id, state] of this.serviceStates.entries()) {
      services[id] = { ...state };
      
      if (state.status === 'down') {
        overallStatus = 'unhealthy';
      } else if (state.status === 'degraded') {
        degraded = true;
      }
    }
    
    if (overallStatus === 'healthy' && degraded) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services
    };
  }

  /**
   * Get the health status of a specific service
   * @param {string} serviceId - Service identifier
   * @returns {Object|null} Service health status or null if not found
   */
  getServiceStatus(serviceId) {
    const state = this.serviceStates.get(serviceId);
    
    if (!state) {
      return null;
    }
    
    return { ...state };
  }

  /**
   * Get the health history of a specific service
   * @param {string} serviceId - Service identifier
   * @param {number} limit - Maximum number of history entries to return
   * @returns {Array<Object>|null} Service health history or null if not found
   */
  getServiceHistory(serviceId, limit = 10) {
    const history = this.history.get(serviceId);
    
    if (!history) {
      return null;
    }
    
    return history.slice(-limit);
  }

  /**
   * Force an immediate health check of all services
   * @returns {Promise<Object>} Health check results
   */
  async checkNow() {
    return await this._checkServices();
  }

  /**
   * Force an immediate health check of a specific service
   * @param {string} serviceId - Service identifier
   * @returns {Promise<Object>} Health check result
   */
  async checkService(serviceId) {
    const service = this.options.services.find(s => s.id === serviceId);
    
    if (!service) {
      throw new Error(`Service with id ${serviceId} not found`);
    }
    
    return await this._checkService(service);
  }

  /**
   * Check the health of all services
   * @private
   * @returns {Promise<Object>} Health check results
   */
  async _checkServices() {
    const results = {};
    
    for (const service of this.options.services) {
      results[service.id] = await this._checkService(service);
    }
    
    const status = this.getStatus();
    this.emit('healthCheck', status);
    
    return status;
  }

  /**
   * Check the health of a specific service
   * @private
   * @param {Object} service - Service configuration
   * @returns {Promise<Object>} Health check result
   */
  async _checkService(service) {
    const startTime = Date.now();
    const state = this.serviceStates.get(service.id);
    
    let success = false;
    let error = null;
    let details = {};
    let responseTime = null;
    
    try {
      // Try the check with retries
      for (let attempt = 0; attempt < this.options.retries; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
          }
          
          details = await this._performServiceCheck(service);
          success = true;
          break;
        } catch (err) {
          error = err;
          
          if (attempt === this.options.retries - 1) {
            throw err;
          }
        }
      }
      
      responseTime = Date.now() - startTime;
      
      // Update service state for success
      state.lastCheck = new Date();
      state.responseTime = responseTime;
      state.details = details;
      
      if (success) {
        state.lastSuccess = new Date();
        state.consecutiveSuccesses++;
        state.consecutiveFailures = 0;
        state.error = null;
        
        // Check if service has recovered
        if (state.status === 'down' && state.consecutiveSuccesses >= this.options.recoveryThreshold) {
          state.status = 'healthy';
          this.emit('serviceRecovered', { service: service.id, name: service.name });
        } else if (state.status === 'unknown') {
          state.status = 'healthy';
        }
      }
    } catch (err) {
      responseTime = Date.now() - startTime;
      
      // Update service state for failure
      state.lastCheck = new Date();
      state.lastFailure = new Date();
      state.consecutiveFailures++;
      state.consecutiveSuccesses = 0;
      state.responseTime = responseTime;
      state.error = err.message;
      
      // Check if service is down
      if (state.consecutiveFailures >= this.options.alertThreshold) {
        if (state.status !== 'down') {
          state.status = 'down';
          this.emit('serviceDown', { 
            service: service.id, 
            name: service.name,
            error: err.message,
            consecutiveFailures: state.consecutiveFailures
          });
        }
      } else if (state.status === 'healthy') {
        state.status = 'degraded';
        this.emit('serviceDegraded', { 
          service: service.id, 
          name: service.name,
          error: err.message
        });
      } else if (state.status === 'unknown') {
        state.status = 'down';
      }
    }
    
    // Add to history
    const historyEntry = {
      timestamp: new Date(),
      status: state.status,
      responseTime,
      error: state.error
    };
    
    const history = this.history.get(service.id);
    history.push(historyEntry);
    
    // Trim history if needed
    if (history.length > this.historyLimit) {
      history.shift();
    }
    
    // Emit service check event
    this.emit('serviceCheck', {
      service: service.id,
      name: service.name,
      status: state.status,
      responseTime,
      error: state.error
    });
    
    return { ...state };
  }

  /**
   * Perform a health check for a specific service
   * @private
   * @param {Object} service - Service configuration
   * @returns {Promise<Object>} Health check details
   */
  async _performServiceCheck(service) {
    switch (service.type) {
      case 'http':
        return await this._checkHttpService(service);
      
      case 'tcp':
        return await this._checkTcpService(service);
      
      case 'mongo':
        return await this._checkMongoService(service);
      
      case 'redis':
        return await this._checkRedisService(service);
      
      case 'dns':
        return await this._checkDnsService(service);
      
      case 'custom':
        return await this._checkCustomService(service);
      
      default:
        throw new Error(`Unsupported service type: ${service.type}`);
    }
  }

  /**
   * Check an HTTP service
   * @private
   * @param {Object} service - Service configuration
   * @returns {Promise<Object>} Health check details
   */
  async _checkHttpService(service) {
    const config = service.config || {};
    const url = config.url || service.url;
    
    if (!url) {
      throw new Error('HTTP service check requires a URL');
    }
    
    const method = config.method || 'GET';
    const timeout = config.timeout || this.options.timeout;
    const expectedStatus = config.expectedStatus || 200;
    const validateResponse = config.validateResponse;
    
    const response = await axios({
      method,
      url,
      timeout,
      headers: config.headers || {},
      data: config.data,
      validateStatus: null // Don't throw on non-2xx responses
    });
    
    const details = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      size: response.data ? JSON.stringify(response.data).length : 0
    };
    
    // Check status code
    if (response.status !== expectedStatus) {
      throw new Error(`HTTP service returned status ${response.status}, expected ${expectedStatus}`);
    }
    
    // Validate response if a validator is provided
    if (typeof validateResponse === 'function') {
      const isValid = validateResponse(response);
      
      if (!isValid) {
        throw new Error('HTTP service response validation failed');
      }
    }
    
    return details;
  }

  /**
   * Check a TCP service
   * @private
   * @param {Object} service - Service configuration
   * @returns {Promise<Object>} Health check details
   */
  async _checkTcpService(service) {
    const config = service.config || {};
    const host = config.host || service.host;
    const port = config.port || service.port;
    
    if (!host || !port) {
      throw new Error('TCP service check requires host and port');
    }
    
    const timeout = config.timeout || this.options.timeout;
    
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let resolved = false;
      
      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        resolved = true;
        socket.end();
        resolve({ host, port, connected: true });
      });
      
      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          reject(new Error(`TCP connection to ${host}:${port} timed out after ${timeout}ms`));
        }
      });
      
      socket.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          reject(new Error(`TCP connection to ${host}:${port} failed: ${err.message}`));
        }
      });
      
      socket.connect(port, host);
    });
  }

  /**
   * Check a MongoDB service
   * @private
   * @param {Object} service - Service configuration
   * @returns {Promise<Object>} Health check details
   */
  async _checkMongoService(service) {
    const config = service.config || {};
    const client = config.client || service.client;
    
    if (!client) {
      throw new Error('MongoDB service check requires a client instance');
    }
    
    // Check if client is connected
    if (!client.isConnected()) {
      throw new Error('MongoDB client is not connected');
    }
    
    // Perform a ping command
    const adminDb = client.db().admin();
    const pingResult = await adminDb.ping();
    
    if (pingResult && pingResult.ok === 1) {
      // Get server status for more details
      const status = await adminDb.serverStatus();
      
      return {
        version: status.version,
        uptime: status.uptime,
        connections: status.connections,
        ok: pingResult.ok
      };
    } else {
      throw new Error('MongoDB ping failed');
    }
  }

  /**
   * Check a Redis service
   * @private
   * @param {Object} service - Service configuration
   * @returns {Promise<Object>} Health check details
   */
  async _checkRedisService(service) {
    const config = service.config || {};
    const client = config.client || service.client;
    
    if (!client) {
      throw new Error('Redis service check requires a client instance');
    }
    
    // Check connection status
    const isReady = client.status === 'ready';
    
    if (!isReady) {
      throw new Error(`Redis client status is ${client.status}, expected 'ready'`);
    }
    
    // Perform a ping command
    const pingResult = await client.ping();
    
    if (pingResult !== 'PONG') {
      throw new Error(`Redis ping failed: ${pingResult}`);
    }
    
    // Get server info for more details
    const info = await client.info();
    const infoLines = info.split('\r\n');
    const infoObj = {};
    
    infoLines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const parts = line.split(':');
        if (parts.length === 2) {
          infoObj[parts[0]] = parts[1];
        }
      }
    });
    
    return {
      version: infoObj.redis_version,
      uptime: infoObj.uptime_in_seconds,
      clients: infoObj.connected_clients,
      memory: infoObj.used_memory_human,
      ok: true
    };
  }

  /**
   * Check a DNS service
   * @private
   * @param {Object} service - Service configuration
   * @returns {Promise<Object>} Health check details
   */
  async _checkDnsService(service) {
    const config = service.config || {};
    const hostname = config.hostname || service.hostname;
    
    if (!hostname) {
      throw new Error('DNS service check requires a hostname');
    }
    
    try {
      const result = await dnsLookup(hostname);
      
      return {
        hostname,
        address: result.address,
        family: `IPv${result.family}`,
        ok: true
      };
    } catch (err) {
      throw new Error(`DNS lookup for ${hostname} failed: ${err.message}`);
    }
  }

  /**
   * Check a custom service using a provided function
   * @private
   * @param {Object} service - Service configuration
   * @returns {Promise<Object>} Health check details
   */
  async _checkCustomService(service) {
    const config = service.config || {};
    const checkFn = config.checkFn || service.checkFn;
    
    if (typeof checkFn !== 'function') {
      throw new Error('Custom service check requires a checkFn function');
    }
    
    try {
      return await checkFn(service);
    } catch (err) {
      throw new Error(`Custom service check failed: ${err.message}`);
    }
  }
}

module.exports = ServiceHealth;
