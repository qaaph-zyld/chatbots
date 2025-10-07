/**
 * Basic HTTP Server for ShopBot Website
 * Uses only Node.js built-in modules
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

// Chat message handler
function handleChatMessage(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    try {
      const { message, sessionId } = JSON.parse(body);
      
      if (!message || message.trim().length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Message is required'
        }));
        return;
      }

      // Generate session ID if not provided
      const chatSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Generate response
      const response = generateChatResponse(message);

      // Return response
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          sessionId: chatSessionId,
          userMessage: message,
          botResponse: response,
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

// Generate chat response (Enhanced MVP implementation)
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
    if (lowerMessage.includes('headphone') || lowerMessage.includes('earbuds')) {
      return "🎧 Audio device pricing:\n• Basic earbuds: $20-50\n• Quality headphones: $50-200\n• Premium/Pro audio: $200-500+\n\nWired or wireless? Any brand preferences?";
    }
    if (lowerMessage.includes('tablet') || lowerMessage.includes('ipad')) {
      return "📱 Tablet pricing ranges:\n• Budget tablets: $100-250\n• Mid-range tablets: $250-500\n• Premium tablets (iPad Pro, etc.): $500-1500+\n\nWhat size screen and what will you use it for?";
    }
    if (lowerMessage.includes('tv') || lowerMessage.includes('television')) {
      return "📺 TV pricing by size:\n• 32-43\": $150-400\n• 50-55\": $300-800\n• 65-75\": $500-1500+\n• 85\"+ Premium: $1500-5000+\n\nSmart TV features or specific brand preference?";
    }
    if (lowerMessage.includes('watch') || lowerMessage.includes('smartwatch')) {
      return "⌚ Watch pricing:\n• Fitness trackers: $50-200\n• Smartwatches: $200-500\n• Premium smartwatches: $500-1000+\n\nApple Watch, Samsung, or other brand preference?";
    }
    if (lowerMessage.includes('camera')) {
      return "📷 Camera pricing:\n• Point & shoot: $200-600\n• Mirrorless cameras: $400-2000+\n• DSLR cameras: $500-3000+\n• Action cameras: $100-500\n\nWhat type of photography are you planning?";
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

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'ShopBot Website'
    }));
    return;
  }

  // API health endpoint
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'ShopBot API is running'
    }));
    return;
  }

  // Metrics endpoint
  if (pathname === '/api/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`# HELP shopbot_info Information about ShopBot
# TYPE shopbot_info gauge
shopbot_info{version="0.1.0",environment="development"} 1

# HELP shopbot_uptime_seconds Uptime in seconds
# TYPE shopbot_uptime_seconds gauge
shopbot_uptime_seconds ${process.uptime()}
`);
    return;
  }

  // Chat API endpoints
  if (pathname === '/api/chat/message' && req.method === 'POST') {
    handleChatMessage(req, res);
    return;
  }

  if (pathname === '/api/chat/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      service: 'ShopBot Chat Service',
      status: 'operational',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Serve static files
  let filePath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);
  
  // Security check - prevent directory traversal
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found, serve index.html for SPA routing
      filePath = path.join(publicDir, 'index.html');
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }

      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🚀 ShopBot Website running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = server;
