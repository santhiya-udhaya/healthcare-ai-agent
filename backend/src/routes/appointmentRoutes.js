const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { bookRules } = require('../validations/appointmentValidation');

router.use(protect);
router.post('/', bookRules, validate, ctrl.bookAppointment);
router.get('/me', ctrl.myAppointments);
router.put('/:id/cancel', ctrl.cancelAppointment);
router.put('/:id/status', authorize('doctor', 'admin'), ctrl.updateStatus);
router.get('/doctor', authorize('doctor', 'admin'), ctrl.currentDoctorAppointments);
router.get('/doctor/:doctorId', authorize('doctor', 'admin'), ctrl.doctorAppointments);

module.exports = router;
