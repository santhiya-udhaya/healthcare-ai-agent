const request = require('supertest');
const { app, pool, resetDatabase, rollbackDatabase } = require('./setup');

describe('Authentication workflow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('Patient registration and login', async () => {
    const email = `test-patient-${Date.now()}@healthai.test`;
    const password = 'Patient@123';

    const register = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Test Patient',
        email,
        password,
        phone: '1234567890',
        dateOfBirth: '1990-05-05',
        gender: 'female',
        bloodGroup: 'A+',
      });

    expect(register.statusCode).toBe(201);
    expect(register.body.data).toHaveProperty('accessToken');
    expect(register.body.data).toHaveProperty('refreshToken');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(login.statusCode).toBe(200);
    expect(login.body.data.user.email).toBe(email);
    expect(login.body.data.accessToken).toBeTruthy();
    expect(login.body.data.refreshToken).toBeTruthy();

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken });

    expect(refresh.statusCode).toBe(200);
    expect(refresh.body.data.accessToken).toBeTruthy();
  });

  test('Admin login and invalid JWT handling', async () => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@healthai.com';
    const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'Admin@123';

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    expect(login.statusCode).toBe(200);
    expect(login.body.data.user.role).toBe('admin');

    const invalid = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');

    expect(invalid.statusCode).toBe(401);
    expect(invalid.body.message).toMatch(/invalid or expired/i);
  });

  test('Unauthorized access returns 401', async () => {
    const res = await request(app).get('/api/users/dashboard');
    expect(res.statusCode).toBe(401);
  });
});
