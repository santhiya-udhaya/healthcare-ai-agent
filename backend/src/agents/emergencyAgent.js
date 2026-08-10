function evaluateEmergency(input) {
  const symptomText = `${input?.symptoms || ''} ${input?.existingDiseases || ''}`.toLowerCase();
  const emergencyKeywords = [
    'chest pain',
    'difficulty breathing',
    'stroke',
    'severe bleeding',
    'loss of consciousness',
    'severe allergic reaction',
    'low oxygen',
    'severe abdominal pain',
    'pregnancy emergency',
    'suicidal',
    'self-harm',
  ];
  const isHighRisk = emergencyKeywords.some((term) => symptomText.includes(term)) || (input?.severity || 0) >= 9;

  return {
    stage: 'emergency',
    highRisk: isHighRisk,
    recommendation: isHighRisk
      ? 'High risk: seek immediate emergency medical care now.'
      : 'No immediate emergency signs detected based on the provided information.',
  };
}

module.exports = { evaluateEmergency };