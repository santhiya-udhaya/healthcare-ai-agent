const request = require('supertest');
const { app, resetDatabase, rollbackDatabase, createPatient } = require('./setup');

describe('Vitals workflow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('Patient can save vitals and retrieve them via dashboard endpoint', async () => {
    const patient = await createPatient();

    const saveRes = await request(app)
      .post('/api/vitals')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({
        bmi: 24,
        blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80,
        heart_rate: 72,
        sugar_level: 95,
        health_score: 90,
      });

    expect(saveRes.statusCode).toBe(201);
    expect(saveRes.body.data).toHaveProperty('id');

    const meRes = await request(app)
      .get('/api/vitals/me')
      .set('Authorization', `Bearer ${patient.token}`);

    expect(meRes.statusCode).toBe(200);
    expect(Number(meRes.body.data.bmi)).toBeCloseTo(24, 2);
  });
});
