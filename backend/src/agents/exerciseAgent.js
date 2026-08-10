async function suggestExercise(input) {
  const severity = input?.severity || 5;
  return {
    stage: 'exercise',
    exerciseAdvice: severity >= 8
      ? 'Avoid exertion and seek urgent medical care if you have severe symptoms.'
      : 'Rest and light movement are preferable if you feel unwell; avoid intense exercise until symptoms improve.',
    recommendedRestHours: severity >= 8 ? 12 : severity >= 6 ? 8 : 6,
  };
}

module.exports = { suggestExercise };