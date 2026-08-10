import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdOutlineSearch, MdStar } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../services/api';
import Card from '../components/UI/Card';
import Skeleton from '../components/UI/Skeleton';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/doctors/specializations').then(({ data }) => setSpecializations(data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get('/doctors', { params: { search, specialization } })
        .then(({ data }) => setDoctors(data.data))
        .catch(() => toast.error('Could not load doctors'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, specialization]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Find a Doctor</h1>
        <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Search by name or filter by specialization.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MdOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-800/40" />
          <input
            className="w-full rounded-xl border border-ink-100 bg-white/80 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50"
            placeholder="Search doctors by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-ink-100 bg-white/80 px-4 py-2.5 text-sm dark:border-white/10 dark:bg-ink-800/50"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        >
          <option value="">All specializations</option>
          {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-40 w-full" />)
          : doctors.length === 0
          ? <p className="text-sm text-ink-800/60 dark:text-ink-50/60 col-span-full">No doctors found.</p>
          : doctors.map((d) => (
              <Link key={d.id} to={`/doctors/${d.id}`}>
                <Card className="h-full transition-transform hover:-translate-y-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-display text-lg font-semibold text-white">
                      {d.full_name?.[0]}
                    </div>
                    <div>
                      <p className="font-medium">Dr. {d.full_name}</p>
                      <p className="text-xs text-brand-600">{d.specialization}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-800/60 dark:text-ink-50/60">
                    <span>{d.experience_years}+ yrs experience</span>
                    <span className="flex items-center gap-1"><MdStar className="text-amber-400" /> {Number(d.rating || 0).toFixed(1)}</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink-900 dark:text-white">
                    {d.consultation_fee > 0 ? `₹${d.consultation_fee} consult` : 'Fee on request'}
                  </p>
                </Card>
              </Link>
            ))}
      </div>
    </div>
  );
}
