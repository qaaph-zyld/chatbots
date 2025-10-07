/**
 * Simple Static File Server for ShopBot Website
 * Serves the public directory on port 3000
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'ShopBot Website'
  });
});

// API placeholder endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'ShopBot API is running'
  });
});

app.get('/api/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`# HELP shopbot_info Information about ShopBot
# TYPE shopbot_info gauge
shopbot_info{version="0.1.0",environment="development"} 1

# HELP shopbot_uptime_seconds Uptime in seconds
# TYPE shopbot_uptime_seconds gauge
shopbot_uptime_seconds ${process.uptime()}
`);
});

// Catch all route - serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ShopBot Website running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`);
});

module.exports = app;
