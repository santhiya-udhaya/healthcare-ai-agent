const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const addReminder = asyncHandler(async (req, res) => {
  const { title, message, reminderTime } = req.body;
  const result = await query(
    `INSERT INTO medicine_reminders (user_id, title, message, reminder_time) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.id, title, message, reminderTime || null]
  );
  return success(res, 201, 'Reminder added', result.rows[0]);
});

const listReminders = asyncHandler(async (req, res) => {
  const result = await query(`SELECT * FROM medicine_reminders WHERE user_id = $1 ORDER BY reminder_time DESC`, [req.user.id]);
  return success(res, 200, 'Reminders', result.rows);
});

const addWater = asyncHandler(async (req, res) => {
  const { amountMl } = req.body;
  const result = await query(`INSERT INTO water_tracking (user_id, amount_ml) VALUES ($1,$2) RETURNING *`, [req.user.id, amountMl || 0]);
  return success(res, 201, 'Water entry added', result.rows[0]);
});

const getWater = asyncHandler(async (req, res) => {
  const result = await query(`SELECT COALESCE(SUM(amount_ml),0) AS total_ml FROM water_tracking WHERE user_id = $1`, [req.user.id]);
  return success(res, 200, 'Water summary', { totalMl: Number(result.rows[0].total_ml || 0) });
});

const addSleep = asyncHandler(async (req, res) => {
  const { hoursSlept } = req.body;
  const result = await query(`INSERT INTO sleep_tracking (user_id, hours_slept) VALUES ($1,$2) RETURNING *`, [req.user.id, hoursSlept || 0]);
  return success(res, 201, 'Sleep entry added', result.rows[0]);
});

const getSleep = asyncHandler(async (req, res) => {
  const result = await query(`SELECT COALESCE(AVG(hours_slept),0) AS avg_hours FROM sleep_tracking WHERE user_id = $1`, [req.user.id]);
  return success(res, 200, 'Sleep summary', { avgHours: Number(result.rows[0].avg_hours || 0) });
});

module.exports = { addReminder, listReminders, addWater, getWater, addSleep, getSleep };