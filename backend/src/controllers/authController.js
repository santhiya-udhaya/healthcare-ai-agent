const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool, query } = require('../config/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { sendEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const {
  fullName,
  email,
  password,
  phone,
  dateOfBirth,
  gender,
  bloodGroup,
} = req.body;

  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) throw new ApiError(409, 'An account with this email already exists');

  const hash = await bcrypt.hash(password, 12);
 const result = await query(
  `INSERT INTO users
  (
    full_name,
    email,
    password_hash,
    phone,
    date_of_birth,
    gender,
    blood_group
  )
  VALUES
  ($1,$2,$3,$4,$5,$6,$7)
  RETURNING
  id,
  full_name,
  email,
  phone,
  date_of_birth,
  gender,
  blood_group,
  role,
  created_at`,
  [
    fullName,
    email,
    hash,
    phone || null,
    dateOfBirth,
    gender,
    bloodGroup,
  ]
);

const user = result.rows[0];

const accessToken = generateAccessToken({
  id: user.id,
  role: "patient",
  email: user.email,
});

const refreshToken = generateRefreshToken({
  id: user.id,
  role: "patient",
});

await query(
  "UPDATE users SET refresh_token = $1 WHERE id = $2",
  [refreshToken, user.id]
);

return success(res, 201, "Account created successfully", {
  user,
  accessToken,
  refreshToken,
});
  
});
// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
  let user = userResult.rows[0];
  let isAdminSource = false;

  if (!user) {
    const adminResult = await query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = adminResult.rows[0];
    if (!admin) throw new ApiError(401, 'Invalid email or password');

    const matchAdmin = await bcrypt.compare(password, admin.password_hash);
    if (!matchAdmin) throw new ApiError(401, 'Invalid email or password');

    const syncResult = await query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 'admin', TRUE, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'admin', is_active = TRUE, updated_at = NOW()
       RETURNING *`,
      [admin.full_name || email, admin.email, admin.password_hash]
    );

    user = syncResult.rows[0];
    isAdminSource = true;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new ApiError(401, 'Invalid email or password');
  if (!user.is_active) throw new ApiError(403, 'This account has been deactivated');

  const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
  const refreshToken = generateRefreshToken({ id: user.id, role: user.role });
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

  delete user.password_hash;
  delete user.refresh_token;

  if (isAdminSource) user.role = 'admin';
  return success(res, 200, 'Login successful', { user, accessToken, refreshToken });
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'refreshToken is required');

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const result = await query('SELECT id, role, email, refresh_token FROM users WHERE id = $1', [decoded.id]);
  const user = result.rows[0];
  if (!user || user.refresh_token !== refreshToken) throw new ApiError(401, 'Refresh token mismatch');

  const accessToken = generateAccessToken({ id: user.id, role: user.role, email: user.email });
  return success(res, 200, 'Token refreshed', { accessToken });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.id]);
  return success(res, 200, 'Logged out successfully');
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await query('SELECT id, full_name FROM users WHERE email = $1', [email]);
  const user = result.rows[0];

  // Always respond the same way to avoid leaking which emails are registered
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await query('UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3', [
      token,
      expiry,
      user.id,
    ]);
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Reset your AI Healthcare Agent password',
      html: `<p>Hi ${user.full_name},</p><p>Click below to reset your password (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  }
  return success(res, 200, 'If that email is registered, a reset link has been sent');
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const result = await query(
    'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
    [token]
  );
  const user = result.rows[0];
  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

  const hash = await bcrypt.hash(newPassword, 12);
  await query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
    [hash, user.id]
  );
  return success(res, 200, 'Password reset successfully. You can now log in.');
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, full_name, email, phone, date_of_birth, gender, blood_group, avatar_url, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!result.rows[0]) throw new ApiError(404, 'User not found');
  return success(res, 200, 'Current user', result.rows[0]);
});

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, me };
