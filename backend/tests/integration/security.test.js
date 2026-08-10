const request = require('supertest');
const { app, resetDatabase, rollbackDatabase, createPatient, loginAdmin } = require('./setup');

describe('Security and validation', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('Forbidden access returns 403 for non-admin route', async () => {
    const patient = await createPatient();

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${patient.token}`);

    expect(res.statusCode).toBe(403);
  });

  test('Missing token returns 401', async () => {
    const res = await request(app).get('/api/vitals/me');
    expect(res.statusCode).toBe(401);
  });

  test('Input validation returns 400 for bad appointment payload', async () => {
    const patient = await createPatient();
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({ doctorId: 'not-a-uuid', appointmentDate: 'not-a-date' });

    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.statusCode).toBeLessThan(500);
  });
});
