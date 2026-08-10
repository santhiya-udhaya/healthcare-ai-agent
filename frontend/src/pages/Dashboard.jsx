import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler,
} from 'chart.js';
import {
  MdOutlineFavorite, MdOutlineMonitorHeart, MdOutlineBloodtype, MdOutlineScale,
  MdOutlineCalendarMonth, MdOutlineMedication, MdOutlineFolderShared,
} from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../services/api';
import Card from '../components/UI/Card';
import Skeleton from '../components/UI/Skeleton';
import { useAuth } from '../context/AuthContext';

const Line = lazy(() => import('react-chartjs-2').then((mod) => ({ default: mod.Line })));

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const statMeta = [
  { key: 'bmi', label: 'BMI', icon: MdOutlineScale, suffix: '' },
  { key: 'blood_pressure_systolic', label: 'Blood Pressure', icon: MdOutlineBloodtype, suffix: ' sys' },
  { key: 'heart_rate', label: 'Heart Rate', icon: MdOutlineMonitorHeart, suffix: ' bpm' },
  { key: 'sugar_level', label: 'Sugar Level', icon: MdOutlineFavorite, suffix: ' mg/dL' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dash, hist] = await Promise.all([
          api.get('/users/dashboard'),
          api.get('/users/vitals/history'),
        ]);
        setData(dash.data.data);
        setHistory(hist.data.data);
      } catch (err) {
        toast.error('Could not load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = {
    labels: history.map((h) => new Date(h.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Health Score',
        data: history.map((h) => h.health_score),
        borderColor: '#0fa38c',
        backgroundColor: 'rgba(15,163,140,0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">
          Hi {user?.full_name?.split(' ')[0] || 'there'}, here's your health snapshot
        </h1>
        <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Your vitals, appointments, and prescriptions at a glance.</p>
      </div>

      {/* Health score + vitals */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card gradient className="md:col-span-1 flex flex-col justify-between">
          <span className="text-sm text-white/80">Health Score</span>
          {loading ? (
            <Skeleton className="h-10 w-20 bg-white/30" />
          ) : (
            <span className="font-display text-4xl font-semibold">{data?.vitals?.health_score ?? '—'}</span>
          )}
          <span className="text-xs text-white/70">out of 100</span>
        </Card>

        {statMeta.map(({ key, label, icon: Icon, suffix }) => (
          <Card key={key} className="flex items-center gap-4">
            <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-white/5">
              <Icon className="text-xl" />
            </div>
            <div>
              <p className="text-xs text-ink-800/60 dark:text-ink-50/60">{label}</p>
              {loading ? (
                <Skeleton className="mt-1 h-6 w-16" />
              ) : (
                <p className="font-display text-lg font-semibold">
                  {data?.vitals?.[key] ?? '—'}
                  {data?.vitals?.[key] ? suffix : ''}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold">Health Score Trend</h2>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : history.length > 0 ? (
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </Suspense>
          ) : (
            <p className="text-sm text-ink-800/60 dark:text-ink-50/60">No vitals logged yet. Add your first reading from the Records page.</p>
          )}
        </Card>

        {/* Upcoming appointments */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Upcoming Appointments</h2>
            <MdOutlineCalendarMonth className="text-brand-600" />
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : data?.upcomingAppointments?.length ? (
            <ul className="space-y-3">
              {data.upcomingAppointments.map((a) => (
                <li key={a.id} className="rounded-xl border border-ink-100 p-3 text-sm dark:border-white/10">
                  <p className="font-medium">Dr. {a.doctor_name}</p>
                  <p className="text-xs text-ink-800/60 dark:text-ink-50/60">{a.specialization} · {new Date(a.appointment_date).toLocaleDateString()} at {a.appointment_time}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-800/60 dark:text-ink-50/60">No upcoming appointments. <Link to="/doctors" className="text-brand-600 hover:underline">Book one</Link>.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent prescriptions */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Prescriptions</h2>
            <MdOutlineMedication className="text-brand-600" />
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data?.recentPrescriptions?.length ? (
            <ul className="space-y-3">
              {data.recentPrescriptions.map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm dark:border-white/10">
                  <span>{p.diagnosis || 'Prescription'} — Dr. {p.doctor_name}</span>
                  <span className="text-xs text-ink-800/50">{new Date(p.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-800/60 dark:text-ink-50/60">No prescriptions yet.</p>
          )}
        </Card>

        {/* Recent medical records */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent Reports</h2>
            <MdOutlineFolderShared className="text-brand-600" />
          </div>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : data?.recentRecords?.length ? (
            <ul className="space-y-3">
              {data.recentRecords.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm dark:border-white/10">
                  <span>{r.title}</span>
                  <span className="text-xs text-ink-800/50">{new Date(r.record_date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-800/60 dark:text-ink-50/60">No records uploaded yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
