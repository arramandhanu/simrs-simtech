const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');

// Validation rules
const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// Database auth routes
router.post('/login', loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);

// Keycloak SSO routes
router.get('/keycloak', authController.keycloakLogin);
router.get('/keycloak/callback', authController.keycloakCallback);

// Auth config (returns available auth methods)
router.get('/config', authController.getAuthConfig);

module.exports = router;
