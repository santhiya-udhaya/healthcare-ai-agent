async function analyzeDisease(input, symptomResult) {
  const symptomText = input?.symptoms || '';
  const severity = input?.severity || 5;
  const temperature = input?.temperature;

  const possibleConditions = [];
  if (symptomText.toLowerCase().includes('fever')) possibleConditions.push({ name: 'Possible viral illness', likelihood: 'medium', explanation: 'Fever can be associated with common infections or viral illness.' });
  if (symptomText.toLowerCase().includes('cough')) possibleConditions.push({ name: 'Possible respiratory irritation', likelihood: 'medium', explanation: 'Cough can be caused by respiratory irritation or infection.' });
  if (symptomText.toLowerCase().includes('headache')) possibleConditions.push({ name: 'Possible headache or tension-related symptoms', likelihood: 'medium', explanation: 'Headache can arise from stress, dehydration, or illness.' });
  if (temperature && Number(temperature) >= 38) possibleConditions.push({ name: 'Possible infection with fever', likelihood: 'high', explanation: 'A higher temperature may point toward an active infection or inflammation.' });
  if (possibleConditions.length === 0) possibleConditions.push({ name: 'Condition requires professional evaluation', likelihood: 'low', explanation: 'The symptoms are too general for confident AI triage.' });

  return {
    stage: 'disease',
    possibleConditions,
    confidenceHint: severity >= 8 ? 'high' : 'medium',
    note: 'Educational-only analysis; not a diagnosis.',
    severity,
    symptomResult,
  };
}

module.exports = { analyzeDisease };