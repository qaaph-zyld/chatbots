const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ShopBot MVP'
  });
});

// API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'ShopBot API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic chatbot endpoint
app.post('/api/chat', (req, res) => {
  const { message, userId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  // Simple response logic for MVP
  const responses = {
    'hello': 'Hi! How can I help you with your shopping today?',
    'help': 'I can help you with orders, products, returns, and general shopping questions.',
    'order': 'I can help you track your order. Please provide your order number.',
    'return': 'I can assist with returns. What would you like to return?',
    'product': 'What product are you looking for? I can help you find it.',
    'default': 'I understand you need help. Could you please be more specific about what you need?'
  };
  
  const lowerMessage = message.toLowerCase();
  let response = responses.default;
  
  for (const [key, value] of Object.entries(responses)) {
    if (lowerMessage.includes(key)) {
      response = value;
      break;
    }
  }
  
  res.json({
    response,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ShopBot server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API status: http://localhost:${PORT}/api/status`);
  });
}

module.exports = app;
