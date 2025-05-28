/**
 * API Routes
 * 
 * Defines all API endpoints for the application
 */

const express = require('express');
const router = express.Router();

// Import controllers
// These will be implemented as we progress through the roadmap
const chatbotController = require('./controllers/chatbot.controller');
const templateController = require('./controllers/template.controller');
const integrationController = require('./controllers/integration.controller');
const personalityController = require('./controllers/personality.controller');
const knowledgeBaseController = require('./controllers/knowledgeBase.controller');
const pluginController = require('./controllers/plugin.controller');
const trainingController = require('./controllers/training.controller');
const analyticsController = require('./controllers/analytics.controller');
const contextController = require('./controllers/context.controller');
const authController = require('./controllers/auth.controller');
const healthController = require('./controllers/health.controller');
const usageController = require('./controllers/usage.controller');
const scalingController = require('./controllers/scaling.controller');

// Import middleware
const { authenticateToken, authenticateApiKey, hasPermission, hasRole, rateLimit } = require('../auth/auth.middleware');

// Health check endpoints
router.get('/health', healthController.healthCheck);
router.get('/health/status', authenticateToken, hasRole('admin'), healthController.systemStatus);
router.get('/metrics', authenticateToken, hasRole('admin'), healthController.metrics);

// Authentication routes
router.post('/auth/register', rateLimit(10, 60000), authController.register);
router.post('/auth/login', rateLimit(20, 60000), authController.login);
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/logout', authController.logout);
router.post('/auth/password-reset-request', rateLimit(5, 300000), authController.requestPasswordReset);
router.post('/auth/password-reset', rateLimit(5, 300000), authController.resetPassword);

// Protected user routes
router.get('/auth/me', authenticateToken, authController.getCurrentUser);
router.put('/auth/me', authenticateToken, authController.updateCurrentUser);
router.post('/auth/api-key', authenticateToken, authController.generateApiKey);

// Admin user management routes
router.get('/admin/users', authenticateToken, hasRole('admin'), authController.getAllUsers);
router.get('/admin/users/:id', authenticateToken, hasRole('admin'), authController.getUserById);
router.put('/admin/users/:id', authenticateToken, hasRole('admin'), authController.updateUser);
router.delete('/admin/users/:id', authenticateToken, hasRole('admin'), authController.deleteUser);

// Chatbot routes
router.get('/chatbots', authenticateToken, hasPermission('chatbot:read'), chatbotController.getAllChatbots);
router.post('/chatbots', authenticateToken, hasPermission('chatbot:write'), chatbotController.createChatbot);
router.get('/chatbots/:id', authenticateToken, hasPermission('chatbot:read'), chatbotController.getChatbotById);
router.put('/chatbots/:id', authenticateToken, hasPermission('chatbot:write'), chatbotController.updateChatbot);
router.delete('/chatbots/:id', authenticateToken, hasPermission('chatbot:delete'), chatbotController.deleteChatbot);

// Conversation routes - allow API key or token auth
router.post('/chatbots/:id/conversation', [authenticateApiKey, authenticateToken], chatbotController.sendMessage);
router.get('/chatbots/:id/conversation/history', authenticateToken, hasPermission('chatbot:read'), chatbotController.getConversationHistory);
router.post('/chatbots/:id/response-rating', authenticateToken, analyticsController.trackResponseRating);
router.get('/chatbots/:id/insights', authenticateToken, hasPermission('analytics:read'), analyticsController.getInsights);
router.post('/chatbots/:id/learning/apply', authenticateToken, hasPermission('chatbot:write'), analyticsController.applyLearning);

// Template routes
router.get('/templates', authenticateToken, hasPermission('template:read'), templateController.getAllTemplates);
router.post('/templates', authenticateToken, hasPermission('template:write'), templateController.createTemplate);
router.get('/templates/:id', authenticateToken, hasPermission('template:read'), templateController.getTemplateById);

// Integration routes
router.get('/integrations', authenticateToken, hasPermission('integration:read'), integrationController.getAllIntegrations);
router.post('/integrations', authenticateToken, hasPermission('integration:write'), integrationController.createIntegration);
router.get('/integrations/:id', authenticateToken, hasPermission('integration:read'), integrationController.getIntegrationById);
router.put('/integrations/:id', authenticateToken, hasPermission('integration:write'), integrationController.updateIntegration);
router.delete('/integrations/:id', authenticateToken, hasPermission('integration:delete'), integrationController.deleteIntegration);
router.post('/integrations/:id/activate', authenticateToken, hasPermission('integration:write'), integrationController.activateIntegration);
router.post('/integrations/:id/deactivate', authenticateToken, hasPermission('integration:write'), integrationController.deactivateIntegration);
router.post('/integrations/:id/message', integrationController.processMessage);
router.get('/chatbots/:chatbotId/integrations', authenticateToken, hasPermission('chatbot:read'), integrationController.getIntegrationsByChatbotId);

