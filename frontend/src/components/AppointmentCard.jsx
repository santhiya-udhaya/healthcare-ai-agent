export default function AppointmentCard({ appointment, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-3xl border p-5 text-left transition ${active ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-ink-200 bg-white hover:border-brand-300 dark:border-white/10 dark:bg-ink-950/60'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-900 dark:text-white">{appointment.patientName}</p>
          <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">{appointment.department}</p>
        </div>
        <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700 dark:bg-white/10 dark:text-ink-100">{appointment.time}</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-ink-600 dark:text-ink-300">
        <span>{appointment.status}</span>
        <span>Consultation</span>
      </div>
    </button>
  );
}
