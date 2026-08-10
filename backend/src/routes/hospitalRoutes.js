const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hospitalController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', ctrl.nearbyHospitals);
router.post('/', protect, authorize('admin'), ctrl.addHospital);

module.exports = router;
