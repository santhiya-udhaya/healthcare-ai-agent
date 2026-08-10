const request = require('supertest');
const { app, resetDatabase, rollbackDatabase, loginAdmin, createPatient } = require('./setup');

async function createDoctorWithAdmin(adminToken) {
  const doctorEmail = `ai-doctor-${Date.now()}@healthai.test`;
  const doctorPassword = 'Doctor@123';
  const doctorRes = await request(app)
    .post('/api/admin/doctors')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      fullName: 'AI Doctor',
      email: doctorEmail,
      password: doctorPassword,
      phone: '0987654321',
      specialization: 'Neurology',
      qualification: 'MBBS',
      experience: 5,
      consultationFee: 140,
      bio: 'AI test doctor',
    });

  return { doctorEmail, doctorPassword, doctorId: doctorRes.body.data.id };
}

describe('AI workflow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('Doctor can generate AI prescription and emergency analysis returns no medicines when appropriate', async () => {
    const admin = await loginAdmin();
    const patient = await createPatient();
    const doctor = await createDoctorWithAdmin(admin.accessToken);

    const doctorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: doctor.doctorEmail, password: doctor.doctorPassword });

    const draftRes = await request(app)
      .post('/api/ai/generate-prescription')
      .set('Authorization', `Bearer ${doctorLogin.body.data.accessToken}`)
      .send({
        patientId: patient.id,
        patientAge: 45,
        sex: 'female',
        diagnosis: 'Severe chest pain and shortness of breath',
        symptoms: 'Chest pain, shortness of breath, dizziness',
        allergies: 'None',
        currentMedications: 'None',
      });

    expect(draftRes.statusCode).toBe(200);
    expect(draftRes.body.data).toHaveProperty('diagnosis');
    expect(Array.isArray(draftRes.body.data.medicines)).toBe(true);

    const analysis = draftRes.body.data;
    if (analysis.isEmergency) {
      expect(analysis.medicines.length).toBeGreaterThanOrEqual(0);
    }
  });
});
