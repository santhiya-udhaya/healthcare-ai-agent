const bcrypt = require('bcryptjs');
const { pool, query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/doctors  ?search=&specialization=&page=&limit=
const listDoctors = asyncHandler(async (req, res) => {
  const { search = '', specialization = '', page = 1, limit = 12 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let where = 'WHERE is_approved = TRUE';

  if (search) {
    params.push(`%${search}%`);
    where += ` AND full_name ILIKE $${params.length}`;
  }
  if (specialization) {
    params.push(specialization);
    where += ` AND specialization = $${params.length}`;
  }

  params.push(limit, offset);
  const result = await query(
    `SELECT id, full_name, specialization, qualification, experience_years, consultation_fee, rating, avatar_url, availability
     FROM doctors ${where} ORDER BY rating DESC NULLS LAST
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  const countResult = await query(`SELECT COUNT(*) FROM doctors ${where}`, params.slice(0, params.length - 2));

  return success(res, 200, 'Doctors list', result.rows, {
    total: Number(countResult.rows[0].count),
    page: Number(page),
    limit: Number(limit),
  });
});

// GET /api/doctors/specializations
const listSpecializations = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT DISTINCT specialization FROM doctors WHERE is_approved = TRUE ORDER BY specialization'
  );
  return success(res, 200, 'Specializations', result.rows.map((r) => r.specialization));
});

// GET /api/doctors/:id
const getDoctor = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, full_name, specialization, qualification, experience_years, consultation_fee, rating, bio, avatar_url, availability
     FROM doctors WHERE id = $1 AND is_approved = TRUE`,
    [req.params.id]
  );
  if (!result.rows[0]) throw new ApiError(404, 'Doctor not found');
  return success(res, 200, 'Doctor details', result.rows[0]);
});

// POST /api/doctors  (self-registration — goes live only after admin approval)
const registerDoctor = asyncHandler(async (req, res) => {
  const { fullName, email, password, specialization, qualification, experienceYears, consultationFee, bio, phone } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const hash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role, is_active)
       VALUES ($1, $2, $3, $4, 'doctor', TRUE)
       RETURNING id`,
      [fullName, email, hash, phone || null]
    );

    const userId = userResult.rows[0].id;
    const doctorResult = await client.query(
      `INSERT INTO doctors (user_id, full_name, email, password_hash, specialization, qualification, experience_years, consultation_fee, bio, is_approved, availability)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, $10::jsonb)
       RETURNING id, full_name, email, specialization, is_approved`,
      [
        userId,
        fullName,
        email,
        hash,
        specialization,
        qualification,
        Number(experienceYears) || 0,
        Number(consultationFee) || 0,
        bio || null,
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
    return success(res, 201, 'Doctor registration submitted. Pending admin approval.', doctorResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

// PUT /api/doctors/:id/availability  (doctor updates own schedule)
const updateAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  const result = await query('UPDATE doctors SET availability = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [
    JSON.stringify(availability),
    req.params.id,
  ]);
  if (!result.rows[0]) throw new ApiError(404, 'Doctor not found');
  return success(res, 200, 'Availability updated', result.rows[0]);
});

module.exports = { listDoctors, listSpecializations, getDoctor, registerDoctor, updateAvailability };
