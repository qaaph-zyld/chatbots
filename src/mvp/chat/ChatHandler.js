/**
 * Chat Handler - MVP Implementation
 * Handles chat message processing with enhanced responses
 */

const ProductService = require('../products/ProductService');
const BillingService = require('../billing/BillingService');

class ChatHandler {
  constructor() {
    this.sessions = new Map(); // Simple in-memory session storage
    this.productService = new ProductService();
    this.billingService = new BillingService();
  }

  // Main message handler
  handleMessage(req, res) {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const { message, sessionId, customerId } = JSON.parse(body);
        
        if (!message || message.trim().length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Message is required'
          }));
          return;
        }

        // Track usage for billing (if customer ID provided)
        if (customerId) {
          const usageResult = await this.billingService.trackUsage(customerId, 1);
          if (!usageResult.success) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: usageResult.error,
              upgradeRequired: true
            }));
            return;
          }
        }

        // Generate or use existing session ID
        const chatSessionId = sessionId || this.generateSessionId();

        // Update session data
        this.updateSession(chatSessionId, message);

        // Generate enhanced response with product integration
        const response = await this.generateEnhancedResponse(message, chatSessionId);

        // Return response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            sessionId: chatSessionId,
            userMessage: message,
            botResponse: response.text,
            products: response.products || [],
            suggestions: response.suggestions || [],
            timestamp: new Date().toISOString()
          }
        }));

      } catch (error) {
        console.error('Chat error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Failed to process message'
        }));
      }
    });
  }

  // Generate unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Update session data
  updateSession(sessionId, message) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date()
      });
    }

    const session = this.sessions.get(sessionId);
    session.messages.push({
      type: 'user',
      content: message,
      timestamp: new Date()
    });
    session.lastActivity = new Date();
  }

  // Enhanced response generation with product integration
  async generateEnhancedResponse(message, sessionId) {
    const lowerMessage = message.toLowerCase();
    const session = this.sessions.get(sessionId);
    const isReturningUser = session && session.messages.length > 1;

    // Product search queries
    if (this.isProductSearchQuery(lowerMessage)) {
      return await this.handleProductSearch(lowerMessage);
    }

    // Fallback to basic response
    const basicResponse = this.generateResponse(message, sessionId);
    return { text: basicResponse };
  }

  // Check if message is a product search query
  isProductSearchQuery(message) {
    const productKeywords = [
      'laptop', 'computer', 'phone', 'smartphone', 'headphones', 'earbuds',
      'buy', 'purchase', 'looking for', 'need', 'want', 'show me', 'find',
      'recommend', 'best', 'cheap', 'affordable', 'under', 'budget'
    ];
    return productKeywords.some(keyword => message.includes(keyword));
  }

  // Handle product search and recommendations
  async handleProductSearch(message) {
    let products = [];
    let responseText = '';
    let suggestions = [];

    // Extract search terms and price range
    const searchTerms = this.extractSearchTerms(message);
    const priceRange = this.extractPriceRange(message);

    if (searchTerms.length > 0) {
      // Search for products
      products = this.productService.searchProducts(searchTerms.join(' '), 6);
      
      if (products.length > 0) {
        responseText = `🛍️ **Found ${products.length} products matching "${searchTerms.join(' ')}":**\n\n`;
        
        products.slice(0, 3).forEach((product, index) => {
          const discount = product.originalPrice ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
          
          responseText += `**${index + 1}. ${product.name}**\n`;
          responseText += `💰 $${product.price}`;
          if (discount > 0) responseText += ` ~~$${product.originalPrice}~~ (${discount}% off!)`;
          responseText += `\n⭐ ${product.rating}/5 (${product.reviews} reviews)\n`;
          responseText += `📝 ${product.description.substring(0, 100)}...\n\n`;
        });

        if (products.length > 3) {
          responseText += `...and ${products.length - 3} more products!\n\n`;
        }

        responseText += `💡 **Need help deciding?** I can provide more details about any product or help you compare options!`;
        
        // Generate suggestions
        suggestions = [
          'Compare these products',
          'Show more details',
          'Filter by price range',
          'See customer reviews'
        ];
      } else {
        responseText = `😔 I couldn't find any products matching "${searchTerms.join(' ')}". Let me suggest some popular alternatives:\n\n`;
        
        // Get featured products as alternatives
        products = this.productService.getFeaturedProducts(4);
        products.forEach((product, index) => {
          responseText += `**${index + 1}. ${product.name}** - $${product.price}\n`;
        });
        
        responseText += `\n💡 **Try searching for:** laptops, smartphones, headphones, or browse by category!`;
        
        suggestions = [
          'Show all laptops',
          'Show all smartphones', 
          'Show featured products',
          'Browse categories'
        ];
      }
    } else {
      // General product inquiry
      responseText = this.getGeneralProductResponse(message);
      products = this.productService.getFeaturedProducts(4);
      suggestions = [
        'Show laptops',
        'Show smartphones',
        'Show audio devices',
        'Show sale items'
      ];
    }

    return {
      text: responseText,
      products: products,
      suggestions: suggestions
    };
  }

  // Extract search terms from message
  extractSearchTerms(message) {
    const commonWords = ['i', 'am', 'looking', 'for', 'a', 'an', 'the', 'want', 'need', 'buy', 'purchase', 'show', 'me', 'find'];
    const words = message.toLowerCase().split(/\s+/);
    return words.filter(word => 
      word.length > 2 && 
      !commonWords.includes(word) &&
      !/^\d+$/.test(word) // Remove pure numbers
    );
  }

  // Extract price range from message
  extractPriceRange(message) {
    const priceMatch = message.match(/under\s*\$?(\d+)|below\s*\$?(\d+)|less\s*than\s*\$?(\d+)/i);
    if (priceMatch) {
      return { max: parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]) };
    }
    
    const rangeMatch = message.match(/\$?(\d+)\s*-\s*\$?(\d+)|\$?(\d+)\s*to\s*\$?(\d+)/i);
    if (rangeMatch) {
      return { 
        min: parseInt(rangeMatch[1] || rangeMatch[3]), 
        max: parseInt(rangeMatch[2] || rangeMatch[4]) 
      };
    }
    
    return null;
  }

  // Get general product response
  getGeneralProductResponse(message) {
    if (message.includes('laptop') || message.includes('computer')) {
      return "💻 **Laptop Categories:**\n• **Work Laptops**: Dell XPS, MacBook Air, ThinkPad\n• **Gaming Laptops**: ASUS ROG, MSI, Alienware\n• **Budget Options**: Acer, HP Pavilion, Lenovo IdeaPad\n\nWhat's your primary use case and budget range?";
    }
    
    if (message.includes('phone') || message.includes('smartphone')) {
      return "📱 **Smartphone Options:**\n• **Premium**: iPhone 15 Pro, Samsung Galaxy S24\n• **Mid-Range**: Google Pixel 8, OnePlus 12\n• **Budget**: Samsung Galaxy A54, iPhone SE\n\nAny specific features you're looking for?";
    }
    
    return "🛍️ **Popular Categories:**\n• 💻 **Electronics** (laptops, phones, tablets)\n• 🎧 **Audio** (headphones, speakers, earbuds)\n• 🏠 **Smart Home** (appliances, devices)\n• 🎮 **Gaming** (consoles, accessories)\n\nWhat are you shopping for today?";
  }

  // Legacy response generation (kept for backwards compatibility)
  generateResponse(message, sessionId) {
    const lowerMessage = message.toLowerCase();
    const session = this.sessions.get(sessionId);
    const isReturningUser = session && session.messages.length > 1;

    // Personalized greeting for returning users
    if ((lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) && isReturningUser) {
      return "Welcome back! I'm here to help you with your shopping needs. What can I assist you with today?";
    }

    // Enhanced pricing responses
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      return this.getPricingResponse(lowerMessage);
    }

    // Product search and recommendations
    if (lowerMessage.includes('product') || lowerMessage.includes('buy') || lowerMessage.includes('shop') || lowerMessage.includes('looking for')) {
      return this.getProductResponse(lowerMessage);
    }
    
    // Shipping and delivery
    if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery') || lowerMessage.includes('when will')) {
      return "🚚 **Shipping Options:**\n• **Standard Delivery**: 3-5 business days (FREE on orders $50+)\n• **Express Delivery**: 1-2 business days ($9.99)\n• **Same-Day Delivery**: Available in select cities ($19.99)\n\nWould you like to check if same-day delivery is available in your area?";
    }
    
    // Returns and refunds
    if (lowerMessage.includes('return') || lowerMessage.includes('refund') || lowerMessage.includes('exchange')) {
      return "🔄 **Easy Returns & Refunds:**\n• 30-day return policy\n• Free return shipping\n• Full refund or exchange\n• No restocking fees\n\nNeed help with a return? I can guide you through the process!";
    }
    
    // Customer support
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('problem')) {
      return "🤝 **I'm here to help!** I can assist with:\n• Product recommendations\n• Pricing and deals\n• Shipping information\n• Order tracking\n• Returns & exchanges\n• Technical support\n\nWhat specific help do you need today?";
    }
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "👋 Hello! Welcome to ShopBot, your AI shopping assistant. I can help you find products, check prices, and answer questions about shipping and returns. What are you looking for today?";
    }
    
    // Gratitude
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "😊 You're very welcome! I'm always happy to help. Is there anything else you'd like to know about our products or services?";
    }
    
    // Farewell
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
      return "👋 Goodbye! Thanks for using ShopBot. Have a wonderful day, and feel free to come back anytime for shopping assistance!";
    }

    // Default response with context
    return `I understand you're asking about: "${message}". As your ShopBot assistant, I can help you with:\n\n🛍️ **Product Search & Recommendations**\n💰 **Pricing & Deals**\n🚚 **Shipping & Delivery**\n🔄 **Returns & Exchanges**\n\nWhat would you like to explore?`;
  }

  // Get pricing response based on product type
  getPricingResponse(message) {
    if (message.includes('laptop') || message.includes('computer')) {
      return "💻 **Laptop Pricing Guide:**\n• **Budget Laptops**: $300-600 (Basic tasks, web browsing)\n• **Mid-Range**: $600-1200 (Work, light gaming, creative tasks)\n• **Gaming/Professional**: $1200-3000+ (High performance, gaming, video editing)\n\n🔥 **Current Deals**: Up to 25% off select models!\nWhat's your budget range and intended use?";
    }
    
    if (message.includes('phone') || message.includes('smartphone')) {
      return "📱 **Smartphone Pricing:**\n• **Budget Phones**: $100-300 (Basic features, good value)\n• **Mid-Range**: $300-700 (Great cameras, solid performance)\n• **Flagship Models**: $700-1500+ (Latest features, premium build)\n\n🎯 **Popular Picks**: iPhone 15, Samsung Galaxy S24, Google Pixel 8\nAny specific brand or features you're interested in?";
    }
    
    if (message.includes('headphone') || message.includes('earbuds') || message.includes('audio')) {
      return "🎧 **Audio Device Pricing:**\n• **Basic Earbuds**: $20-50 (Wired, basic quality)\n• **Quality Headphones**: $50-200 (Wireless, noise cancellation)\n• **Premium/Pro Audio**: $200-500+ (Studio quality, professional)\n\n🎵 **Top Brands**: Sony, Bose, Apple AirPods, Sennheiser\nWired or wireless? Any brand preferences?";
    }
    
    return "💰 **I can help with pricing for:**\n• 💻 Electronics (laptops, phones, tablets, TVs)\n• 🎧 Audio devices (headphones, speakers, earbuds)\n• 📷 Cameras & photography gear\n• 🏠 Smart home devices\n• 🎮 Gaming equipment\n• 👕 Fashion & accessories\n\nWhat product are you interested in? I'll give you current price ranges and deals!";
  }

  // Get product-specific response
  getProductResponse(message) {
    if (message.includes('laptop') || message.includes('computer')) {
      return "💻 **Laptop Recommendations:**\n\n**For Work**: Dell XPS 13, MacBook Air M2, ThinkPad X1\n**For Gaming**: ASUS ROG, MSI Gaming, Alienware\n**For Students**: Acer Aspire, HP Pavilion, Lenovo IdeaPad\n\n🔍 What will you primarily use it for? (work, gaming, school, creative work)";
    }
    
    if (message.includes('phone') || message.includes('smartphone')) {
      return "📱 **Popular Smartphones:**\n\n**iOS**: iPhone 15 Pro, iPhone 15, iPhone 14\n**Android**: Samsung Galaxy S24, Google Pixel 8, OnePlus 12\n**Budget**: Samsung Galaxy A54, Google Pixel 7a\n\n📋 Any specific features important to you? (camera, battery, gaming, price range)";
    }
    
    return "🛍️ **Product Categories:**\n• 💻 **Electronics** (laptops, phones, tablets)\n• 🏠 **Home & Garden** (furniture, appliances, decor)\n• 👕 **Fashion** (clothing, shoes, accessories)\n• 🎮 **Gaming** (consoles, games, accessories)\n• 📚 **Books & Media** (books, movies, music)\n• 🏃 **Sports & Outdoors** (fitness, camping, sports gear)\n\nWhat category interests you? I can show you our best deals and recommendations!";
  }

  // Get session info (for debugging/admin)
  getSessionInfo(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  // Clean up old sessions (call periodically)
  cleanupSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = ChatHandler;
