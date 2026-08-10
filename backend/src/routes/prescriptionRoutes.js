const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ctrl = require('../controllers/prescriptionController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);
router.post(
  '/draft',
  authorize('doctor', 'admin'),
  body('symptoms').trim().notEmpty().withMessage('Symptoms are required'),
  body('patientAge').optional().isInt({ min: 0 }).withMessage('patientAge must be a positive integer'),
  body('patientId').optional().isUUID().withMessage('patientId must be a valid UUID'),
  validate,
  ctrl.draftPrescriptionHandler
);
router.post(
  '/approve',
  authorize('doctor', 'admin'),
  body('patientId').isUUID().withMessage('Patient ID is required'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('advice').trim().notEmpty().withMessage('Advice is required'),
  validate,
  ctrl.approvePrescription
);
router.post('/', authorize('doctor', 'admin'), ctrl.createPrescription);
router.get('/me', ctrl.myPrescriptions);
router.get('/patient/:id', ctrl.getPatientPrescriptions);
router.get('/:id/download', ctrl.downloadPrescription);

module.exports = router;
