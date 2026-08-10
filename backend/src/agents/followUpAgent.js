async function buildFollowUp(input, combinedResult) {
  return {
    stage: 'follow-up',
    followUpReminder: 'Follow up with a clinician if symptoms persist, worsen, or if you develop new warning signs.',
    emergencyWarningSigns: [
      'Chest pain',
      'Difficulty breathing',
      'Fainting or loss of consciousness',
      'Severe allergic reaction',
      'Severe abdominal pain',
    ],
    safetyDisclaimer: 'This educational summary is not a prescription and not a diagnosis. Please consult a licensed clinician for confirmation.',
  };
}

module.exports = { buildFollowUp };