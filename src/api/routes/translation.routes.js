/**
 * Translation Routes
 * 
 * API routes for managing translations and language settings
 */

const express = require('express');
const router = express.Router();
require('@src/api\controllers\translation.controller');
require('@src/middleware');

// Public routes
router.get('/languages/supported', translationController.getSupportedLanguages);
router.get('/languages/available', translationController.getAvailableLanguages);
router.get('/:langCode/:namespace?', translationController.getTranslations);

// Admin-only routes
router.put('/:langCode/:namespace?', adminAuthMiddleware, translationController.updateTranslations);
router.post('/languages', adminAuthMiddleware, translationController.addLanguage);
router.delete('/languages/:langCode', adminAuthMiddleware, translationController.removeLanguage);

module.exports = router;
