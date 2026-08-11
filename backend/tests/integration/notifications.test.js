const request = require('supertest');
const { app, pool, resetDatabase, createPatient, loginUser } = require('./setup');
const { processDueMedicineReminders } = require('../../src/services/reminderService');

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

  it('creates a notification and deactivates a due medicine reminder', async () => {
    const patient = await createPatient();
    const reminderTime = new Date(Date.now() - 60_000).toISOString();

    const reminderResult = await pool.query(
      `INSERT INTO medicine_reminders (user_id, title, message, reminder_time, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [patient.id, 'Take morning medicine', 'Take your pills now', reminderTime]
    );

    const processedCount = await processDueMedicineReminders();

    expect(processedCount).toBe(1);

    const reminderRow = await pool.query(
      'SELECT is_active FROM medicine_reminders WHERE id = $1',
      [reminderResult.rows[0].id]
    );

    expect(reminderRow.rows[0].is_active).toBe(false);

    const notificationResult = await pool.query(
      `SELECT title, message, type, user_id
       FROM notifications
       WHERE user_id = $1 AND title = $2`,
      [patient.id, 'Take morning medicine']
    );

    expect(notificationResult.rows.length).toBeGreaterThan(0);
    expect(notificationResult.rows[0].type).toBe('medicine');
  });
});
