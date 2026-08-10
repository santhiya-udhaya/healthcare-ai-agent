/**
 * aiService.js
 * Google Gemini (@google/genai) + OpenAI fallback
 */

const { GoogleGenAI } = require("@google/genai");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const ai = GEMINI_KEY && GEMINI_KEY !== "your_gemini_api_key"
  ? new GoogleGenAI({ apiKey: GEMINI_KEY })
  : null;

const SAFETY_DISCLAIMER =
  "This is an AI-generated suggestion, not a medical diagnosis. Please consult a licensed doctor for confirmation and treatment. In an emergency, call your local emergency number immediately.";

const SYMPTOM_SYSTEM_PROMPT = `You are a careful medical triage assistant embedded in a healthcare app.
Given a patient's symptoms and severity (1-10),
consider the severity while deciding urgency.

Severity Guide:
1-3 = Mild
4-6 = Moderate
7-8 = High
9-10 = Critical

If severity is 9 or 10, urgency should normally be "seek-emergency-care" unless the symptoms clearly indicate otherwise.

Respond ONLY with JSON., respond ONLY with strict JSON (no markdown fences) in this shape:
{
  "possibleConditions": [{"name": string, "likelihood": "low"|"medium"|"high", "explanation": string}],
  "precautions": [string],
  "recommendedSpecialist": string,
  "urgency": "self-care"|"see-doctor-soon"|"seek-emergency-care",
  "disclaimer": string
}
Never state a definitive diagnosis. Keep explanations short and plain-language. If symptoms suggest a medical
emergency (e.g. chest pain, stroke signs, severe bleeding), set urgency to "seek-emergency-care".`;

const CHATBOT_SYSTEM_PROMPT = `You are a friendly, knowledgeable medical assistant chatbot inside a healthcare app.
You can discuss general medical FAQs, lifestyle, diet, exercise, and medicine-reminder suggestions.
You must NOT diagnose, prescribe specific drug dosages, or replace a doctor.
Keep answers concise, warm, and practical.
If the user describes something urgent, advise them to seek immediate medical care.`;

async function callGemini(systemPrompt, userMessage) {
  if (!ai) throw new Error('Gemini client is not configured');

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `${systemPrompt}\n\nUser: ${userMessage}`,
      config: {
        temperature: 0.4,
      },
    });

    // Ensure we always return a string
    if (!response || typeof response.text !== 'string') return String(response?.text || JSON.stringify(response));
    return response.text;
  } catch (err) {
    console.error('Gemini SDK Error:', err);
    throw new Error(`Gemini SDK Error: ${err.message}`);
  }
}

async function callOpenAI(systemPrompt, userMessage, jsonMode) {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      temperature: 0.4,
      ...(jsonMode && {
        response_format: {
          type: "json_object",
        },
      }),
    }),
  });

  if (!resp.ok) {
    throw new Error(`OpenAI API error: ${resp.status} ${await resp.text()}`);
  }

  const data = await resp.json();

  // Some OpenAI responses can be objects; ensure we return a string
  const content = data.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  return JSON.stringify(content);
}

async function askAI(systemPrompt, userMessage, { jsonMode = false } = {}) {
  // Try Gemini first if configured, otherwise OpenAI fallback. Wrap calls and add provider info in errors.
  if (GEMINI_KEY && GEMINI_KEY !== "your_gemini_api_key") {
    try {
      return await callGemini(systemPrompt, userMessage);
    } catch (err) {
      console.error('Gemini call failed, falling back to OpenAI:', err.message);
      // fallthrough to OpenAI
    }
  }

  if (OPENAI_KEY && OPENAI_KEY !== "your_openai_api_key") {
    try {
      return await callOpenAI(systemPrompt, userMessage, jsonMode);
    } catch (err) {
      console.error('OpenAI call failed:', err);
      throw err;
    }
  }

  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return JSON.stringify({
      possibleConditions: [
        { name: 'Tension headache', likelihood: 'medium', explanation: 'Common with stress and mild headache symptoms.' },
      ],
      precautions: ['Stay hydrated', 'Take rest'],
      recommendedSpecialist: 'General Physician',
      urgency: 'self-care',
      disclaimer: SAFETY_DISCLAIMER,
    });
  }

  throw Object.assign(
    new Error(
      "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env"
    ),
    {
      statusCode: 503,
    }
  );
}

async function analyzeSymptoms(symptomText,severity) {
const prompt = `
Patient Symptoms:
${symptomText}

Severity (1-10):
${severity}

Analyze the patient's symptoms considering the severity level.
If severity is 8-10, treat it as high priority.
If severity is 5-7, recommend seeing a doctor soon.
If severity is 1-4, suggest self-care if appropriate.

Return JSON only.
`;

const raw = await askAI(
  SYMPTOM_SYSTEM_PROMPT,
  prompt,
  {
    jsonMode: true,
  }
);

  let parsed;

  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    parsed = {
      possibleConditions: [],
      precautions: [],
      recommendedSpecialist: "General Physician",
      urgency: "see-doctor-soon",
      disclaimer: SAFETY_DISCLAIMER,
      raw,
    };
  }

  if (!parsed.disclaimer) {
    parsed.disclaimer = SAFETY_DISCLAIMER;
  }

  return parsed;
}

async function chat(userMessage) {
  return await askAI(CHATBOT_SYSTEM_PROMPT, userMessage);
}

module.exports = {
  analyzeSymptoms,
  chat,
  SAFETY_DISCLAIMER,
};