const request = require('supertest');
const { app, resetDatabase, rollbackDatabase, createPatient } = require('./setup');

describe('Patient analytics summary', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('dashboard returns analytics insights for disease, recovery and trends', async () => {
    const patient = await createPatient();

    await request(app)
      .post('/api/ai/symptom-checker')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({
        symptoms: 'Fever, headache, cough and fatigue',
        severity: 4,
        age: 32,
        gender: 'female',
      });

    await request(app)
      .post('/api/users/vitals')
      .set('Authorization', `Bearer ${patient.token}`)
      .send({
        bmi: 24.2,
        bpSystolic: 120,
        bpDiastolic: 80,
        heartRate: 78,
        sugarLevel: 98,
      });

    const res = await request(app)
      .get('/api/users/dashboard')
      .set('Authorization', `Bearer ${patient.token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('analytics');
    expect(res.body.data.analytics).toHaveProperty('diseasePrediction');
    expect(res.body.data.analytics).toHaveProperty('symptomClusters');
    expect(res.body.data.analytics).toHaveProperty('recoveryPrediction');
    expect(res.body.data.analytics).toHaveProperty('seasonalTrends');
  });
});
