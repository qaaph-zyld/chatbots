/**
 * MVP Chatbot Server
 * 
 * Minimal viable product server for deployment
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-beta.1',
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'chatbot-api',
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    message: 'Chatbot Platform API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0-beta.1'
  });
});

// Chatbot endpoints
app.post('/api/chatbots', (req, res) => {
  const { name, description } = req.body;
  res.json({
    id: Date.now().toString(),
    name: name || 'Default Chatbot',
    description: description || 'A simple chatbot',
    created: new Date().toISOString(),
    status: 'active'
  });
});

app.get('/api/chatbots', (req, res) => {
  res.json({
    chatbots: [
      {
        id: '1',
        name: 'Demo Chatbot',
        description: 'A demonstration chatbot',
        created: new Date().toISOString(),
        status: 'active'
      }
    ],
    total: 1
  });
});

app.post('/api/chatbots/:id/message', (req, res) => {
  const { message } = req.body;
  const { id } = req.params;
  
  if (!message) {
    return res.status(400).json({
      error: 'Message is required'
    });
  }
  
  res.json({
    response: `Hello! You said: "${message}". This is a response from chatbot ${id}.`,
    timestamp: new Date().toISOString(),
    chatbotId: id,
    messageId: Date.now().toString()
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Chatbot Platform Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;
