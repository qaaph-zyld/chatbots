/**
 * Mock API Integration Test
 */

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

const axios = require('axios');

describe('Mock API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle GET requests', async () => {
    const mockData = { id: 1, name: 'test' };
    axios.get.mockResolvedValue({ data: mockData, status: 200 });

    const response = await axios.get('/api/test');
    expect(response.data).toEqual(mockData);
    expect(response.status).toBe(200);
    expect(axios.get).toHaveBeenCalledWith('/api/test');
  });

  test('should handle POST requests', async () => {
    const postData = { name: 'new item' };
    const responseData = { id: 2, ...postData };
    axios.post.mockResolvedValue({ data: responseData, status: 201 });

    const response = await axios.post('/api/items', postData);
    expect(response.data).toEqual(responseData);
    expect(response.status).toBe(201);
  });

  test('should handle error responses', async () => {
    const errorResponse = { response: { status: 404, data: { error: 'Not found' } } };
    axios.get.mockRejectedValue(errorResponse);

    try {
      await axios.get('/api/nonexistent');
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });

  test('should handle multiple API calls', async () => {
    axios.get.mockResolvedValueOnce({ data: { id: 1 }, status: 200 });
    axios.get.mockResolvedValueOnce({ data: { id: 2 }, status: 200 });

    const [response1, response2] = await Promise.all([
      axios.get('/api/item/1'),
      axios.get('/api/item/2')
    ]);

    expect(response1.data.id).toBe(1);
    expect(response2.data.id).toBe(2);
  });
});
