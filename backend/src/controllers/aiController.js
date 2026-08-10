const { query } = require('../config/db');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const aiService = require('../services/aiService');

// POST /api/ai/symptom-checker
const checkSymptoms = asyncHandler(async (req, res) => {
  const { symptoms,severity } = req.body;
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
  [
    req.user.id,
    symptoms,
    JSON.stringify({ severity }),
  ]
);

  const analysis = await aiService.analyzeSymptoms(symptoms);

  await query(
    `INSERT INTO chat_history (user_id, session_type, role, message, metadata) VALUES ($1,'symptom_checker','assistant',$2,$3)`,
    [req.user.id, analysis.recommendedSpecialist || 'analysis', JSON.stringify(analysis)]
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
