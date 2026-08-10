const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/trackingController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Medicine reminders
router.post('/reminders', ctrl.addReminder);
router.get('/reminders', ctrl.listReminders);
router.put('/reminders/:id', ctrl.updateReminder);
router.delete('/reminders/:id', ctrl.deleteReminder);

// Water
router.post('/water', ctrl.addWater);
router.get('/water', ctrl.getWater);

// Sleep
router.post('/sleep', ctrl.addSleep);
router.get('/sleep', ctrl.getSleep);

module.exports = router;