const request = require('supertest');
const { app, resetDatabase, rollbackDatabase, loginAdmin, createPatient } = require('./setup');

async function createDoctorWithAdmin(adminToken) {
  const doctorEmail = `bookdoctor-${Date.now()}@healthai.test`;
  const doctorPassword = 'Doctor@123';
  const doctor = await request(app)
    .post('/api/admin/doctors')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      fullName: 'Book Doctor',
      email: doctorEmail,
      password: doctorPassword,
      phone: '0987654321',
      specialization: 'General Medicine',
      qualification: 'MBBS',
      experience: 3,
      consultationFee: 100,
      bio: 'Booking doctor',
    });

  return { doctorEmail, doctorPassword, doctorId: doctor.body.data.id };
}

describe('Appointment workflow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('Patient can book, cancel, and doctor can complete appointment', async () => {
    const admin = await loginAdmin();
    const patient = await createPatient();
    const doctor = await createDoctorWithAdmin(admin.accessToken);

    const patientLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: patient.email, password: patient.password });

    expect(patientLogin.statusCode).toBe(200);
    const apptCreate = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientLogin.body.data.accessToken}`)
      .send({
        doctorId: doctor.doctorId,
        appointmentDate: new Date().toISOString().slice(0, 10),
        appointmentTime: '09:00',
        reason: 'Routine check',
      });

    expect(apptCreate.statusCode).toBe(201);

    const appointmentId = apptCreate.body.data.id;

    const cancelRes = await request(app)
      .put(`/api/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${patientLogin.body.data.accessToken}`);

    expect(cancelRes.statusCode).toBe(200);

    const doctorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: doctor.doctorEmail, password: doctor.doctorPassword });

    expect(doctorLogin.statusCode).toBe(200);
    const completeRes = await request(app)
      .put(`/api/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorLogin.body.data.accessToken}`)
      .send({ status: 'completed' });

    expect(completeRes.statusCode).toBe(200);
  });
});
