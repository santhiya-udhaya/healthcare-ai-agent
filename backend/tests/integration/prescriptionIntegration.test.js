const request = require('supertest');
const { app, resetDatabase, rollbackDatabase, loginAdmin, createPatient } = require('./setup');

async function createDoctorWithAdmin(adminToken) {
  const doctorEmail = `rx-doctor-${Date.now()}@healthai.test`;
  const doctorPassword = 'Doctor@123';
  const res = await request(app)
    .post('/api/admin/doctors')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      fullName: 'Prescription Doctor',
      email: doctorEmail,
      password: doctorPassword,
      phone: '0987654321',
      specialization: 'Internal Medicine',
      qualification: 'MBBS',
      experience: 6,
      consultationFee: 130,
      bio: 'Prescription workflow doctor',
    });

  return { doctorEmail, doctorPassword, doctorId: res.body.data.id };
}

describe('Prescription workflow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('Doctor can approve prescription and patient can retrieve it', async () => {
    const admin = await loginAdmin();
    const patient = await createPatient();
    const doctor = await createDoctorWithAdmin(admin.accessToken);

    const doctorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: doctor.doctorEmail, password: doctor.doctorPassword });

    const approveRes = await request(app)
      .post('/api/prescriptions/approve')
      .set('Authorization', `Bearer ${doctorLogin.body.data.accessToken}`)
      .send({
        patientId: patient.id,
        diagnosis: 'Test illness',
        medicines: [{ name: 'TestMed', dose: '10mg', frequency: 'Once', duration: '5 days' }],
        advice: 'Follow instructions',
        confidenceScore: 80,
        recommendedTests: 'Blood work',
        specialistReferral: 'General Physician',
        isEmergency: false,
      });

    expect(approveRes.statusCode).toBe(201);
    expect(approveRes.body.data.patient_id).toBe(patient.id);

    const patientLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: patient.email, password: patient.password });

    const prescriptionsRes = await request(app)
      .get(`/api/prescriptions/patient/${patient.id}`)
      .set('Authorization', `Bearer ${patientLogin.body.data.accessToken}`);

    expect(prescriptionsRes.statusCode).toBe(200);
    expect(Array.isArray(prescriptionsRes.body.data)).toBe(true);
    expect(prescriptionsRes.body.data.some((p) => p.id === approveRes.body.data.id)).toBe(true);
  });
});
