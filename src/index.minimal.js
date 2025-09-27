/**
 * Minimal MVP Server
 * 
 * Basic Express server for MVP deployment
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0-beta.1'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Chatbot API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0-beta.1'
  });
});

// Basic chatbot endpoint
app.post('/api/chatbots/:id/message', (req, res) => {
  const { message } = req.body;
  const { id } = req.params;
  
  res.json({
    response: `Echo from chatbot ${id}: ${message}`,
    timestamp: new Date().toISOString(),
    chatbotId: id
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
