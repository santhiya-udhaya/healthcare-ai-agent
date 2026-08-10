import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MdOutlineSearch, MdOutlineCalendarToday, MdOutlineDownload } from 'react-icons/md';
import api from '../services/api';
import Card from '../components/UI/Card';
import Input from '../components/UI/Input';
import Button from '../components/UI/Button';
import Skeleton from '../components/UI/Skeleton';

const FILTERS = ['all', 'completed', 'cancelled', 'pending'];

export default function MedicalHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients/history');
      setHistory(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load medical history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const matcher = search.trim().toLowerCase();
      const matchesSearch = matcher === '' || [
        item.doctor_name,
        item.specialization,
        item.diagnosis,
      ].some((value) => value?.toLowerCase().includes(matcher));
      const matchesFilter = filter === 'all' || item.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [history, search, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Medical History</h1>
        <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Review past appointments, prescriptions, and doctor visits.</p>
      </div>

      <Card className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-2 rounded-xl border border-ink-100 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-ink-900/60">
          <MdOutlineSearch className="text-xl text-ink-500" />
          <Input
            className="border-none bg-transparent px-0 text-sm placeholder:text-ink-500 focus:ring-0"
            placeholder="Search by doctor, diagnosis or date"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((value) => (
            <Button
              key={value}
              variant={filter === value ? 'primary' : 'secondary'}
              onClick={() => setFilter(value)}
            >
              {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card><p className="text-sm text-ink-800/60 dark:text-ink-50/60">No history records match your search.</p></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <Card key={`${item.appointment_date}-${item.appointment_time}-${item.doctor_name}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-500 dark:text-ink-300">{new Date(item.appointment_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <h2 className="mt-2 text-xl font-semibold">Dr. {item.doctor_name}</h2>
                  <p className="text-sm text-ink-700 dark:text-ink-200">{item.specialization}</p>
                </div>
                <div className="flex flex-col gap-2 text-right">
                  <span className="text-xs uppercase tracking-[0.2em] text-ink-500 dark:text-ink-300">{item.status || 'Completed'}</span>
                  <p className="text-sm text-ink-700 dark:text-ink-200">{item.appointment_time}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">Diagnosis</p>
                  <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">{item.diagnosis || 'No diagnosis recorded'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">Advice</p>
                  <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">{item.advice || 'No advice recorded'}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-ink-900 dark:text-white">Medicines</p>
                {Array.isArray(item.medicines) && item.medicines.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm text-ink-700 dark:text-ink-200">
                    {item.medicines.map((medicine, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-brand-600" />
                        <span>{medicine.name}{medicine.dosage ? ` — ${medicine.dosage}` : ''}{medicine.timing ? `, ${medicine.timing}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">No medicines recorded.</p>
                )}
              </div>

              {item.pdf_url && (
                <div className="mt-6 flex items-center gap-3">
                  <a href={item.pdf_url} target="_blank" rel="noreferrer">
                    <Button variant="secondary"><MdOutlineDownload /> Download PDF</Button>
                  </a>
                  <span className="text-sm text-ink-500 dark:text-ink-400">View prescription summary</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
