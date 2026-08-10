import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdOutlineEventBusy } from 'react-icons/md';
import api from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Skeleton from '../components/UI/Skeleton';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-brand-100 text-brand-700',
  completed: 'bg-ink-100 text-ink-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/appointments/me').then(({ data }) => setAppointments(data.data)).catch(() => toast.error('Could not load appointments')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancel = async (id) => {
    try {
      await api.put(`/appointments/${id}/cancel`);
      toast.success('Appointment cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel appointment');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">My Appointments</h1>
        <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Track upcoming visits and your appointment history.</p>
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : appointments.length === 0 ? (
          <Card><p className="text-sm text-ink-800/60 dark:text-ink-50/60">No appointments yet.</p></Card>
        ) : (
          appointments.map((a) => (
            <Card key={a.id} className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="font-medium">Dr. {a.doctor_name} <span className="text-xs font-normal text-brand-600">· {a.specialization}</span></p>
                <p className="text-sm text-ink-800/70 dark:text-ink-50/70">{new Date(a.appointment_date).toLocaleDateString()} at {a.appointment_time}</p>
                {a.reason && <p className="mt-1 text-xs text-ink-800/50">Reason: {a.reason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[a.status]}`}>{a.status}</span>
                {['pending', 'confirmed'].includes(a.status) && (
                  <Button variant="danger" onClick={() => handleCancel(a.id)}>
                    <MdOutlineEventBusy /> Cancel
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
