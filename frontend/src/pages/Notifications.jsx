import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MdOutlineNotificationsActive, MdOutlineDoneAll } from 'react-icons/md';
import api from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Skeleton from '../components/UI/Skeleton';

const TYPE_COLOR = {
  appointment: 'bg-brand-100 text-brand-700',
  medicine: 'bg-amber-100 text-amber-700',
  system: 'bg-ink-100 text-ink-700',
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/notifications').then(({ data }) => setItems(data.data)).catch(() => toast.error('Could not load notifications')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      toast.error('Could not update notification');
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      toast.error('Could not update notifications');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Appointment and medicine reminders, plus system updates.</p>
        </div>
        {items.some((n) => !n.is_read) && (
          <Button variant="outline" onClick={markAllRead}><MdOutlineDoneAll /> Mark all read</Button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : items.length === 0 ? (
          <Card><p className="text-sm text-ink-800/60 dark:text-ink-50/60">You're all caught up.</p></Card>
        ) : (
          items.map((n) => (
            <Card key={n.id} className={`flex items-start justify-between gap-3 ${!n.is_read ? 'border-l-4 border-brand-500' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-white/5"><MdOutlineNotificationsActive /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${TYPE_COLOR[n.type] || 'bg-ink-100'}`}>{n.type}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-800/70 dark:text-ink-50/70">{n.message}</p>
                  <p className="mt-1 text-xs text-ink-800/50">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
              {!n.is_read && <Button variant="ghost" onClick={() => markRead(n.id)}>Mark read</Button>}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
