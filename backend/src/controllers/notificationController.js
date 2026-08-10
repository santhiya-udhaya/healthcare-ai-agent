const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [
    req.user.id,
  ]);
  return success(res, 200, 'Notifications', result.rows);
});

// PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const result = await query(
    'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
    [req.params.id, req.user.id]
  );
  if (!result.rows[0]) throw new ApiError(404, 'Notification not found');
  return success(res, 200, 'Marked as read', result.rows[0]);
});

// PUT /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [req.user.id]);
  return success(res, 200, 'All notifications marked as read');
});

// POST /api/notifications/medicine-reminder
const createMedicineReminder = asyncHandler(async (req, res) => {
  const { title, message, scheduledAt } = req.body;
  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, scheduled_at) VALUES ($1,'medicine',$2,$3,$4) RETURNING *`,
    [req.user.id, title, message, scheduledAt]
  );
  return success(res, 201, 'Medicine reminder scheduled', result.rows[0]);
});

module.exports = { listNotifications, markRead, markAllRead, createMedicineReminder };
