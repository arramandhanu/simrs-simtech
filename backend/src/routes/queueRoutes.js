const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

// Queue operations
router.get('/', queueController.getActiveQueue);
router.post('/register', queueController.registerPatient);
router.post('/call-next', queueController.callNext);
router.post('/:id/recall', queueController.recallPatient);
router.post('/:id/skip', queueController.skipPatient);
router.post('/:id/serve', queueController.servePatient);
router.post('/:id/complete', queueController.completePatient);
router.post('/:id/transfer', queueController.transferQueue);

// Analytics and display
router.get('/stats', queueController.getStats);
router.get('/display', queueController.getDisplayBoard);

module.exports = router;
