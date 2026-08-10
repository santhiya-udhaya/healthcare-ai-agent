const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const aiService = require('../services/aiService');
const { orchestrateHealthcareAnalysis } = require('../agents/healthcareAgent');

// POST /api/ai/symptom-checker
const checkSymptoms = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const {
    name,
    symptoms,
    duration,
    severity,
    age,
    gender,
    weight,
    height,
    temperature,
    existingDiseases,
    allergies,
    currentMedicines,
    pregnancy,
    lifestyle,
    waterIntake,
    sleepHours,
  } = payload;

  const input = {
    name,
    symptoms,
    duration,
    severity,
    age,
    gender,
    weight,
    height,
    temperature,
    existingDiseases,
    allergies,
    currentMedicines,
    pregnancy,
    lifestyle,
    waterIntake,
    sleepHours,
  };

  await query(
    `INSERT INTO chat_history
    (
      user_id,
      session_type,
      role,
      message,
      metadata
    )
    VALUES
    (
      $1,
      'symptom_checker',
      'user',
      $2,
      $3
    )`,
    [req.user.id, symptoms || '', JSON.stringify(input)]
  );

  const analysis = await orchestrateHealthcareAnalysis(input, req.user.id);

  await query(
    `INSERT INTO chat_history (user_id, session_type, role, message, metadata) VALUES ($1,'symptom_checker','assistant',$2,$3)`,
    [req.user.id, JSON.stringify(analysis), JSON.stringify(analysis)]
  );

  await query(
    `INSERT INTO ai_sessions (user_id, session_type, status, result) VALUES ($1, $2, $3, $4)`,
    [req.user.id, 'symptom_checker', 'completed', JSON.stringify(analysis)]
  );

  return success(res, 200, 'Symptom analysis complete', analysis);
});

// POST /api/ai/chatbot
const chatWithBot = asyncHandler(async (req, res) => {
  const { message } = req.body;

  await query(`INSERT INTO chat_history (user_id, session_type, role, message) VALUES ($1,'chatbot','user',$2)`, [
    req.user.id,
    message,
  ]);

  const reply = await aiService.chat(message);

  await query(`INSERT INTO chat_history (user_id, session_type, role, message) VALUES ($1,'chatbot','assistant',$2)`, [
    req.user.id,
    reply,
  ]);

  return success(res, 200, 'Chatbot reply', { reply });
});

// GET /api/ai/history?type=symptom_checker|chatbot
const chatHistory = asyncHandler(async (req, res) => {
  const { type = 'chatbot' } = req.query;
  const result = await query(
    'SELECT * FROM chat_history WHERE user_id = $1 AND session_type = $2 ORDER BY created_at ASC LIMIT 100',
    [req.user.id, type]
  );
  return success(res, 200, 'Chat history', result.rows);
});

module.exports = { checkSymptoms, chatWithBot, chatHistory };
