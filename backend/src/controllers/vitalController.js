const { query } = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

// GET /api/vitals/me
const getMyVitals = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
      bmi,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      heart_rate,
      sugar_level,
      health_score,
      recorded_at
     FROM vitals
     WHERE user_id = $1
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return success(res, 200, "No vitals found", {
      bmi: null,
      blood_pressure_systolic: null,
      blood_pressure_diastolic: null,
      heart_rate: null,
      sugar_level: null,
      health_score: null,
    });
  }

  return success(res, 200, "Vitals loaded", result.rows[0]);
});

// POST /api/vitals
const saveVitals = asyncHandler(async (req, res) => {
  const {
    bmi,
    blood_pressure_systolic,
    blood_pressure_diastolic,
    heart_rate,
    sugar_level,
    health_score,
  } = req.body;

  const result = await query(
    `INSERT INTO vitals
    (
      user_id,
      bmi,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      heart_rate,
      sugar_level,
      health_score
    )
    VALUES($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [
      req.user.id,
      bmi,
      blood_pressure_systolic,
      blood_pressure_diastolic,
      heart_rate,
      sugar_level,
      health_score,
    ]
  );

  return success(res, 201, "Vitals saved", result.rows[0]);
});

module.exports = {
  getMyVitals,
  saveVitals,
};