const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/trackingController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/reminders', ctrl.addReminder);
router.get('/reminders', ctrl.listReminders);
router.post('/water', ctrl.addWater);
router.get('/water', ctrl.getWater);
router.post('/sleep', ctrl.addSleep);
router.get('/sleep', ctrl.getSleep);

module.exports = router;