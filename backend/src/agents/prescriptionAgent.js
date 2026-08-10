async function createDraftPrescription(input, combinedResult) {
  return {
    stage: 'prescription',
    draft: {
      educationalOnly: true,
      message: 'This is an AI-generated educational draft only. It is not a final prescription.',
      diagnosis: combinedResult?.possibleConditions?.[0]?.name || 'Review needed',
      medicines: combinedResult?.medicines || [],
      advice: combinedResult?.educationSummary || 'Follow up with a qualified clinician.',
    },
  };
}

module.exports = { createDraftPrescription };