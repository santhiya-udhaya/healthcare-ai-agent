const request = require('supertest');
const { app, resetDatabase, rollbackDatabase, createPatient } = require('./setup');

describe('Symptom checker workflow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('Patient can analyze symptoms and get valid JSON response', async () => {
    const patient = await createPatient();

    const res = await request(app)
      .post('/api/ai/symptom-checker')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({
        symptoms: 'I have mild headache and fatigue',
        severity: 3,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('possibleConditions');
    expect(Array.isArray(res.body.data.possibleConditions)).toBe(true);
    expect(res.body.data).toHaveProperty('urgency');
  });
});
