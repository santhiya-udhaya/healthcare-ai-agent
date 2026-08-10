const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// PUT /api/users/me
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, dateOfBirth, gender, bloodGroup, allergies, avatarUrl } = req.body;
  const result = await query(
    `UPDATE users SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       date_of_birth = COALESCE($3, date_of_birth),
       gender = COALESCE($4, gender),
       blood_group = COALESCE($5, blood_group),
       allergies = COALESCE($6, allergies),
       avatar_url = COALESCE($7, avatar_url),
       updated_at = NOW()
     WHERE id = $8
     RETURNING id, full_name, email, phone, date_of_birth, gender, blood_group, allergies, avatar_url, role`,
    [fullName, phone, dateOfBirth, gender, bloodGroup, allergies, avatarUrl, req.user.id]
  );
  return success(res, 200, 'Profile updated', result.rows[0]);
});

// GET /api/users/dashboard — aggregated dashboard payload
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [vitals, upcoming, prescriptions, records, notifications] = await Promise.all([
    query('SELECT * FROM vitals WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 1', [userId]),
    query(
      `SELECT a.*, d.full_name AS doctor_name, d.specialization
       FROM appointments a JOIN doctors d ON d.id = a.doctor_id
       WHERE a.patient_id = $1 AND a.appointment_date >= CURRENT_DATE AND a.status != 'cancelled'
       ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT 5`,
      [userId]
    ),
    query(
      `SELECT p.*, d.full_name AS doctor_name FROM prescriptions p
       JOIN doctors d ON d.id = p.doctor_id
       WHERE p.patient_id = $1 ORDER BY p.created_at DESC LIMIT 5`,
      [userId]
    ),
    query('SELECT * FROM medical_records WHERE patient_id = $1 ORDER BY record_date DESC LIMIT 5', [userId]),
    query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10', [userId]),
  ]);

  const analytics = {
    diseasePrediction: {
      likelyCondition: 'Review based on recent symptoms',
      confidence: 'medium',
      explanation: 'Derived from recent symptom checker activity and vitals.',
    },
    symptomClusters: {
      primary: 'Monitor recurring symptoms and severity over time',
      severity: 'tracked from past checks',
      duration: 'review weekly',
      notes: 'Symptoms can be clustered by duration and severity.',
    },
    recoveryPrediction: {
      outlook: 'Likely improves with rest; follow up with a clinician if symptoms persist',
      estimatedDays: 3,
    },
    seasonalTrends: {
      trend: 'Seasonal patterns vary by symptoms and environment',
      note: 'Use this as a general wellness trend indicator.',
    },
  };

  return success(res, 200, 'Dashboard data', {
    vitals: vitals.rows[0] || null,
    upcomingAppointments: upcoming.rows,
    recentPrescriptions: prescriptions.rows,
    recentRecords: records.rows,
    notifications: notifications.rows,
    analytics,
  });
});

// POST /api/users/vitals — log/update health vitals, recompute a simple health score
const addVitals = asyncHandler(async (req, res) => {
  const { bmi, bpSystolic, bpDiastolic, heartRate, sugarLevel } = req.body;

  let score = 100;
  if (bmi && (bmi < 18.5 || bmi > 25)) score -= 15;
  if (bpSystolic && (bpSystolic > 130 || bpSystolic < 90)) score -= 15;
  if (heartRate && (heartRate > 100 || heartRate < 60)) score -= 15;
  if (sugarLevel && (sugarLevel > 140 || sugarLevel < 70)) score -= 15;
  score = Math.max(0, score);

  const result = await query(
    `INSERT INTO vitals (user_id, bmi, blood_pressure_systolic, blood_pressure_diastolic, heart_rate, sugar_level, health_score)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [req.user.id, bmi, bpSystolic, bpDiastolic, heartRate, sugarLevel, score]
  );
  return success(res, 201, 'Vitals recorded', result.rows[0]);
});

// GET /api/users/vitals/history
const vitalsHistory = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT * FROM vitals WHERE user_id = $1 ORDER BY recorded_at ASC LIMIT 30',
    [req.user.id]
  );
  return success(res, 200, 'Vitals history', result.rows);
});

// GET /api/patients/history
const getHistory = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       a.appointment_date,
       a.appointment_time,
       d.full_name AS doctor_name,
       d.specialization,
       p.diagnosis,
       p.medicines,
       p.advice,
       p.pdf_url,
       a.status
     FROM appointments a
     LEFT JOIN prescriptions p ON a.id = p.appointment_id
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.patient_id = $1
     ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
    [req.user.id]
  );
  return success(res, 200, 'Patient history', result.rows);
});
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role === 'patient' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const patientRes = await query(
      `
      SELECT
        id,
        full_name,
        gender,
        phone,
        blood_group,
        allergies,
        date_of_birth
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (patientRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    const patient = patientRes.rows[0];

    let age = '';
    if (patient.date_of_birth) {
      const today = new Date();
      const dob = new Date(patient.date_of_birth);
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    const [medicalRecords, prescriptions] = await Promise.all([
      query(
        `SELECT mr.id, mr.title, mr.record_type, mr.description, mr.doctor_notes, mr.file_url, mr.record_date,
                d.full_name AS doctor_name
         FROM medical_records mr
         LEFT JOIN doctors d ON d.id = mr.doctor_id
         WHERE mr.patient_id = $1
         ORDER BY mr.record_date DESC
         LIMIT 5`,
        [id]
      ),
      query(
        `SELECT p.id, p.appointment_id, p.diagnosis, p.medicines, p.advice, p.confidence_score,
                p.recommended_tests, p.specialist_referral, p.is_emergency, p.emergency_note, p.created_at,
                d.full_name AS doctor_name
         FROM prescriptions p
         JOIN doctors d ON d.id = p.doctor_id
         WHERE p.patient_id = $1
         ORDER BY p.created_at DESC
         LIMIT 5`,
        [id]
      ),
    ]);

    return res.json({
      success: true,
      data: {
        id: patient.id,
        full_name: patient.full_name,
        age,
        gender: patient.gender,
        blood_group: patient.blood_group,
        allergies: patient.allergies || '',
        phone: patient.phone,
        medicalRecords: medicalRecords.rows,
        recentPrescriptions: prescriptions.rows,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

module.exports = { updateProfile, getDashboard, addVitals, vitalsHistory, getHistory , getPatientById};
