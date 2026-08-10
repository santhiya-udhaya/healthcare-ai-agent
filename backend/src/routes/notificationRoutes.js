const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.listNotifications);
router.put('/:id/read', ctrl.markRead);
router.put('/read-all', ctrl.markAllRead);
router.post('/medicine-reminder', ctrl.createMedicineReminder);

module.exports = router;
