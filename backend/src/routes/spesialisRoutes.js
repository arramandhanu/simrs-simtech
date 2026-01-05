const express = require('express');
const router = express.Router();
const spesialisController = require('../controllers/spesialisController');

// Get all specializations
router.get('/', spesialisController.getAllSpesialis);

// Get doctor's specializations
router.get('/dokter/:dokterId', spesialisController.getDokterSpesialis);

// Update doctor's specializations
router.put('/dokter/:dokterId', spesialisController.updateDokterSpesialis);

module.exports = router;
