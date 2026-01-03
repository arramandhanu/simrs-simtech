const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

router.get('/recent', patientController.getRecentPatients);
router.get('/:id', patientController.getPatientById);

module.exports = router;
