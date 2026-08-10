const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.put('/me', ctrl.updateProfile);
router.get('/dashboard', ctrl.getDashboard);
router.post('/vitals', ctrl.addVitals);
router.get('/vitals/history', ctrl.vitalsHistory);
router.get("/:id", ctrl.getPatientById);

module.exports = router;
