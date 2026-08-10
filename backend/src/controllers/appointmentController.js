const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// =======================
// Book Appointment
// POST /api/appointments
// =======================
const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, appointmentTime, reason } = req.body;

  const doctor = await query(
    'SELECT id FROM doctors WHERE id = $1 AND is_approved = TRUE',
    [doctorId]
  );

  if (!doctor.rows[0]) {
    throw new ApiError(404, 'Doctor not found');
  }

  const clash = await query(
    `SELECT id
     FROM appointments
     WHERE doctor_id = $1
       AND appointment_date = $2
       AND appointment_time = $3
       AND status IN ('pending','confirmed')`,
    [doctorId, appointmentDate, appointmentTime]
  );

  if (clash.rows.length > 0) {
    throw new ApiError(409, 'This time slot is already booked');
  }

  const result = await query(
    `INSERT INTO appointments
      (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
     VALUES
      ($1,$2,$3,$4,$5,'pending')
     RETURNING *`,
    [
      req.user.id,
      doctorId,
      appointmentDate,
      appointmentTime,
      reason || null,
    ]
  );

  await query(
    `INSERT INTO notifications
      (user_id,type,title,message)
     VALUES
      ($1,'appointment',$2,$3)`,
    [
      req.user.id,
      'Appointment Requested',
      `Your appointment on ${appointmentDate} at ${appointmentTime} is pending confirmation.`,
    ]
  );

  return success(res, 201, 'Appointment booked successfully', result.rows[0]);
});

// =======================
// Patient Appointments
// GET /api/appointments/me
// =======================
const myAppointments = asyncHandler(async (req, res) => {
  const { status } = req.query;

  let params = [req.user.id];
  let where = 'WHERE a.patient_id = $1';

  if (status) {
    params.push(status);
    where += ` AND a.status = $${params.length}`;
  }

  const result = await query(
    `SELECT
        a.*,
        d.full_name AS doctor_name,
        d.specialization,
        d.avatar_url AS doctor_avatar
     FROM appointments a
     JOIN doctors d
       ON d.id = a.doctor_id
     ${where}
     ORDER BY a.appointment_date DESC,
              a.appointment_time DESC`,
    params
  );

  return success(res, 200, 'My appointments', result.rows);
});

// =======================
// Cancel Appointment
// =======================
const cancelAppointment = asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE appointments
        SET status='cancelled',
            updated_at=NOW()
      WHERE id=$1
        AND patient_id=$2
        AND status IN ('pending','confirmed')
      RETURNING *`,
    [req.params.id, req.user.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Appointment not found');
  }

  return success(res, 200, 'Appointment cancelled', result.rows[0]);
});

// =======================
// Update Status
// =======================
const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowed = [
    'pending',
    'confirmed',
    'completed',
    'cancelled',
  ];

  if (!allowed.includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const result = await query(
    `UPDATE appointments
        SET status=$1,
            updated_at=NOW()
      WHERE id=$2
      RETURNING *`,
    [status, req.params.id]
  );

  if (!result.rows[0]) {
    throw new ApiError(404, 'Appointment not found');
  }

  return success(res, 200, 'Appointment updated', result.rows[0]);
});

// =======================
// Doctor Today's Appointments
// GET /api/appointments/doctor
// =======================
const currentDoctorAppointments = asyncHandler(async (req, res) => {
  const doctor = await query(
    `SELECT id
     FROM doctors
     WHERE user_id = $1
       AND is_approved = TRUE`,
    [req.user.id]
  );

  if (!doctor.rows[0]) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  const result = await query(
    `SELECT
        a.id AS "appointmentId",
        a.patient_id AS "patientId",
        u.full_name AS "patientName",
        a.reason AS "symptoms",
        a.appointment_time AS "time"
     FROM appointments a
     JOIN users u
       ON u.id = a.patient_id
     WHERE a.doctor_id = $1
       AND a.appointment_date = CURRENT_DATE
       AND a.status IN ('pending','confirmed')
     ORDER BY a.appointment_time ASC`,
    [doctor.rows[0].id]
  );

  return success(res, 200, "Today's appointments", result.rows);
});

// =======================
// Doctor All Appointments
// GET /api/appointments/doctor/:doctorId
// =======================
const doctorAppointments = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
        a.*,
        u.full_name AS patient_name,
        u.phone AS patient_phone
     FROM appointments a
     JOIN users u
       ON u.id = a.patient_id
     WHERE a.doctor_id = $1
     ORDER BY a.appointment_date DESC,
              a.appointment_time DESC`,
    [req.params.doctorId]
  );

  return success(res, 200, "Doctor's appointments", result.rows);
});

module.exports = {
  bookAppointment,
  myAppointments,
  cancelAppointment,
  updateStatus,
  currentDoctorAppointments,
  doctorAppointments,
};