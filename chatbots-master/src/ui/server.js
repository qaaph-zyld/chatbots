/**
 * Simple HTTP server for the Chatbot Customization UI
 */

const express = require('express');
const path = require('path');
require('@src/utils');

// Create Express app
const app = express();
const port = process.env.UI_PORT || 3001;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(port, () => {
  logger.info(`Chatbot Customization UI server running on port ${port}`);
  logger.info(`Open http://localhost:${port} in your browser to view the UI`);
});

module.exports = app;
