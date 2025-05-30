/**
 * Integration tests for the Chatbots Platform Web Widget
 */

import axios from 'axios';
import ChatbotWidget from '../src/ChatbotWidget';
import ApiClient from '../src/utils/ApiClient';

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
    
    // Create widget instance with proxy configuration
    widget = new ChatbotWidget({
      apiKey: 'test-api-key',
      chatbotId: 'test-chatbot-id',
      proxyUrl: '104.129.196.38:10563' // Use the proxy from user preferences
    });
  });
  
  test('should initialize API client with proxy configuration', () => {
    // Check if ApiClient was initialized with correct proxy
    expect(axios.create).toHaveBeenCalled();
    
    // Get the config passed to axios.create
    const axiosConfig = axios.create.mock.calls[0][0];
    
    // Check if proxy is set in axios defaults
    expect(widget.api.client.defaults.proxy).toEqual({
      host: '104.129.196.38',
      port: 10563
    });
  });
  
  test('should make API requests through the proxy', async () => {
    // Initialize widget
    await widget.init();
    
    // Send a message
    await widget.sendMessage('Hello, chatbot!');
    
    // Check if API request was made
    expect(widget.api.client.post).toHaveBeenCalled();
    
    // Check if proxy was used for the request
    expect(widget.api.client.defaults.proxy).toEqual({
      host: '104.129.196.38',
      port: 10563
    });
  });
  
  test('should handle proxy errors gracefully', async () => {
    // Mock API error due to proxy issues
    widget.api.client.post.mockRejectedValueOnce(new Error('Proxy connection failed'));
    
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
