const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/dashboard', ctrl.dashboard);
router.get('/users', ctrl.listUsers);
router.delete('/users/:id', ctrl.deleteUser);
router.put('/users/:id/toggle-active', ctrl.toggleUserActive);
router.get('/doctors', ctrl.listAllDoctors);
router.post('/doctors', ctrl.createDoctor);
router.put('/doctors/:id/approve', ctrl.approveDoctor);
router.get('/appointments', ctrl.listAllAppointments);
router.get('/prescriptions', ctrl.listAllPrescriptions);

module.exports = router;
