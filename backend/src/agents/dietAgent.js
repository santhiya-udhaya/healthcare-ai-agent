async function suggestDiet(input) {
  return {
    stage: 'diet',
    dietPlan: 'Increase fluids, favor balanced meals, and avoid heavy or processed foods if you feel unwell.',
    hydrationAdvice: 'Drink water regularly and replenish fluids if you have fever, vomiting, or diarrhea.',
  };
}

module.exports = { suggestDiet };