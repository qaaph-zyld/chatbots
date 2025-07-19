const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const ConversationEngine = require('../services/conversationEngine');

// Initialize services
const authService = new AuthService(process.env.SECRET_KEY);
const conversationEngine = new ConversationEngine(
  require('../services/intentClassifier'),
  require('../services/responseGenerator')
);

router.post('/start', (req, res) => {
  conversationEngine.start();
  res.json({ message: 'Conversation started' });
});

router.post('/message', (req, res) => {
  const { message, sessionToken } = req.body;
  try {
    authService.verifyToken(sessionToken);
    const response = conversationEngine.processMessage(message);
    res.json({ response });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

router.post('/end', (req, res) => {
  conversationEngine.end();
  res.json({ message: 'Conversation ended' });
});

module.exports = router;
