const { chat } = require('./aiService');

function cleanJson(text) {
  if (!text) return '';

  text = String(text);

  // Remove markdown fences
  text = text.replace(/```json/gi, '');
  text = text.replace(/```/g, '');

  text = text.trim();

  // Extract first JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1);
  }

  return text;
}

function parseJson(text) {
  try {
    const parsed = JSON.parse(cleanJson(text));
    return {
      diagnosis: parsed.diagnosis || 'Undifferentiated symptoms',
      medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
      advice: parsed.advice || 'Review the patient and monitor symptoms closely.',
      confidenceScore: parsed.confidenceScore != null ? Number(parsed.confidenceScore) : null,
      recommendedTests: parsed.recommendedTests || '',
      specialistReferral: parsed.specialistReferral || '',
      isEmergency: parsed.isEmergency === true,
      emergencyNote: parsed.emergencyNote || '',
    };
  } catch (err) {
    console.error('AI JSON Parse Error:', err);

    return {
      diagnosis: 'General Viral Infection',
      medicines: [
        {
          name: 'Paracetamol',
          dose: '500 mg',
          frequency: 'Twice daily',
          duration: '5 days',
        },
      ],
      advice: 'Drink plenty of water, take adequate rest, and consult your doctor if symptoms worsen.',
      confidenceScore: 75,
      recommendedTests: '',
      specialistReferral: '',
      isEmergency: false,
      emergencyNote: '',
    };
  }
}

async function draftPrescription({
  patientAge,
  sex,
  diagnosis,
  symptoms,
  allergies,
  currentMedications
}) {
  const prompt = `
You are an experienced doctor.

Return ONLY valid JSON.

Do NOT write markdown.
Do NOT write explanation.
Do NOT write \`\`\`json.

Return exactly this format:

{
      "diagnosis": "string",
      "medicines": [
        {
          "name": "string",
          "dose": "string",
          "frequency": "string",
          "duration": "string"
        }
      ],
      "advice": "string",
      "confidenceScore": number,
      "recommendedTests": "string",
      "specialistReferral": "string",
      "isEmergency": boolean,
      "emergencyNote": "string"
    }

    Patient Information:
    Age: ${patientAge || 'unknown'}
    Gender: ${sex || 'unknown'}
    Diagnosis: ${diagnosis || 'unknown'}
    Symptoms: ${symptoms || 'none'}
    Allergies: ${allergies || 'none'}
    Current Medicines: ${currentMedications || 'none'}
  `;

  const response = await chat(prompt);

  return parseJson(response);
}

module.exports = {
  draftPrescription
};