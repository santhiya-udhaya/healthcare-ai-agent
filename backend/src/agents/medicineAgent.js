async function suggestMedicine(input, diseaseResult) {
  const severity = input?.severity || 5;
  const needsEmergency = severity >= 8;
  const symptomText = (input?.symptoms || '').toLowerCase();

  const medicineExamples = [];
  if (symptomText.includes('fever') || symptomText.includes('headache')) {
    medicineExamples.push({ name: 'Paracetamol', dose: '500 mg', frequency: 'Every 6 hours as needed', duration: 'Short course only with clinician review', educationalOnly: true });
  }
  if (symptomText.includes('cough')) {
    medicineExamples.push({ name: 'Hydration and symptom relief', dose: 'As advised', frequency: 'Regular', duration: 'Until symptoms improve', educationalOnly: true });
  }
  if (medicineExamples.length === 0) {
    medicineExamples.push({ name: 'Educational example only', dose: 'Not for actual use without clinician review', frequency: 'As directed by a qualified doctor', duration: 'Consult a professional', educationalOnly: true });
  }

  return {
    stage: 'medicine',
    medicines: medicineExamples,
    warning: needsEmergency ? 'Seek urgent medical care if symptoms are severe or worsening.' : 'This is educational-only information and not a prescription.',
    diseaseResult,
  };
}

module.exports = { suggestMedicine };