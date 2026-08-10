import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

export default function HealthInsights() {
  const [water, setWater] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [reminders, setReminders] = useState([]);
  const [waterInput, setWaterInput] = useState('');
  const [sleepInput, setSleepInput] = useState('');
  const [reminderForm, setReminderForm] = useState({ title: '', message: '', reminderTime: '' });

  const load = async () => {
    try {
      const [waterRes, sleepRes, remindersRes] = await Promise.all([
        api.get('/tracking/water'),
        api.get('/tracking/sleep'),
        api.get('/tracking/reminders'),
      ]);
      setWater(waterRes.data.data.totalMl || 0);
      setSleep(sleepRes.data.data.avgHours || 0);
      setReminders(remindersRes.data.data || []);
    } catch (err) {
      toast.error('Could not load health insights');
    }
  };

  useEffect(() => { load(); }, []);

  const addWater = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tracking/water', { amountMl: Number(waterInput) });
      setWaterInput('');
      load();
      toast.success('Water logged');
    } catch (err) {
      toast.error('Could not log water');
    }
  };

  const addSleep = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tracking/sleep', { hoursSlept: Number(sleepInput) });
      setSleepInput('');
      load();
      toast.success('Sleep logged');
    } catch (err) {
      toast.error('Could not log sleep');
    }
  };

  const addReminder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tracking/reminders', reminderForm);
      setReminderForm({ title: '', message: '', reminderTime: '' });
      load();
      toast.success('Reminder added');
    } catch (err) {
      toast.error('Could not add reminder');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Health Insights</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Water Tracker</h2>
          <p className="text-sm text-ink-800/70">Total logged: {water} ml</p>
          <form onSubmit={addWater} className="mt-3 flex gap-2">
            <input className="w-full rounded-xl border px-3 py-2" value={waterInput} onChange={(e) => setWaterInput(e.target.value)} placeholder="Amount in ml" />
            <Button type="submit">Add</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Sleep Tracker</h2>
          <p className="text-sm text-ink-800/70">Average logged: {sleep.toFixed(1)} hrs</p>
          <form onSubmit={addSleep} className="mt-3 flex gap-2">
            <input className="w-full rounded-xl border px-3 py-2" value={sleepInput} onChange={(e) => setSleepInput(e.target.value)} placeholder="Hours slept" />
            <Button type="submit">Add</Button>
          </form>
        </Card>
      </div>
      <Card>
        <h2 className="mb-3 font-semibold">Medicine Reminders</h2>
        <form onSubmit={addReminder} className="mb-4 grid gap-3 md:grid-cols-3">
          <input className="rounded-xl border px-3 py-2" value={reminderForm.title} onChange={(e) => setReminderForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Title" required />
          <input className="rounded-xl border px-3 py-2" value={reminderForm.message} onChange={(e) => setReminderForm((prev) => ({ ...prev, message: e.target.value }))} placeholder="Message" />
         <input
  type="time"
  className="rounded-xl border px-3 py-2"
  value={reminderForm.reminderTime}
  onChange={(e) =>
    setReminderForm((prev) => ({
      ...prev,
      reminderTime: e.target.value
    }))
  }
  required
/>
        </form>
        {reminders.length ? reminders.map((item) => <div key={item.id} className="mb-2 rounded-xl border p-3 text-sm">{item.title} {item.reminder_time ? `• ${item.reminder_time}` : ''}</div>) : <p className="text-sm text-ink-800/70">No reminders yet.</p>}
      </Card>
    </div>
  );
}
