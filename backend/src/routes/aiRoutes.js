const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const aiPrescriptionController = require('../controllers/aiPrescriptionController');
const { protect, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

router.use(protect);
router.post(
  '/generate-prescription',
  authorize('doctor', 'admin'),
  body('symptoms').trim().notEmpty().withMessage('Symptoms are required'),
  body('patientId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('patientId must be a valid UUID'),
  body('patientAge').optional({ nullable: true, checkFalsy: true }).isInt({ min: 0 }).withMessage('patientAge must be a positive integer'),
  body('sex').optional({ nullable: true, checkFalsy: true }).isString(),
  body('diagnosis').optional({ nullable: true, checkFalsy: true }).isString(),
  body('allergies').optional({ nullable: true, checkFalsy: true }).isString(),
  body('currentMedications').optional({ nullable: true, checkFalsy: true }).isString(),
  validate,
  aiPrescriptionController.generatePrescription
);
router.post('/symptom-checker', body('symptoms').trim().notEmpty().withMessage('Please describe your symptoms'), validate, aiController.checkSymptoms);
router.post('/chatbot', body('message').trim().notEmpty().withMessage('Message is required'), validate, aiController.chatWithBot);
router.get('/history', aiController.chatHistory);

module.exports = router;
