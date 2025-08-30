// Mock server for API tests
const express = require('express');
const app = express();

app.use(express.json());

// Mock API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/components', (req, res) => {
  res.json([
    { id: 1, name: 'test-component', version: '1.0.0' },
    { id: 2, name: 'mock-component', version: '2.0.0' }
  ]);
});

app.post('/api/auth/login', (req, res) => {
  res.json({ token: 'mock-jwt-token', user: { id: 1, email: 'test@example.com' } });
});

app.get('/static/css/main.css', (req, res) => {
  res.type('text/css').send('body { margin: 0; }');
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

const PORT = process.env.TEST_PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});

module.exports = { app, server };
