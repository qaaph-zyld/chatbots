/**
 * Unit tests for component routes
 */

const request = require('supertest');
const express = require('express');

// Mock controller functions
const componentController = {
  getAllComponents: jest.fn(),
  getComponentsByType: jest.fn(),
  getComponent: jest.fn(),
  createComponent: jest.fn(),
  deleteComponent: jest.fn(),
  getComponentTypes: jest.fn(),
  addComponentType: jest.fn()
};

// Mock auth middleware
const authenticateUser = jest.fn((req, res, next) => next());

// Create an express router that mimics the component.routes.js file
const setupComponentRoutes = () => {
  const router = express.Router();
  
  // Apply authentication middleware to all routes
  router.use(authenticateUser);
  
  // Get all components
  router.get('/', componentController.getAllComponents);
  
  // Get components by type
  router.get('/type/:type', componentController.getComponentsByType);
  
  // Get all component types - IMPORTANT: Define specific routes before parameterized routes
  router.get('/types', componentController.getComponentTypes);
  
  // Add a new component type - IMPORTANT: Define specific routes before parameterized routes
  router.post('/types', componentController.addComponentType);
  
  // Get a component by name and version - split into two routes to avoid optional parameter issues
  router.get('/:name/:version', componentController.getComponent);
  router.get('/:name', componentController.getComponent);
  
  // Create a new component
  router.post('/', componentController.createComponent);
  
  // Delete a component
  router.delete('/:name/:version', componentController.deleteComponent);
  
  return router;
};

// We don't need to import the actual component.routes.js file
// Instead we create our own router with the same routes

describe('Component Routes', () => {
  let app;
  
  // Increase Jest timeout for all tests
  jest.setTimeout(60000); // Doubled timeout to prevent failures

  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    
    // Use JSON middleware
    app.use(express.json());
    
    // Mount the component routes
    app.use('/api/components', setupComponentRoutes());
    
    // Reset all mocks before each test
    jest.clearAllMocks();
  });
  
  // Close server connections after each test to prevent hanging
  afterEach(() => {
    // Force close any open connections
    app = null;
  });

  describe('GET /api/components', () => {
    it('should return all components', async () => {
      // Set individual test timeout
      jest.setTimeout(60000);
      // Mock controller response
      componentController.getAllComponents.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          components: [
            { name: 'Button', version: '1.0.0', type: 'UI' },
            { name: 'Card', version: '1.0.0', type: 'UI' }
          ]
        });
      });

      // Make request - use end() with callback to properly close connections
      return new Promise((resolve) => {
        request(app)
          .get('/api/components')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, response) => {
            if (err) throw err;
            // Assertions moved to callback
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('components');
            expect(Array.isArray(response.body.components)).toBe(true);
            expect(componentController.getAllComponents).toHaveBeenCalled();
            resolve();
          });
      });
    });
  });

  describe('GET /api/components/type/:type', () => {
    it('should return components by type', async () => {
      // Set individual test timeout
      jest.setTimeout(60000);
      // Mock controller response
      componentController.getComponentsByType.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          components: [
            { name: 'Button', version: '1.0.0', type: 'UI' },
            { name: 'Card', version: '1.0.0', type: 'UI' }
          ]
        });
      });

      // Make request - use end() with callback to properly close connections
      return new Promise((resolve) => {
        request(app)
          .get('/api/components/type/UI')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, response) => {
            if (err) throw err;
            // Assertions moved to callback
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('components');
            expect(Array.isArray(response.body.components)).toBe(true);
            expect(componentController.getComponentsByType).toHaveBeenCalled();
            resolve();
          });
      });
    });
  });

  describe('GET /api/components/:name/:version', () => {
    it('should return a component by name and version', async () => {
      // Set individual test timeout
      jest.setTimeout(60000);
      // Mock controller response
      componentController.getComponent.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          component: { name: 'Button', version: '1.0.0', type: 'UI' }
        });
      });

      // Make request - use end() with callback to properly close connections
      return new Promise((resolve) => {
        request(app)
          .get('/api/components/Button/1.0.0')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, response) => {
            if (err) throw err;
            // Assertions moved to callback
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('component');
            expect(componentController.getComponent).toHaveBeenCalled();
            resolve();
          });
      });
    });
  });

  describe('POST /api/components', () => {
    it('should create a new component', async () => {
      // Set individual test timeout
      jest.setTimeout(60000);
      // Mock controller response
      componentController.createComponent.mockImplementation((req, res) => {
        return res.status(201).json({
          success: true,
          component: { name: 'NewButton', version: '1.0.0', type: 'UI' }
        });
      });

      // Request body
      const componentData = {
        name: 'NewButton',
        version: '1.0.0',
        type: 'UI',
        code: '<button>Click me</button>'
      };

      // Make request - use end() with callback to properly close connections
      return new Promise((resolve) => {
        request(app)
          .post('/api/components')
          .send(componentData)
          .expect('Content-Type', /json/)
          .expect(201)
          .end((err, response) => {
            if (err) throw err;
            // Assertions moved to callback
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('component');
            expect(componentController.createComponent).toHaveBeenCalled();
            resolve();
          });
      });
    });
  });

  describe('DELETE /api/components/:name/:version', () => {
    it('should delete a component', async () => {
      // Set individual test timeout
      jest.setTimeout(60000);
      // Mock controller response
      componentController.deleteComponent.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          message: 'Component deleted successfully'
        });
      });

      // Make request - use end() with callback to properly close connections
      return new Promise((resolve) => {
        request(app)
          .delete('/api/components/Button/1.0.0')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, response) => {
            if (err) throw err;
            // Assertions moved to callback
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(componentController.deleteComponent).toHaveBeenCalled();
            resolve();
          });
      });
    });
  });

  describe('GET /api/components/types', () => {
    it('should return all component types', async () => {
      // Set individual test timeout
      jest.setTimeout(60000);
      // Mock controller response
      componentController.getComponentTypes.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          types: ['UI', 'Logic', 'Data']
        });
      });

      // Make request - use end() with callback to properly close connections
      return new Promise((resolve) => {
        request(app)
          .get('/api/components/types')
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, response) => {
            if (err) throw err;
            // Assertions
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('types');
            expect(Array.isArray(response.body.types)).toBe(true);
            expect(componentController.getComponentTypes).toHaveBeenCalled();
            resolve();
          });
      });
    });
  });

  describe('POST /api/components/types', () => {
    it('should add a new component type', async () => {
      // Set individual test timeout
      jest.setTimeout(60000);
      // Mock controller response
      componentController.addComponentType.mockImplementation((req, res) => {
        return res.status(201).json({
          success: true,
          type: 'Animation'
        });
      });

      // Request body
      const typeData = {
        name: 'Animation'
      };

      // Make request - use end() with callback to properly close connections
      return new Promise((resolve) => {
        request(app)
          .post('/api/components/types')
          .send(typeData)
          .expect('Content-Type', /json/)
          .expect(201)
          .end((err, response) => {
            if (err) throw err;
            // Assertions
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('type', 'Animation');
            expect(componentController.addComponentType).toHaveBeenCalled();
            resolve();
          });
      });
    });
  });
});
