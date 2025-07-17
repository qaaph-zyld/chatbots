const request = require('supertest');
const app = require('../../../src/app');

describe('Auth Routes', () => {
  test('should respond to login route', async () => {
    const response = await request(app).post('/api/auth/login').send({});
    expect(response.statusCode).toBe(200);
  });
});