// Personality routes
router.get('/chatbots/:chatbotId/personalities', authenticateToken, hasPermission('chatbot:read'), personalityController.getPersonalities);
router.post('/chatbots/:chatbotId/personalities', authenticateToken, hasPermission('chatbot:write'), personalityController.createPersonality);
router.get('/chatbots/:chatbotId/personalities/:personalityId', authenticateToken, hasPermission('chatbot:read'), personalityController.getPersonality);
router.put('/chatbots/:chatbotId/personalities/:personalityId', authenticateToken, hasPermission('chatbot:write'), personalityController.updatePersonality);
router.delete('/chatbots/:chatbotId/personalities/:personalityId', authenticateToken, hasPermission('chatbot:delete'), personalityController.deletePersonality);

// Usage monitoring routes
router.get('/usage/statistics', authenticateToken, hasPermission('usage:read'), usageController.getUsageStatistics);
router.get('/usage/active-users', authenticateToken, hasPermission('usage:read'), usageController.getActiveUsers);
router.get('/usage/by-platform', authenticateToken, hasPermission('usage:read'), usageController.getUsageByPlatform);
router.get('/usage/by-time', authenticateToken, hasPermission('usage:read'), usageController.getUsageByTimeOfDay);
router.post('/usage/track', authenticateApiKey, usageController.trackUsage);

// Scaling routes
router.get('/scaling/metrics', authenticateToken, hasPermission('admin'), scalingController.getMetrics);
router.get('/scaling/configuration', authenticateToken, hasPermission('admin'), scalingController.getConfiguration);
router.put('/scaling/configuration', authenticateToken, hasPermission('admin'), scalingController.updateConfiguration);

// Knowledge Base routes
router.get('/chatbots/:chatbotId/knowledge-bases', authenticateToken, hasPermission('chatbot:read'), knowledgeBaseController.getKnowledgeBases);
router.post('/chatbots/:chatbotId/knowledge-bases', authenticateToken, hasPermission('chatbot:write'), knowledgeBaseController.createKnowledgeBase);
router.get('/knowledge-bases/:id', authenticateToken, hasPermission('chatbot:read'), knowledgeBaseController.getKnowledgeBaseById);
router.put('/knowledge-bases/:id', authenticateToken, hasPermission('chatbot:write'), knowledgeBaseController.updateKnowledgeBase);
router.delete('/knowledge-bases/:id', authenticateToken, hasPermission('chatbot:delete'), knowledgeBaseController.deleteKnowledgeBase);
router.post('/knowledge-bases/:id/items', authenticateToken, hasPermission('chatbot:write'), knowledgeBaseController.addKnowledgeItem);
router.put('/knowledge-bases/:id/items/:itemId', authenticateToken, hasPermission('chatbot:write'), knowledgeBaseController.updateKnowledgeItem);
router.delete('/knowledge-bases/:id/items/:itemId', authenticateToken, hasPermission('chatbot:write'), knowledgeBaseController.deleteKnowledgeItem);
router.get('/knowledge-bases/:id/search', authenticateToken, hasPermission('chatbot:read'), knowledgeBaseController.searchKnowledgeItems);

// Plugin routes
router.get('/plugins', authenticateToken, hasPermission('plugin:read'), pluginController.getAllPlugins);
router.post('/plugins', authenticateToken, hasPermission('plugin:write'), pluginController.registerPlugin);
router.get('/plugins/:id', authenticateToken, hasPermission('plugin:read'), pluginController.getPluginById);
router.put('/plugins/:id', authenticateToken, hasPermission('plugin:write'), pluginController.updatePlugin);
router.delete('/plugins/:id', authenticateToken, hasPermission('plugin:delete'), pluginController.unregisterPlugin);
router.get('/chatbots/:chatbotId/plugins', authenticateToken, hasPermission('chatbot:read'), pluginController.getChatbotPlugins);
router.post('/chatbots/:chatbotId/plugins', authenticateToken, hasPermission('chatbot:write'), pluginController.installPlugin);
router.delete('/chatbots/:chatbotId/plugins/:pluginId', authenticateToken, hasPermission('chatbot:write'), pluginController.uninstallPlugin);
router.put('/plugin-instances/:instanceId/config', authenticateToken, hasPermission('plugin:write'), pluginController.updatePluginConfig);
router.put('/plugin-instances/:instanceId/enabled', authenticateToken, hasPermission('plugin:write'), pluginController.setPluginEnabled);

// Training routes
router.get('/chatbots/:chatbotId/training-datasets', authenticateToken, hasPermission('chatbot:read'), trainingController.getTrainingDatasets);
router.post('/chatbots/:chatbotId/training-datasets', authenticateToken, hasPermission('chatbot:write'), trainingController.createTrainingDataset);
router.get('/training-datasets/:id', authenticateToken, hasPermission('chatbot:read'), trainingController.getTrainingDatasetById);
router.put('/training-datasets/:id', authenticateToken, hasPermission('chatbot:write'), trainingController.updateTrainingDataset);
router.delete('/training-datasets/:id', authenticateToken, hasPermission('chatbot:delete'), trainingController.deleteTrainingDataset);
router.post('/training-datasets/:id/examples', authenticateToken, hasPermission('chatbot:write'), trainingController.addTrainingExample);
router.delete('/training-datasets/:id/examples/:index', authenticateToken, hasPermission('chatbot:write'), trainingController.removeTrainingExample);
router.post('/training-datasets/:id/train', authenticateToken, hasPermission('chatbot:write'), trainingController.trainChatbot);

