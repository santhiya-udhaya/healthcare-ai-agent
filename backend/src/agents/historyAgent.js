const { query } = require('../config/db');

async function buildHistorySummary(userId) {
  if (!userId) return { summary: 'No patient history available.' };
  const res = await query(
    `SELECT diagnosis, medicines, advice, created_at FROM prescriptions WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [userId]
  );
  return {
    stage: 'history',
    summary: res.rows.length ? res.rows.map((row) => `${row.diagnosis || 'History'} @ ${row.created_at}`).join(' | ') : 'No previous prescriptions found.',
  };
}

module.exports = { buildHistorySummary };