const request = require('supertest');
const { app, resetDatabase, createPatient, loginUser } = require('./setup');

describe('Notifications integration', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns notifications for the authenticated patient', async () => {
    const patient = await createPatient();
    const auth = await loginUser(patient.email, 'Patient@123');

    await request(app)
      .post('/api/notifications/medicine-reminder')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({
        title: 'Reminder',
        message: 'Your appointment is tomorrow',
        scheduledAt: new Date().toISOString(),
      })
      .expect(201);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