// Analytics routes
router.get('/chatbots/:chatbotId/analytics', authenticateToken, hasPermission('analytics:read'), analyticsController.getAnalytics);
router.get('/analytics', authenticateToken, hasPermission('analytics:read'), analyticsController.getAllAnalytics);
router.post('/chatbots/:chatbotId/response-rating', authenticateToken, analyticsController.trackResponseRating);
router.get('/chatbots/:chatbotId/insights', authenticateToken, hasPermission('analytics:read'), analyticsController.getInsights);
router.get('/chatbots/:chatbotId/analytics/compare', authenticateToken, hasPermission('analytics:read'), analyticsController.compareAnalytics);

// Learning routes
router.get('/chatbots/:chatbotId/learning', authenticateToken, hasPermission('analytics:read'), analyticsController.getLearningItems);
router.post('/chatbots/:chatbotId/learning', authenticateToken, hasPermission('analytics:write'), analyticsController.addManualLearning);
router.put('/learning/:learningId/status', authenticateToken, hasPermission('analytics:write'), analyticsController.updateLearningStatus);
router.post('/chatbots/:chatbotId/learning/generate', authenticateToken, hasPermission('analytics:write'), analyticsController.generateLearning);
router.post('/chatbots/:chatbotId/learning/apply', authenticateToken, hasPermission('chatbot:write'), analyticsController.applyLearning);

// Context awareness routes
// Context management
router.get('/chatbots/:chatbotId/users/:userId/conversations/:conversationId/context', authenticateToken, hasPermission('chatbot:read'), contextController.getContext);
router.put('/chatbots/:chatbotId/users/:userId/conversations/:conversationId/context', authenticateToken, hasPermission('chatbot:write'), contextController.updateContext);
router.get('/chatbots/:chatbotId/users/:userId/conversations/:conversationId/summary', authenticateToken, hasPermission('chatbot:read'), contextController.getConversationSummary);

// Topic management
router.post('/topics', authenticateToken, hasPermission('chatbot:write'), contextController.createTopic);
router.get('/chatbots/:chatbotId/topics', authenticateToken, hasPermission('chatbot:read'), contextController.getAllTopics);
router.get('/chatbots/:chatbotId/topics/:name', authenticateToken, hasPermission('chatbot:read'), contextController.getTopicByName);
router.put('/chatbots/:chatbotId/topics/:name', authenticateToken, hasPermission('chatbot:write'), contextController.updateTopic);
router.delete('/chatbots/:chatbotId/topics/:name', authenticateToken, hasPermission('chatbot:delete'), contextController.deleteTopic);
router.get('/chatbots/:chatbotId/topic-hierarchy', authenticateToken, hasPermission('chatbot:read'), contextController.getTopicHierarchy);
router.get('/chatbots/:chatbotId/topics/:topicName/related', authenticateToken, hasPermission('chatbot:read'), contextController.getRelatedTopics);
router.get('/chatbots/:chatbotId/users/:userId/conversations/:conversationId/topics', authenticateToken, hasPermission('chatbot:read'), contextController.getActiveTopics);

// Entity management
router.post('/chatbots/:chatbotId/users/:userId/conversations/:conversationId/entities', authenticateToken, hasPermission('chatbot:write'), contextController.processEntities);
router.get('/chatbots/:chatbotId/users/:userId/entities', authenticateToken, hasPermission('chatbot:read'), contextController.getUserEntities);
router.get('/chatbots/:chatbotId/users/:userId/entities/:entityId', authenticateToken, hasPermission('chatbot:read'), contextController.getEntityById);
router.post('/chatbots/:chatbotId/users/:userId/entity-relations', authenticateToken, hasPermission('chatbot:write'), contextController.addEntityRelation);
router.post('/chatbots/:chatbotId/users/:userId/merge-entities', authenticateToken, hasPermission('chatbot:write'), contextController.mergeEntities);
router.get('/chatbots/:chatbotId/users/:userId/potential-duplicates', authenticateToken, hasPermission('chatbot:read'), contextController.findPotentialDuplicates);
router.get('/chatbots/:chatbotId/users/:userId/conversations/:conversationId/entities', authenticateToken, hasPermission('chatbot:read'), contextController.getEntities);

// Reference resolution
router.post('/chatbots/:chatbotId/users/:userId/conversations/:conversationId/resolve-references', authenticateToken, hasPermission('chatbot:read'), contextController.resolveReferences);
router.post('/chatbots/:chatbotId/users/:userId/conversations/:conversationId/apply-resolved-references', authenticateToken, hasPermission('chatbot:write'), contextController.applyResolvedReferences);

// User preferences
router.get('/chatbots/:chatbotId/users/:userId/preferences', authenticateToken, hasPermission('chatbot:read'), contextController.getUserPreferences);
router.post('/chatbots/:chatbotId/users/:userId/conversations/:conversationId/preferences', authenticateToken, hasPermission('chatbot:write'), contextController.addUserPreference);

// Export router
module.exports = router;
