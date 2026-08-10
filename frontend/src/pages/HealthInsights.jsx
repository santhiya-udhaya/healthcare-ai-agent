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

  const [reminderForm, setReminderForm] = useState({
    title: '',
    message: '',
    reminderTime: '',
  });

  const [editingId, setEditingId] = useState(null);

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
      console.error(err);
      toast.error('Could not load health insights');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addWater = async (e) => {
    e.preventDefault();

    try {
      await api.post('/tracking/water', {
        amountMl: Number(waterInput),
      });

      setWaterInput('');
      await load();
      toast.success('Water logged');
    } catch (err) {
      toast.error('Could not log water');
    }
  };

  const addSleep = async (e) => {
    e.preventDefault();

    try {
      await api.post('/tracking/sleep', {
        hoursSlept: Number(sleepInput),
      });

      setSleepInput('');
      await load();
      toast.success('Sleep logged');
    } catch (err) {
      toast.error('Could not log sleep');
    }
  };

  // ADD or UPDATE reminder
  const saveReminder = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(
          `/tracking/reminders/${editingId}`,
          reminderForm
        );

        toast.success('Reminder updated');
      } else {
        await api.post('/tracking/reminders', reminderForm);

        toast.success('Reminder added');
      }

      setReminderForm({
        title: '',
        message: '',
        reminderTime: '',
      });

      setEditingId(null);

      await load();
    } catch (err) {
      console.error(err);
      toast.error(
        editingId
          ? 'Could not update reminder'
          : 'Could not add reminder'
      );
    }
  };

  // EDIT
  const editReminder = (item) => {
    setEditingId(item.id);

    setReminderForm({
      title: item.title || '',
      message: item.message || '',
      reminderTime: item.reminder_time
        ? String(item.reminder_time).substring(0, 5)
        : '',
    });

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  };

  // DELETE
  const deleteReminder = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this reminder?'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/tracking/reminders/${id}`);

      toast.success('Reminder deleted');

      if (editingId === id) {
        setEditingId(null);

        setReminderForm({
          title: '',
          message: '',
          reminderTime: '',
        });
      }

      await load();
    } catch (err) {
      console.error(err);
      toast.error('Could not delete reminder');
    }
  };

  // CANCEL EDIT
  const cancelEdit = () => {
    setEditingId(null);

    setReminderForm({
      title: '',
      message: '',
      reminderTime: '',
    });
  };

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">
        Health Insights
      </h1>

      {/* WATER */}
      <Card>
        <h2 className="text-xl font-semibold">
          Water Tracker
        </h2>

        <p className="mt-3">
          Total logged: {water} ml
        </p>

        <form
          onSubmit={addWater}
          className="mt-4 flex gap-3"
        >
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={waterInput}
            onChange={(e) =>
              setWaterInput(e.target.value)
            }
            placeholder="Amount in ml"
            type="number"
            required
          />

          <Button type="submit">
            Add
          </Button>
        </form>
      </Card>

      {/* SLEEP */}
      <Card>
        <h2 className="text-xl font-semibold">
          Sleep Tracker
        </h2>

        <p className="mt-3">
          Average logged: {Number(sleep).toFixed(1)} hrs
        </p>

        <form
          onSubmit={addSleep}
          className="mt-4 flex gap-3"
        >
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={sleepInput}
            onChange={(e) =>
              setSleepInput(e.target.value)
            }
            placeholder="Hours slept"
            type="number"
            step="0.1"
            required
          />

          <Button type="submit">
            Add
          </Button>
        </form>
      </Card>

      {/* MEDICINE REMINDERS */}
      <Card>
        <h2 className="text-xl font-semibold">
          Medicine Reminders
        </h2>

        <form
          onSubmit={saveReminder}
          className="mt-4 space-y-3"
        >
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={reminderForm.title}
            onChange={(e) =>
              setReminderForm((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            placeholder="Title"
            required
          />

          <input
            className="w-full rounded-xl border px-3 py-2"
            value={reminderForm.message}
            onChange={(e) =>
              setReminderForm((prev) => ({
                ...prev,
                message: e.target.value,
              }))
            }
            placeholder="Message"
          />

          <input
            type="time"
            className="w-full rounded-xl border px-3 py-2"
            value={reminderForm.reminderTime}
            onChange={(e) =>
              setReminderForm((prev) => ({
                ...prev,
                reminderTime: e.target.value,
              }))
            }
            required
          />

          <div className="flex gap-2">
            <Button type="submit">
              {editingId ? 'Update reminder' : 'Add reminder'}
            </Button>

            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* REMINDER LIST */}
        <div className="mt-5 space-y-3">
          {reminders.length > 0 ? (
            reminders.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <div>
                  <p className="font-medium">
                    {item.title}
                  </p>

                  {item.message && (
                    <p className="text-sm text-gray-500">
                      {item.message}
                    </p>
                  )}

                  {item.reminder_time && (
                    <p className="text-sm text-brand-600">
                      ⏰ {String(item.reminder_time).substring(0, 5)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => editReminder(item)}
                  >
                    ✏️ Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => deleteReminder(item.id)}
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No reminders yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}