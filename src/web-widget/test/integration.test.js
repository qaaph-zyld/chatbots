/**
 * Integration tests for the Chatbots Platform Web Widget
 */

import axios from 'axios';
import '@src/web-widget\src\ChatbotWidget';
import '@src/web-widget\src\utils\ApiClient';

// Mock axios
jest.mock('axios');

describe('Web Widget Integration Tests', () => {
  let widget;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock axios create to return a mock client
    axios.create.mockReturnValue({
      get: jest.fn().mockResolvedValue({ data: { status: 'ok' } }),
      post: jest.fn().mockResolvedValue({ data: { sessionId: 'test-session-id' } }),
      delete: jest.fn().mockResolvedValue({ data: { success: true } }),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      defaults: {}
    });
    
    // Create widget instance
    widget = new ChatbotWidget({
      apiKey: 'test-api-key',
      chatbotId: 'test-chatbot-id'
    });
  });
  
  test('should initialize API client', () => {
    // Check if ApiClient was initialized
    expect(axios.create).toHaveBeenCalled();
    
    // Get the config passed to axios.create
    const axiosConfig = axios.create.mock.calls[0][0];
  });
  
  test('should make API requests', async () => {
    // Initialize widget
    await widget.init();
    
    // Send a message
    await widget.sendMessage('Hello, chatbot!');
    
    // Check if API request was made
    expect(widget.api.client.post).toHaveBeenCalled();
  });
  
  test('should handle API errors gracefully', async () => {
    // Mock API error
    widget.api.client.post.mockRejectedValueOnce(new Error('Connection failed'));
    
    // Initialize widget
    await widget.init();
    
    // Send a message
    await widget.sendMessage('Hello, chatbot!');
    
    // Check if error state was updated
    expect(widget.state.error).toBe('Failed to send message');
    
    // Check if error message was added to UI
    expect(widget.ui.addMessage).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.stringContaining('Sorry, there was an error'),
      sender: 'bot',
      type: 'error'
    }));
  });
});
