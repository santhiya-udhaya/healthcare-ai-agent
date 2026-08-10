import { useState } from 'react';
import toast from 'react-hot-toast';
import { MdOutlineHealthAndSafety, MdOutlineWarningAmber } from 'react-icons/md';
import api from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const URGENCY_STYLE = {
  'self-care': 'bg-brand-100 text-brand-700',
  'see-doctor-soon': 'bg-amber-100 text-amber-700',
  'seek-emergency-care': 'bg-red-100 text-red-700',
};

export default function SymptomChecker() {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    weight: '',
    height: '',
    symptoms: '',
    duration: '',
    severity: '',
    temperature: '',
    existingDiseases: '',
    allergies: '',
    currentMedicines: '',
    pregnancy: '',
    lifestyle: '',
    waterIntake: '',
    sleepHours: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.symptoms.trim()) {
      return toast.error('Please describe your symptoms');
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await api.post('/ai/symptom-checker', {
        ...form,
        severity: Number(form.severity || 5),
        age: form.age ? Number(form.age) : null,
        weight: form.weight ? Number(form.weight) : null,
        height: form.height ? Number(form.height) : null,
        temperature: form.temperature ? Number(form.temperature) : null,
        sleepHours: form.sleepHours ? Number(form.sleepHours) : null,
      });
      setResult(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not analyze symptoms');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">AI Symptom Checker</h1>
        <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Share a few details so the AI can provide educational guidance and highlight urgency safely.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <input className="rounded-xl border px-4 py-3" name="name" value={form.name} onChange={handleChange} placeholder="Name" />
          <input className="rounded-xl border px-4 py-3" name="age" type="number" value={form.age} onChange={handleChange} placeholder="Age" />
          <input className="rounded-xl border px-4 py-3" name="gender" value={form.gender} onChange={handleChange} placeholder="Gender" />
          <input className="rounded-xl border px-4 py-3" name="weight" type="number" value={form.weight} onChange={handleChange} placeholder="Weight (kg)" />
          <input className="rounded-xl border px-4 py-3" name="height" type="number" value={form.height} onChange={handleChange} placeholder="Height (cm)" />
          <input className="rounded-xl border px-4 py-3" name="temperature" type="number" value={form.temperature} onChange={handleChange} placeholder="Temperature (°C)" />
          <input className="rounded-xl border px-4 py-3" name="duration" value={form.duration} onChange={handleChange} placeholder="Duration" />
          <input className="rounded-xl border px-4 py-3" name="severity" type="number" min="1" max="10" value={form.severity} onChange={handleChange} placeholder="Severity (1-10)" />
          <textarea className="rounded-xl border px-4 py-3 md:col-span-2" rows={4} name="symptoms" value={form.symptoms} onChange={handleChange} placeholder="Describe your symptoms" />
          <input className="rounded-xl border px-4 py-3" name="existingDiseases" value={form.existingDiseases} onChange={handleChange} placeholder="Existing diseases" />
          <input className="rounded-xl border px-4 py-3" name="allergies" value={form.allergies} onChange={handleChange} placeholder="Allergies" />
          <input className="rounded-xl border px-4 py-3" name="currentMedicines" value={form.currentMedicines} onChange={handleChange} placeholder="Current medicines" />
          <input className="rounded-xl border px-4 py-3" name="pregnancy" value={form.pregnancy} onChange={handleChange} placeholder="Pregnancy / Not applicable" />
          <input className="rounded-xl border px-4 py-3" name="lifestyle" value={form.lifestyle} onChange={handleChange} placeholder="Lifestyle" />
          <input className="rounded-xl border px-4 py-3" name="waterIntake" value={form.waterIntake} onChange={handleChange} placeholder="Water intake" />
          <input className="rounded-xl border px-4 py-3" name="sleepHours" type="number" value={form.sleepHours} onChange={handleChange} placeholder="Sleep hours" />
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              <MdOutlineHealthAndSafety />
              {loading ? 'Analyzing...' : 'Analyze Symptoms'}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="flex items-center gap-3 border-l-4 border-amber-400">
            <MdOutlineWarningAmber className="text-xl text-amber-500 shrink-0" />
            <p className="text-sm text-ink-800/80 dark:text-ink-50/80">{result.safetyDisclaimer || result.disclaimer}</p>
          </Card>

          {result.urgency && (
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${URGENCY_STYLE[result.urgency] || 'bg-ink-100'}`}>
              {result.urgency.replace(/-/g, ' ')}
            </span>
          )}

          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold">Possible conditions</h2>
            {result.possibleConditions?.length ? (
              <ul className="space-y-3">
                {result.possibleConditions.map((c, i) => (
                  <li key={i} className="rounded-xl border border-ink-100 p-3 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{c.name}</p>
                      <span className="text-xs uppercase text-brand-600">{c.likelihood}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-800/70 dark:text-ink-50/70">{c.explanation}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-800/60">No specific conditions identified — consider consulting a doctor if symptoms persist.</p>
            )}
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Educational prescription summary</h2>
              <p className="text-sm text-ink-800/80 dark:text-ink-50/80">{result.educationalPrescriptionSummary || 'Educational only — not a prescription'}</p>
            </Card>
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Description</h2>
              <p className="text-sm text-ink-800/80 dark:text-ink-50/80">{result.description}</p>
            </Card>
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Diet plan</h2>
              <p className="text-sm text-ink-800/80 dark:text-ink-50/80">{result.dietPlan}</p>
            </Card>
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Hydration advice</h2>
              <p className="text-sm text-ink-800/80 dark:text-ink-50/80">{result.drinks}</p>
            </Card>
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Rest / exercise advice</h2>
              <p className="text-sm text-ink-800/80 dark:text-ink-50/80">Rest: {result.recommendedRestHours || '—'} hrs · {result.exerciseAdvice}</p>
            </Card>
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Do / Don&apos;t</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {result.dos?.map((item, idx) => <li key={`do-${idx}`}>{item}</li>)}
                {result.donts?.map((item, idx) => <li key={`dont-${idx}`}>{item}</li>)}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Emergency warning signs</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm">{result.emergencyWarningSigns?.map((item, idx) => <li key={`em-${idx}`}>{item}</li>)}</ul>
            </Card>
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Medicine info</h2>
              <ul className="space-y-2 text-sm">{result.medicineInformation?.map((item, idx) => <li key={`med-${idx}`}>{item.name}</li>)}</ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
