const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authMiddleware, requireRole, ROLES } = require('../middleware/authMiddleware');

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

module.exports = router;
