const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', ctrl.listDoctors);
router.get('/specializations', ctrl.listSpecializations);
router.get('/:id', ctrl.getDoctor);
router.post('/', ctrl.registerDoctor);
router.put('/:id/availability', protect, authorize('doctor', 'admin'), ctrl.updateAvailability);

module.exports = router;
