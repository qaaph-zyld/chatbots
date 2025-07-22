'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';

// Define message types
type MessageRole = 'user' | 'bot' | 'system';

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

// Sample predefined scenarios
const PREDEFINED_SCENARIOS: Record<string, Message[]> = {
  'product-inquiry': [
    {
      id: '1',
      role: 'user',
      content: 'Do you have the latest iPhone in stock?',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'bot',
      content: 'Yes, we currently have the iPhone 15 Pro in stock in all colors. Would you like to know more about pricing or specifications?',
      timestamp: new Date(),
    },
  ],
  'order-status': [
    {
      id: '1',
      role: 'user',
      content: 'Where is my order #12345?',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'bot',
      content: 'I found your order #12345. It was shipped yesterday via FedEx and is expected to arrive on Thursday. The tracking number is FX123456789.',
      timestamp: new Date(),
    },
  ],
  'return-policy': [
    {
      id: '1',
      role: 'user',
      content: 'What is your return policy?',
      timestamp: new Date(),
    },
    {
      id: '2',
      role: 'bot',
      content: 'Our return policy allows returns within 30 days of purchase for a full refund. Items must be in their original condition with all packaging. Would you like me to help you start a return?',
      timestamp: new Date(),
    },
  ],
};

// Sample responses for common queries
const AI_RESPONSES: Record<string, string[]> = {
  'hello': [
    'Hello! How can I help you with your shopping today?',
    'Hi there! Welcome to our store. What can I assist you with?',
    'Good day! I\'m here to help with any questions about our products or services.',
  ],
  'price': [
    'Our pricing starts at $29.99 for the basic model. Premium versions are available from $49.99.',
    'The item you\'re looking at is currently $39.99, and we have a special promotion offering 15% off if you purchase today.',
    'We offer competitive pricing with options starting at $19.99. Would you like me to show you our current deals?',
  ],
  'shipping': [
    'We offer free shipping on all orders over $50. Standard shipping typically takes 3-5 business days.',
    'Shipping is available worldwide. Domestic orders arrive in 2-4 days, while international shipping takes 7-14 days.',
    'We provide several shipping options including standard (3-5 days) and express (1-2 days) delivery.',
  ],
  'default': [
    'I\'m not sure I understand. Could you please rephrase your question?',
    'Let me help you with that. Could you provide a bit more information?',
    'I\'d be happy to assist with your query. Could you give me more details?',
  ],
};

export interface ChatbotSimulationProps {
  scenarioId?: string | null;
  onPerformanceUpdate?: (data: any) => void;
}

export const ChatbotSimulation: React.FC<ChatbotSimulationProps> = ({ 
  scenarioId = null,
  onPerformanceUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load scenario if provided
  useEffect(() => {
    if (scenarioId && PREDEFINED_SCENARIOS[scenarioId]) {
      setMessages(PREDEFINED_SCENARIOS[scenarioId]);
    } else if (!messages.length) {
      // Add a welcome message if no scenario and no messages
      setMessages([
        {
          id: 'welcome',
          role: 'bot',
          content: 'Hello! I\'m ShopBot, your AI shopping assistant. How can I help you today?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [scenarioId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Report performance metrics
  useEffect(() => {
    if (onPerformanceUpdate && messages.length > 1) {
      onPerformanceUpdate({
        averageResponseTime: responseTime,
        messageCount: messages.length,
        userMessages: messages.filter(m => m.role === 'user').length,
        botMessages: messages.filter(m => m.role === 'bot').length,
        timestamp: new Date(),
      });
    }
  }, [messages, responseTime, onPerformanceUpdate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const generateBotResponse = (userMessage: string): Promise<string> => {
    return new Promise((resolve) => {
      // Simulate AI processing time (500-1500ms)
      const processingTime = Math.floor(Math.random() * 1000) + 500;
      
      // Track response time for metrics
      setResponseTime(processingTime);
      
      setTimeout(() => {
        // Simple keyword matching for demo purposes
        const lowercaseMessage = userMessage.toLowerCase();
        let responseArray = AI_RESPONSES.default;
        
        if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi')) {
          responseArray = AI_RESPONSES.hello;
        } else if (lowercaseMessage.includes('price') || lowercaseMessage.includes('cost')) {
          responseArray = AI_RESPONSES.price;
        } else if (lowercaseMessage.includes('shipping') || lowercaseMessage.includes('delivery')) {
          responseArray = AI_RESPONSES.shipping;
        }
        
        // Pick a random response from the appropriate array
        const randomIndex = Math.floor(Math.random() * responseArray.length);
        resolve(responseArray[randomIndex]);
      }, processingTime);
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    // Generate bot response
    const botResponseText = await generateBotResponse(userMessage.content);
    
    // Add bot response
    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      content: botResponseText,
      timestamp: new Date(),
    };
    
    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        content: 'Hello! I\'m ShopBot, your AI shopping assistant. How can I help you today?',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg overflow-hidden">
      {/* Chat header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">ShopBot Demo</h3>
          <p className="text-sm text-blue-100">Experience AI-powered customer support</p>
        </div>
        <Button variant="outline" onClick={clearChat} className="bg-blue-700 hover:bg-blue-800">
          New Chat
        </Button>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`mb-4 ${
              message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-70 block mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-gray-800 p-3 rounded-lg border border-gray-200 rounded-bl-none">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Chat input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isTyping}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isTyping}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotSimulation;
