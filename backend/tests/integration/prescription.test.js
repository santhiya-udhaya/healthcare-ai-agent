const request = require('supertest');
const app = require('../../src/app');

// These credentials are the test doctor account used earlier in manual testing
const DOCTOR_EMAIL = process.env.TEST_DOCTOR_EMAIL || 'arjun.patel@example.com';
const DOCTOR_PASSWORD = process.env.TEST_DOCTOR_PASSWORD || 'Doctor@123';
const PATIENT_ID = process.env.TEST_PATIENT_ID || '7f0e980f-c213-44e8-a94c-20ff185cb352';

describe('Patient -> Prescription integration', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD });

    expect(res.statusCode).toBe(200);
    token = res.body.data.accessToken;
    expect(token).toBeTruthy();
  }, 20000);

  test('Doctor can create a manual prescription for a patient', async () => {
    const payload = {
      patientId: PATIENT_ID,
      diagnosis: 'Integration test diagnosis',
      medicines: [{ name: 'TestMed', dose: '10mg', frequency: 'Once', duration: '3 days' }],
      advice: 'Take rest',
      confidenceScore: 90
    };

    const res = await request(app)
      .post('/api/prescriptions/approve')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.patient_id).toBe(PATIENT_ID);
  }, 20000);
});
