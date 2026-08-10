const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { app, resetDatabase, rollbackDatabase, createPatient } = require('./setup');

describe('Medical records workflow', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await rollbackDatabase();
  });

  test('Patient can upload a medical record and fetch it', async () => {
    const patient = await createPatient();

    const testFilePath = path.join(__dirname, 'fixtures', 'sample-report.pdf');
    fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
    fs.writeFileSync(testFilePath, 'Sample medical report');

    const uploadRes = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${patient.token}`)
      .attach('file', testFilePath)
      .field('title', 'Test Report')
      .field('recordType', 'Lab Report')
      .field('description', 'Sample PDF upload')
      .field('doctorNotes', 'Test note');

    expect(uploadRes.statusCode).toBe(201);
    expect(uploadRes.body.data.title).toBe('Test Report');

    const listRes = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${patient.token}`);

    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
