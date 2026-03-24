const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole, ROLES } = authMiddleware;

// All routes require authentication
router.use(authMiddleware);

// User settings routes (all authenticated users)
router.get('/user', settingsController.getUserSettings);
router.put('/user', settingsController.updateUserSettings);

// Profile routes (all authenticated users)
router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);

// Hospital settings routes (admin only)
router.get('/hospital', requireRole([ROLES.ADMIN]), settingsController.getHospitalSettings);
router.put('/hospital', requireRole([ROLES.ADMIN]), settingsController.updateHospitalSettings);

// SMTP / Email config (admin only)
router.get('/smtp', requireRole([ROLES.ADMIN]), settingsController.getSmtpConfig);
router.put('/smtp', requireRole([ROLES.ADMIN]), settingsController.updateSmtpConfig);
router.post('/smtp/test', requireRole([ROLES.ADMIN]), settingsController.testSmtpConfig);

// Notification channels config (admin only)
router.get('/notification-channels', requireRole([ROLES.ADMIN]), settingsController.getNotificationChannels);
router.put('/notification-channels', requireRole([ROLES.ADMIN]), settingsController.updateNotificationChannels);

module.exports = router;
