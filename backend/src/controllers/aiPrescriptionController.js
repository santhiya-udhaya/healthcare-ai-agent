const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { draftPrescription } = require('../services/aiPrescriptionService');

// POST /api/ai/generate-prescription
const generatePrescription = asyncHandler(async (req, res) => {
  const { patientId, patientAge, sex, diagnosis, symptoms, allergies, currentMedications } = req.body;

  let patient = null;
  let effectiveAge = patientAge;
  let effectiveSex = sex;
  let effectiveAllergies = allergies;

  if (patientId) {
    const patientRes = await query(
      'SELECT id, full_name, gender, allergies, date_of_birth FROM users WHERE id = $1',
      [patientId]
    );
    patient = patientRes.rows[0];
    if (!patient) throw new ApiError(404, 'Patient not found');

    if (!effectiveAge && patient.date_of_birth) {
      const today = new Date();
      const dob = new Date(patient.date_of_birth);
      effectiveAge = today.getFullYear() - dob.getFullYear() - (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
    }
    if (!effectiveSex) effectiveSex = patient.gender;
    if (!effectiveAllergies) effectiveAllergies = patient.allergies;
  }

  const aiResult = await draftPrescription({
    patientAge: effectiveAge,
    sex: effectiveSex,
    diagnosis,
    symptoms,
    allergies: effectiveAllergies,
    currentMedications,
  });

  return success(res, 200, 'Prescription draft generated', { patient, ...aiResult });
});

module.exports = { generatePrescription };
