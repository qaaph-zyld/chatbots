/**
 * Tests for the Chatbots Platform Web Widget
 */

import '@src/web-widget\src\ChatbotWidget';
import '@src/web-widget\src\utils\ApiClient';
import '@src/web-widget\src\ui\WidgetUI';

// Mock dependencies
jest.mock('../src/utils/ApiClient');
jest.mock('../src/ui/WidgetUI');

describe('ChatbotWidget', () => {
  let widget;
  const mockConfig = {
    apiKey: 'test-api-key',
    chatbotId: 'test-chatbot-id'
  };
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup mocks
    ApiClient.mockImplementation(() => ({
      createSession: jest.fn().mockResolvedValue({ sessionId: 'test-session-id' }),
      endSession: jest.fn().mockResolvedValue({ success: true }),
      sendMessage: jest.fn().mockResolvedValue({ 
        id: 'response-id', 
        content: 'Test response',
        timestamp: new Date().toISOString()
      }),
      getConversationHistory: jest.fn().mockResolvedValue({
        messages: []
      }),
      clearConversation: jest.fn().mockResolvedValue({ success: true }),
      getChatbotInfo: jest.fn().mockResolvedValue({
        name: 'Test Chatbot',
        description: 'A test chatbot',
        welcomeMessage: 'Welcome to the test chatbot!'
      }),
      getHealthStatus: jest.fn().mockResolvedValue({ status: 'ok' })
    }));
    
    WidgetUI.mockImplementation(() => ({
      render: jest.fn(),
      open: jest.fn(),
      close: jest.fn(),
      addMessage: jest.fn(),
      renderMessages: jest.fn(),
      clearMessages: jest.fn(),
      showTypingIndicator: jest.fn(),
      hideTypingIndicator: jest.fn(),
      updateMessageStatus: jest.fn(),
      updateTitle: jest.fn(),
      updateSubtitle: jest.fn(),
      updateTheme: jest.fn(),
      destroy: jest.fn()
    }));
    
    // Create widget instance
    widget = new ChatbotWidget(mockConfig);
  });
  
  test('should initialize with correct configuration', () => {
    // Check if ApiClient was initialized with correct config
    expect(ApiClient).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: 'test-api-key',
      chatbotId: 'test-chatbot-id',
      proxyUrl: '104.129.196.38:10563'
    }));
    
    // Check if WidgetUI was initialized with correct config
    expect(WidgetUI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-api-key',
        chatbotId: 'test-chatbot-id'
      }),
      widget
    );
  });
  
  test('should initialize the widget', async () => {
    // Initialize widget
    await widget.init();
    
    // Check if UI was rendered
    expect(widget.ui.render).toHaveBeenCalled();
    
    // Check if API connection was established
    expect(widget.api.getChatbotInfo).toHaveBeenCalled();
    
    // Check if widget is initialized
    expect(widget.state.initialized).toBe(true);
  });
  
  test('should open the widget', () => {
    // Initialize widget
    widget.init();
    
    // Open widget
    widget.open();
    
    // Check if UI was opened
    expect(widget.ui.open).toHaveBeenCalled();
    
    // Check if state was updated
    expect(widget.state.open).toBe(true);
  });
  
  test('should close the widget', () => {
    // Initialize widget
    widget.init();
    
    // Open widget first
    widget.state.open = true;
    
    // Close widget
    widget.close();
    
    // Check if UI was closed
    expect(widget.ui.close).toHaveBeenCalled();
    
    // Check if state was updated
    expect(widget.state.open).toBe(false);
  });
  
  test('should toggle the widget', () => {
    // Initialize widget
    widget.init();
    
    // Toggle widget (from closed to open)
    widget.toggle();
    
    // Check if UI was opened
    expect(widget.ui.open).toHaveBeenCalled();
    
    // Check if state was updated
    expect(widget.state.open).toBe(true);
    
    // Toggle widget again (from open to closed)
    widget.toggle();
    
    // Check if UI was closed
    expect(widget.ui.close).toHaveBeenCalled();
    
    // Check if state was updated
    expect(widget.state.open).toBe(false);
  });
  
  test('should send a message', async () => {
    // Initialize widget
    await widget.init();
    
    // Send a message
    await widget.sendMessage('Hello, chatbot!');
    
    // Check if message was added to UI
    expect(widget.ui.addMessage).toHaveBeenCalledWith(expect.objectContaining({
      content: 'Hello, chatbot!',
      sender: 'user'
    }));
    
    // Check if message was sent to API
    expect(widget.api.sendMessage).toHaveBeenCalledWith('Hello, chatbot!');
    
    // Check if typing indicator was shown and hidden
    expect(widget.ui.showTypingIndicator).toHaveBeenCalled();
    expect(widget.ui.hideTypingIndicator).toHaveBeenCalled();
    
    // Check if response was added to UI
    expect(widget.ui.addMessage).toHaveBeenCalledWith(expect.objectContaining({
      content: 'Test response',
      sender: 'bot'
    }));
  });
  
  test('should clear the conversation', async () => {
    // Initialize widget
    await widget.init();
    
    // Clear conversation
    await widget.clearConversation();
    
    // Check if UI messages were cleared
    expect(widget.ui.clearMessages).toHaveBeenCalled();
    
    // Check if API conversation was cleared
    expect(widget.api.clearConversation).toHaveBeenCalled();
    
    // Check if state was updated
    expect(widget.state.messages).toEqual([]);
  });
  
  test('should destroy the widget', () => {
    // Initialize widget
    widget.init();
    
    // Destroy widget
    widget.destroy();
    
    // Check if UI was destroyed
    expect(widget.ui.destroy).toHaveBeenCalled();
    
    // Check if session was ended
    expect(widget.api.endSession).toHaveBeenCalled();
  });
  
  test('should handle API errors gracefully', async () => {
    // Mock API error
    widget.api.sendMessage.mockRejectedValueOnce(new Error('API error'));
    
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
  
  test('should use proxy configuration correctly', () => {
    // Check if proxy was set in API client
    expect(ApiClient).toHaveBeenCalledWith(expect.objectContaining({
      proxyUrl: '104.129.196.38:10563'
    }));
  });
});
