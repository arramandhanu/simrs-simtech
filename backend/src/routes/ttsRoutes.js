const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/ttsController');

// Voice templates
router.get('/templates', ttsController.getTemplates);
router.post('/templates', ttsController.createTemplate);
router.put('/templates/:id', ttsController.updateTemplate);
router.delete('/templates/:id', ttsController.deleteTemplate);

// Generate call text
router.post('/generate', ttsController.generateCallText);

// Clinic schedules
router.get('/schedules', ttsController.getSchedules);
router.post('/schedules', ttsController.upsertSchedule);

module.exports = router;
