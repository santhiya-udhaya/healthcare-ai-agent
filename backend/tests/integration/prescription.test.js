const request = require('supertest');
const app = require('../../src/app');

const DOCTOR_EMAIL = `doctor-${Date.now()}@healthai.test`;
const DOCTOR_PASSWORD = 'Doctor@123';
const PATIENT_EMAIL = `patient-${Date.now()}@healthai.test`;
const PATIENT_PASSWORD = 'Patient@123';

describe('Patient -> Prescription integration', () => {
  let token;
  let patientId;

  beforeAll(async () => {
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.TEST_ADMIN_EMAIL || 'admin@healthai.com', password: process.env.TEST_ADMIN_PASSWORD || 'Admin@123' });
    expect(adminRes.statusCode).toBe(200);

    const createDoctorRes = await request(app)
      .post('/api/admin/doctors')
      .set('Authorization', `Bearer ${adminRes.body.data.accessToken}`)
      .send({
        fullName: 'Integration Doctor',
        email: DOCTOR_EMAIL,
        password: DOCTOR_PASSWORD,
        phone: '0987654321',
        specialization: 'Testology',
        qualification: 'MBBS',
        experience: 5,
        consultationFee: 100,
        bio: 'Test doctor account',
      });
    expect(createDoctorRes.statusCode).toBe(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: DOCTOR_EMAIL, password: DOCTOR_PASSWORD });

    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.data.accessToken;
    expect(token).toBeTruthy();

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Integration Patient',
        email: PATIENT_EMAIL,
        password: PATIENT_PASSWORD,
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'female',
        bloodGroup: 'O+',
      });
    expect(registerRes.statusCode).toBe(201);
    patientId = registerRes.body.data.user.id;
  }, 20000);

  test('Doctor can create a manual prescription for a patient', async () => {
    const payload = {
      patientId,
      diagnosis: 'Integration test diagnosis',
      medicines: [{ name: 'TestMed', dose: '10mg', frequency: 'Once', duration: '3 days' }],
      advice: 'Take rest',
      confidenceScore: 90,
    };

    const res = await request(app)
      .post('/api/prescriptions/approve')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.patient_id).toBe(patientId);
  }, 20000);
});
