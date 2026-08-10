const request = require('supertest');
const { app, resetDatabase, loginAdmin } = require('./setup');

describe('Admin integration', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('returns the admin dashboard for an admin user', async () => {
    const admin = await loginAdmin();

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totals');
    expect(res.body.data).toHaveProperty('appointmentsByStatus');
    expect(res.body.data).toHaveProperty('signupsByMonth');
  });
});
