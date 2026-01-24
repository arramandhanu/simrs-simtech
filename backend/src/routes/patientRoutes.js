const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { requireRole, ROLES } = require('../middleware/authMiddleware');

// GET routes - all authenticated users can view
router.get('/recent', patientController.getRecentPatients);
router.get('/:id', patientController.getPatientById);

// POST/PUT/DELETE - require staff, nurse, doctor, or admin role
// Example: Add more routes with role protection as needed
// router.post('/', requireRole([ROLES.ADMIN, ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE]), patientController.createPatient);
// router.put('/:id', requireRole([ROLES.ADMIN, ROLES.STAFF, ROLES.DOCTOR, ROLES.NURSE]), patientController.updatePatient);
// router.delete('/:id', requireRole([ROLES.ADMIN]), patientController.deletePatient);

module.exports = router;
