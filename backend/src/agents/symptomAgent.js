const { query } = require('../config/db');

async function analyzeSymptoms(input) {
  const {
    name = '',
    symptoms = '',
    duration = '',
    severity = 5,
    age,
    gender,
    weight,
    height,
    temperature,
    existingDiseases = '',
    allergies = '',
    currentMedicines = '',
    pregnancy = '',
    lifestyle = '',
    waterIntake = '',
    sleepHours = '',
  } = input || {};

  const details = [
    `Name: ${name || 'unknown'}`,
    `Symptoms: ${symptoms}`,
    `Duration: ${duration || 'unknown'}`,
    `Severity: ${severity}`,
    `Age: ${age || 'unknown'}`,
    `Gender: ${gender || 'unknown'}`,
    `Weight: ${weight || 'unknown'}`,
    `Height: ${height || 'unknown'}`,
    `Temperature: ${temperature || 'unknown'}`,
    `Existing Diseases: ${existingDiseases || 'none'}`,
    `Allergies: ${allergies || 'none'}`,
    `Current Medicines: ${currentMedicines || 'none'}`,
    `Pregnancy: ${pregnancy || 'unknown'}`,
    `Lifestyle: ${lifestyle || 'unknown'}`,
    `Water Intake: ${waterIntake || 'unknown'}`,
    `Sleep Hours: ${sleepHours || 'unknown'}`,
  ].join('\n');

  return {
    stage: 'symptom',
    summary: details,
    urgency: severity >= 8 ? 'seek-emergency-care' : severity >= 6 ? 'see-doctor-soon' : 'self-care',
  };
}

async function persistHistory(userId, input, result) {
  if (!userId) return;
  await query(
    `INSERT INTO symptom_history (user_id, symptoms, severity, age, gender, weight, height, existing_diseases, allergies, current_medicines, pregnancy, lifestyle, water_intake, sleep_hours, result_summary, urgency, duration, temperature)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      userId,
      input?.symptoms || '',
      input?.severity || 5,
      input?.age || null,
      input?.gender || null,
      input?.weight || null,
      input?.height || null,
      input?.existingDiseases || null,
      input?.allergies || null,
      input?.currentMedicines || null,
      input?.pregnancy || null,
      input?.lifestyle || null,
      input?.waterIntake || null,
      input?.sleepHours || null,
      JSON.stringify(result || {}),
      result?.urgency || null,
      input?.duration || null,
      input?.temperature || null,
    ]
  );
}

module.exports = { analyzeSymptoms, persistHistory };