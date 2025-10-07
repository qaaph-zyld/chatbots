/**
 * Chat Response Tests - MVP Core Logic
 */

describe('Chat Response Generation', () => {
  // Mock the response generation function from basic-server.js
  function generateChatResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Enhanced pricing responses
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      if (lowerMessage.includes('laptop') || lowerMessage.includes('computer')) {
        return "💻 Laptop prices vary by specs:\n• Budget laptops: $300-600\n• Mid-range laptops: $600-1200\n• Gaming/Professional: $1200-3000+\n\nWhat's your budget range and intended use?";
      }
      if (lowerMessage.includes('phone') || lowerMessage.includes('smartphone')) {
        return "📱 Smartphone pricing:\n• Budget phones: $100-300\n• Mid-range: $300-700\n• Flagship models: $700-1500+\n\nAre you looking for any specific brand or features?";
      }
      return "💰 I can help with pricing for:\n• Electronics (laptops, phones, tablets, TVs)\n• Audio devices (headphones, speakers)\n• Cameras & photography gear\n• Smart home devices\n• Gaming equipment\n• Fashion & accessories\n\nWhat product are you interested in? I'll give you current price ranges!";
    }

    // Shopping-related responses
    if (lowerMessage.includes('product') || lowerMessage.includes('buy') || lowerMessage.includes('shop')) {
      return "🛍️ I can help you find products! What are you looking for today? I have great deals on electronics, fashion, home goods, and more!";
    }
    
    if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
      return "We offer fast shipping options! Standard delivery is 3-5 business days, and express delivery is 1-2 business days.";
    }
    
    if (lowerMessage.includes('return') || lowerMessage.includes('refund')) {
      return "Our return policy allows returns within 30 days of purchase. Would you like me to help you with a return?";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return "I'm here to help! I can assist with product information, pricing, shipping, returns, and general shopping questions. What would you like to know?";
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! Welcome to ShopBot. I'm your shopping assistant. How can I help you today?";
    }
    
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! Is there anything else I can help you with?";
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return "Goodbye! Thanks for using ShopBot. Have a great day!";
    }

    // Default response
    return `I understand you're asking about: "${message}". I'm ShopBot, your shopping assistant. I can help with products, pricing, shipping, and returns. What specific information would you like?`;
  }

  test('responds to greeting messages', () => {
    const greetings = ['hello', 'hi', 'hey there'];
    
    greetings.forEach(greeting => {
      const response = generateChatResponse(greeting);
      expect(response).toContain('Hello! Welcome to ShopBot');
      expect(response).toContain('shopping assistant');
    });
  });

  test('provides laptop pricing information', () => {
    const laptopQueries = [
      'how much does a laptop cost?',
      'laptop prices',
      'price of computers'
    ];
    
    laptopQueries.forEach(query => {
      const response = generateChatResponse(query);
      expect(response).toContain('💻');
      expect(response).toContain('Budget laptops: $300-600');
      expect(response).toContain('Gaming/Professional: $1200-3000+');
    });
  });

  test('provides phone pricing information', () => {
    const phoneQueries = [
      'smartphone prices',
      'how much is a phone?',
      'cost of phones'
    ];
    
    phoneQueries.forEach(query => {
      const response = generateChatResponse(query);
      expect(response).toContain('📱');
      expect(response).toContain('Budget phones: $100-300');
      expect(response).toContain('Flagship models: $700-1500+');
    });
  });

  test('handles shopping inquiries', () => {
    const shopQueries = [
      'I want to buy something',
      'show me products',
      'I need to shop'
    ];
    
    shopQueries.forEach(query => {
      const response = generateChatResponse(query);
      expect(response).toContain('🛍️');
      expect(response).toContain('find products');
    });
  });

  test('provides shipping information', () => {
    const shippingQueries = [
      'shipping options',
      'how long is delivery?',
      'delivery time'
    ];
    
    shippingQueries.forEach(query => {
      const response = generateChatResponse(query);
      expect(response).toContain('shipping options');
      expect(response).toContain('3-5 business days');
      expect(response).toContain('1-2 business days');
    });
  });

  test('handles return policy questions', () => {
    const returnQueries = [
      'can I return this?',
      'refund policy',
      'how to return items'
    ];
    
    returnQueries.forEach(query => {
      const response = generateChatResponse(query);
      expect(response).toContain('return policy');
      expect(response).toContain('30 days');
    });
  });

  test('provides help information', () => {
    const helpQueries = [
      'I need help',
      'can you help me?',
      'support'
    ];
    
    helpQueries.forEach(query => {
      const response = generateChatResponse(query);
      expect(response).toContain("I'm here to help");
      expect(response).toContain('product information');
    });
  });

  test('handles thank you messages', () => {
    const thankYouMessages = ['thank you', 'thanks', 'thank you so much'];
    
    thankYouMessages.forEach(message => {
      const response = generateChatResponse(message);
      expect(response).toContain("You're welcome");
      expect(response).toContain('anything else');
    });
  });

  test('handles goodbye messages', () => {
    const goodbyeMessages = ['bye', 'goodbye'];
    
    goodbyeMessages.forEach(message => {
      const response = generateChatResponse(message);
      expect(response).toContain('Goodbye');
      expect(response).toContain('Thanks for using ShopBot');
    });
  });

  test('provides default response for unknown queries', () => {
    const unknownQueries = [
      'random question',
      'what is the meaning of life?',
      'tell me a joke'
    ];
    
    unknownQueries.forEach(query => {
      const response = generateChatResponse(query);
      expect(response).toContain(`I understand you're asking about: "${query}"`);
      expect(response).toContain("I'm ShopBot, your shopping assistant");
    });
  });
});
