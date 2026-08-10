const fs = require('fs');
const path = require('path');
const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { generatePrescriptionPdf } = require('../services/pdfService');
const { draftPrescription } = require('../services/aiPrescriptionService');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/prescriptions');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// POST /api/prescriptions  (doctor creates a prescription, PDF generated & stored)
const createPrescription = asyncHandler(async (req, res) => {
  const {
    appointmentId,
    patientId,
    doctorId,
    diagnosis,
    medicines,
    advice,
    confidenceScore,
    recommendedTests,
    specialistReferral,
    isEmergency,
    emergencyNote,
  } = req.body;

  const [patientRes, doctorRes] = await Promise.all([
    query('SELECT id, full_name FROM users WHERE id = $1', [patientId]),
    query('SELECT id, full_name, specialization FROM doctors WHERE id = $1', [doctorId]),
  ]);
  if (!patientRes.rows[0]) throw new ApiError(404, 'Patient not found');
  if (!doctorRes.rows[0]) throw new ApiError(404, 'Doctor not found');

  const date = new Date().toLocaleDateString();
  const pdfBuffer = await generatePrescriptionPdf({
    patient: patientRes.rows[0],
    doctor: doctorRes.rows[0],
    diagnosis,
    medicines,
    advice,
    date,
  });

  const filename = `rx_${Date.now()}.pdf`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), pdfBuffer);
  const pdfUrl = `/uploads/prescriptions/${filename}`;

  const result = await query(
    `INSERT INTO prescriptions
       (appointment_id, patient_id, doctor_id, diagnosis, medicines, advice, confidence_score,
        recommended_tests, specialist_referral, is_emergency, emergency_note, pdf_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      appointmentId || null,
      patientId,
      doctorId,
      diagnosis,
      JSON.stringify(medicines || []),
      advice,
      confidenceScore || null,
      recommendedTests || null,
      specialistReferral || null,
      isEmergency || false,
      emergencyNote || null,
      pdfUrl,
    ]
  );

  await query(`INSERT INTO notifications (user_id, type, title, message) VALUES ($1,'system',$2,$3)`, [
    patientId,
    'New prescription available',
    `Dr. ${doctorRes.rows[0].full_name} has issued a new prescription for you.`,
  ]);

  return success(res, 201, 'Prescription created', result.rows[0]);
});

// GET /api/prescriptions/me
const myPrescriptions = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.*, d.full_name AS doctor_name, d.specialization
     FROM prescriptions p JOIN doctors d ON d.id = p.doctor_id
     WHERE p.patient_id = $1 ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  return success(res, 200, 'My prescriptions', result.rows);
});

// GET /api/prescriptions/:id/download
const downloadPrescription = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM prescriptions WHERE id = $1 AND patient_id = $2', [
    req.params.id,
    req.user.id,
  ]);
  const rx = result.rows[0];
  if (!rx || !rx.pdf_url) throw new ApiError(404, 'Prescription PDF not found');

  const filePath = path.join(__dirname, '../..', rx.pdf_url);
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'PDF file missing on server');
  res.download(filePath, `prescription-${rx.id}.pdf`);
});

// POST /api/prescriptions/draft
const draftPrescriptionHandler = asyncHandler(async (req, res) => {
  const { patientId, patientAge, sex, diagnosis, symptoms, allergies, currentMedications } = req.body;

  let patient = null;
  if (patientId) {
    const patientRes = await query(
      'SELECT id, full_name, gender, phone, blood_group, allergies, date_of_birth FROM users WHERE id = $1',
      [patientId]
    );
    patient = patientRes.rows[0];
    if (!patient) throw new ApiError(404, 'Patient not found');
  }

  const aiResult = await draftPrescription({
    patientAge,
    sex,
    diagnosis,
    symptoms,
    allergies,
    currentMedications,
  });

  return success(res, 200, 'AI prescription draft', {
    patient,
    ...aiResult,
  });
});

// POST /api/prescriptions/approve
const approvePrescription = asyncHandler(async (req, res) => {
  const {
    appointmentId,
    patientId,
    diagnosis,
    medicines,
    advice,
    confidenceScore,
    recommendedTests,
    specialistReferral,
    isEmergency,
    emergencyNote,
  } = req.body;

  const doctorResult = await query(
    'SELECT id FROM doctors WHERE user_id = $1',
    [req.user.id]
  );

  if (!doctorResult.rows[0]) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  const doctorId = doctorResult.rows[0].id;

  const [patientRes, doctorRes] = await Promise.all([
    query('SELECT id, full_name FROM users WHERE id = $1', [patientId]),
    query('SELECT id, full_name, specialization FROM doctors WHERE id = $1', [doctorId]),
  ]);
  if (!patientRes.rows[0]) throw new ApiError(404, 'Patient not found');
  if (!doctorRes.rows[0]) throw new ApiError(404, 'Doctor not found');

  const date = new Date().toLocaleDateString();
  const pdfBuffer = await generatePrescriptionPdf({
    patient: patientRes.rows[0],
    doctor: doctorRes.rows[0],
    diagnosis,
    medicines,
    advice,
    date,
  });

  const filename = `rx_${Date.now()}.pdf`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), pdfBuffer);
  const pdfUrl = `/uploads/prescriptions/${filename}`;

  const result = await query(
    `INSERT INTO prescriptions
       (appointment_id, patient_id, doctor_id, diagnosis, medicines, advice, confidence_score,
        recommended_tests, specialist_referral, is_emergency, emergency_note, pdf_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      appointmentId || null,
      patientId,
      doctorId,
      diagnosis,
      JSON.stringify(medicines || []),
      advice,
      confidenceScore || null,
      recommendedTests || null,
      specialistReferral || null,
      isEmergency || false,
      emergencyNote || null,
      pdfUrl,
    ]
  );

  await query(`INSERT INTO notifications (user_id, type, title, message) VALUES ($1,'system',$2,$3)`, [
    patientId,
    'New prescription available',
    `Dr. ${doctorRes.rows[0].full_name} has approved a new prescription for you.`,
  ]);

  return success(res, 201, 'Prescription approved and saved', result.rows[0]);
});

// GET /api/prescriptions/patient/:id
const getPatientPrescriptions = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  if (req.user.role === 'patient' && req.user.id !== patientId) {
    throw new ApiError(403, 'Forbidden: cannot view other patient prescriptions');
  }

  const result = await query(
    `SELECT p.*, d.full_name AS doctor_name, d.specialization
     FROM prescriptions p JOIN doctors d ON d.id = p.doctor_id
     WHERE p.patient_id = $1 ORDER BY p.created_at DESC`,
    [patientId]
  );
  return success(res, 200, 'Patient prescriptions', result.rows);
});

module.exports = { createPrescription, myPrescriptions, downloadPrescription, draftPrescriptionHandler, approvePrescription, getPatientPrescriptions };
