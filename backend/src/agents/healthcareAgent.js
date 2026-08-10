const { analyzeSymptoms, persistHistory } = require('./symptomAgent');
const { analyzeDisease } = require('./diseaseAgent');
const { suggestMedicine } = require('./medicineAgent');
const { suggestDiet } = require('./dietAgent');
const { suggestExercise } = require('./exerciseAgent');
const { createDraftPrescription } = require('./prescriptionAgent');
const { buildHistorySummary } = require('./historyAgent');
const { evaluateEmergency } = require('./emergencyAgent');
const { buildFollowUp } = require('./followUpAgent');

async function orchestrateHealthcareAnalysis(input, userId) {
  const symptomResult = await analyzeSymptoms(input);
  const diseaseResult = await analyzeDisease(input, symptomResult);
  const medicineResult = await suggestMedicine(input, diseaseResult);
  const dietResult = await suggestDiet(input);
  const exerciseResult = await suggestExercise(input);
  const historyResult = await buildHistorySummary(userId);
  const emergencyResult = evaluateEmergency(input);
  const followUpResult = await buildFollowUp(input, diseaseResult);
  const draftResult = await createDraftPrescription(input, {
    ...diseaseResult,
    medicines: medicineResult.medicines,
    educationSummary: `${dietResult.dietPlan}\n${dietResult.hydrationAdvice}`,
  });

  const analytics = {
    diseasePrediction: diseaseResult.possibleConditions?.[0] ? {
      likelyCondition: diseaseResult.possibleConditions[0].name,
      confidence: diseaseResult.confidenceHint || 'medium',
      explanation: diseaseResult.possibleConditions[0].explanation,
    } : { likelyCondition: 'Needs clinical review', confidence: 'low', explanation: 'Not enough detail for a confident prediction.' },
    symptomClusters: {
      primary: input?.symptoms || 'Symptoms not provided',
      severity: input?.severity || 5,
      duration: input?.duration || 'Not provided',
      notes: 'Grouped from the provided symptom report.',
    },
    recoveryPrediction: {
      outlook: input?.severity >= 8 ? 'Needs urgent medical review' : 'Likely improves with rest and hydration',
      estimatedDays: input?.severity >= 8 ? 1 : input?.severity >= 6 ? 4 : 2,
    },
    seasonalTrends: {
      trend: 'General seasonal illness pattern',
      note: 'This is an educational estimate based on reported symptoms.',
    },
  };

  const result = {
    possibleConditions: diseaseResult.possibleConditions || [],
    confidence: diseaseResult.confidenceHint || 'medium',
    medicineInformation: medicineResult.medicines || [],
    educationalPrescriptionSummary: 'Educational only — not a prescription',
    description: diseaseResult.note || 'Educational-only analysis',
    dietPlan: dietResult.dietPlan,
    drinks: dietResult.hydrationAdvice,
    recommendedRestHours: exerciseResult.recommendedRestHours,
    exerciseAdvice: exerciseResult.exerciseAdvice,
    dos: ['Rest and monitor symptoms', 'Stay hydrated', 'Seek professional care if symptoms worsen'],
    donts: ['Do not rely on this AI output as an actual prescription', 'Do not ignore emergency warning signs'],
    emergencyWarningSigns: followUpResult.emergencyWarningSigns,
    followUpReminder: followUpResult.followUpReminder,
    safetyDisclaimer: followUpResult.safetyDisclaimer,
    urgency: symptomResult.urgency,
    emergency: emergencyResult,
    draft: draftResult.draft,
    history: historyResult.summary,
    analytics,
  };

  if (userId) {
    await persistHistory(userId, input, result);
  }

  return result;
}

module.exports = { orchestrateHealthcareAnalysis };