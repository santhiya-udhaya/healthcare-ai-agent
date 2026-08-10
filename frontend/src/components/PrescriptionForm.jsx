import { useState } from 'react';
import Button from './UI/Button';

export default function PrescriptionForm({ patientName }) {
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log('Prescription submitted', { patientName, medication, dosage, instructions });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink-800 dark:text-ink-100">Patient</label>
        <div className="mt-2 rounded-3xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 dark:border-white/10 dark:bg-ink-950/60 dark:text-white">
          {patientName}
        </div>
      </div>

      <div>
        <label htmlFor="medication" className="block text-sm font-medium text-ink-800 dark:text-ink-100">Medication</label>
        <input
          id="medication"
          type="text"
          value={medication}
          onChange={(event) => setMedication(event.target.value)}
          className="mt-2 w-full rounded-3xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-950/60 dark:text-white"
          placeholder="e.g. Amoxicillin 500mg"
        />
      </div>

      <div>
        <label htmlFor="dosage" className="block text-sm font-medium text-ink-800 dark:text-ink-100">Dosage</label>
        <input
          id="dosage"
          type="text"
          value={dosage}
          onChange={(event) => setDosage(event.target.value)}
          className="mt-2 w-full rounded-3xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-950/60 dark:text-white"
          placeholder="e.g. 1 tablet twice daily"
        />
      </div>

      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-ink-800 dark:text-ink-100">Instructions</label>
        <textarea
          id="instructions"
          rows="4"
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          className="mt-2 w-full rounded-3xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-950/60 dark:text-white"
          placeholder="e.g. Take after meals for 7 days"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">Save prescription</Button>
      </div>
    </form>
  );
}
