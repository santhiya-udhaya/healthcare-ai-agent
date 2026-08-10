const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');

const adminCredentials = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@healthai.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123',
  fullName: 'Test Admin',
};

const schemaPath = path.resolve(__dirname, '../../database/schema.sql');

async function ensureSchema() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
}

let initPromise;

async function ensureAdmin() {
  const hash = await bcrypt.hash(adminCredentials.password, 10);
  await pool.query(
    `INSERT INTO admins (full_name, email, password_hash)
     VALUES ($1,$2,$3)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name`,
    [adminCredentials.fullName, adminCredentials.email, hash]
  );
}

async function initTestDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureSchema();
      await ensureAdmin();
    })();
  }
  return initPromise;
}

async function clearTestData() {
  await initTestDatabase();
  await pool.query('BEGIN');
  await pool.query('DELETE FROM prescriptions');
  await pool.query('DELETE FROM appointments');
  await pool.query('DELETE FROM medical_records');
  await pool.query('DELETE FROM vitals');
  await pool.query('DELETE FROM chat_history');
  await pool.query('DELETE FROM notifications');
  await pool.query('DELETE FROM doctors');
  await pool.query("DELETE FROM users WHERE role != 'admin'");
  await pool.query('COMMIT');
}

async function resetDatabase() {
  await initTestDatabase();
  await clearTestData();
}

async function rollbackDatabase() {
  // No-op in stateless request tests; cleanup happens in resetDatabase
}

async function createPatient() {
  const email = `patient-${Date.now()}@healthai.test`;
  const password = 'Patient@123';

  const response = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Integration Patient',
      email,
      password,
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      bloodGroup: 'O+',
    });

  return { email, password, id: response.body.data.user.id, token: response.body.data.accessToken };
}

async function loginUser(email, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response.body.data;
}

async function loginAdmin() {
  await initTestDatabase();
  return loginUser(adminCredentials.email, adminCredentials.password);
}

module.exports = {
  app,
  pool,
  resetDatabase,
  rollbackDatabase,
  clearTestData,
  createPatient,
  loginUser,
  loginAdmin,
};
