const request = require('supertest');
const { app, resetDatabase, rollbackDatabase, loginAdmin, createPatient } = require('./setup');

describe('Doctor workflow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('Admin can create and approve doctor and doctor can view dashboard', async () => {
    const admin = await loginAdmin();
    const doctorEmail = `doctor-${Date.now()}@healthai.test`;
    const doctorPassword = 'Doctor@123';

    const createRes = await request(app)
      .post('/api/admin/doctors')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({
        fullName: 'Workflow Doctor',
        email: doctorEmail,
        password: doctorPassword,
        phone: '0987654321',
        specialization: 'Cardiology',
        qualification: 'MBBS',
        experience: 5,
        consultationFee: 150,
        bio: 'Cardiology expert',
      });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body.data).toHaveProperty('id');
    expect(createRes.body.data.email).toBe(doctorEmail);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: doctorEmail, password: doctorPassword });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.data.user.role).toBe('doctor');

    const apptRes = await request(app)
      .get('/api/appointments/doctor')
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);

    expect(apptRes.statusCode).toBe(200);
    expect(Array.isArray(apptRes.body.data)).toBe(true);
  });
});
