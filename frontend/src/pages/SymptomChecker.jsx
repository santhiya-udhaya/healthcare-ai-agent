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
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!symptoms.trim()) {
    return toast.error("Please describe your symptoms");
  }

  setLoading(true);
  setResult(null);

  try {
    const { data } = await api.post("/ai/symptom-checker", {
      symptoms,
      severity,
    });

    setResult(data.data);

  } catch (err) {
    toast.error(
      err.response?.data?.message || "Could not analyze symptoms"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">AI Symptom Checker</h1>
        <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Describe how you're feeling — the AI will suggest possible causes and next steps.</p>
      </div>
     

      <Card>
        <form onSubmit={handleSubmit} className="space-y-3">

  <textarea
    rows={4}
    value={symptoms}
    onChange={(e) => setSymptoms(e.target.value)}
    placeholder="e.g. Fever for 2 days..."
  />

  <input
    type="number"
    min="1"
    max="10"
    value={severity}
    onChange={(e) => setSeverity(e.target.value)}
    placeholder="Severity (1-10)"
    className="w-full rounded-xl border px-4 py-3"
  />

  <Button type="submit" disabled={loading}>
  <MdOutlineHealthAndSafety />
  {loading ? "Analyzing..." : "Analyze Symptoms"}
</Button>

</form>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="flex items-center gap-3 border-l-4 border-amber-400">
            <MdOutlineWarningAmber className="text-xl text-amber-500 shrink-0" />
            <p className="text-sm text-ink-800/80 dark:text-ink-50/80">{result.disclaimer}</p>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Precautions</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-800/80 dark:text-ink-50/80">
                {result.precautions?.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </Card>
            <Card>
              <h2 className="mb-2 font-display text-lg font-semibold">Recommended specialist</h2>
              <p className="text-sm text-ink-800/80 dark:text-ink-50/80">{result.recommendedSpecialist}</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
