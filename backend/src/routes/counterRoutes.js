const express = require('express');
const router = express.Router();
const counterController = require('../controllers/counterController');

router.get('/', counterController.getAll);
router.get('/:id', counterController.getById);
router.post('/', counterController.create);
router.put('/:id', counterController.update);
router.delete('/:id', counterController.remove);
router.post('/:id/assign', counterController.assignOperator);
router.post('/:id/release', counterController.releaseOperator);

module.exports = router;
