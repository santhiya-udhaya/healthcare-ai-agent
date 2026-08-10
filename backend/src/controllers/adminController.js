const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/admin/dashboard — high-level analytics
const dashboard = asyncHandler(async (req, res) => {
  const [users, doctors, appointments, records, pendingDoctors, prescriptions] = await Promise.all([
    query('SELECT COUNT(*) FROM users'),
    query('SELECT COUNT(*) FROM doctors WHERE is_approved = TRUE'),
    query('SELECT COUNT(*) FROM appointments'),
    query('SELECT COUNT(*) FROM medical_records'),
    query('SELECT COUNT(*) FROM doctors WHERE is_approved = FALSE'),
    query('SELECT COUNT(*) FROM prescriptions'),
  ]);

  const apptByStatus = await query('SELECT status, COUNT(*) FROM appointments GROUP BY status');
  const signupsByMonth = await query(
    `SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) FROM users GROUP BY month ORDER BY month DESC LIMIT 12`
  );

  return success(res, 200, 'Admin analytics', {
    totals: {
      users: Number(users.rows[0].count),
      doctors: Number(doctors.rows[0].count),
      appointments: Number(appointments.rows[0].count),
      records: Number(records.rows[0].count),
      prescriptions: Number(prescriptions.rows[0].count),
      pendingDoctorApprovals: Number(pendingDoctors.rows[0].count),
    },
    appointmentsByStatus: apptByStatus.rows,
    signupsByMonth: signupsByMonth.rows,
  });
});

// GET /api/admin/prescriptions
const listAllPrescriptions = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.id, p.diagnosis, p.medicines, p.advice, p.pdf_url, p.created_at,
            u.full_name AS patient_name, d.full_name AS doctor_name
     FROM prescriptions p
     JOIN users u ON u.id = p.patient_id
     JOIN doctors d ON d.id = p.doctor_id
     ORDER BY p.created_at DESC`
  );
  return success(res, 200, 'All prescriptions', result.rows);
});

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, full_name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  return success(res, 200, 'All users', result.rows);
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) throw new ApiError(404, 'User not found');
  return success(res, 200, 'User deleted');
});

// PUT /api/admin/users/:id/toggle-active
const toggleUserActive = asyncHandler(async (req, res) => {
  const result = await query(
    'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
    [req.params.id]
  );
  if (!result.rows[0]) throw new ApiError(404, 'User not found');
  return success(res, 200, 'User status updated', result.rows[0]);
});

// GET /api/admin/doctors
const listAllDoctors = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM doctors ORDER BY created_at DESC');
  return success(res, 200, 'All doctors', result.rows);
});

// PUT /api/admin/doctors/:id/approve
const approveDoctor = asyncHandler(async (req, res) => {
  const result = await query(
    'UPDATE doctors SET is_approved = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  if (!result.rows[0]) throw new ApiError(404, 'Doctor not found');
  return success(res, 200, 'Doctor approved', result.rows[0]);
});

// GET /api/admin/appointments
const listAllAppointments = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT a.*, u.full_name AS patient_name, d.full_name AS doctor_name
     FROM appointments a
     JOIN users u ON u.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     ORDER BY a.appointment_date DESC`
  );
  return success(res, 200, 'All appointments', result.rows);
});
const bcrypt = require("bcryptjs");
const { pool } = require('../config/db');

const createDoctor = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    specialization,
    qualification,
    experience,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      throw new ApiError(400, "Doctor already exists");
    }

    const hash = await bcrypt.hash(password, 10);

    const userResult = await client.query(
      `INSERT INTO users
      (
        full_name,
        email,
        password_hash,
        phone,
        role,
        is_active
      )
      VALUES
      ($1,$2,$3,$4,'doctor', TRUE)
      RETURNING id`,
      [
        fullName,
        email,
        hash,
        phone || null,
      ]
    );

    const userId = userResult.rows[0].id;

    const doctorResult = await client.query(
      `INSERT INTO doctors
      (
        user_id,
        full_name,
        email,
        password_hash,
        specialization,
        qualification,
        experience_years,
        consultation_fee,
        rating,
        bio,
        avatar_url,
        availability,
        is_approved
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        500,
        5,
        '',
        '',
        $8::jsonb,
        TRUE
      )
      RETURNING *`,
      [
        userId,
        fullName,
        email,
        hash,
        specialization,
        qualification,
        parseInt(experience) || 0,
        JSON.stringify({
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        }),
      ]
    );

    await client.query('COMMIT');
    return success(
      res,
      201,
      "Doctor created successfully",
      doctorResult.rows[0]
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});
module.exports = {
  dashboard,
  listUsers,
  deleteUser,
  toggleUserActive,
  createDoctor,
  listAllDoctors,
  approveDoctor,
  listAllAppointments,
  listAllPrescriptions,
};
