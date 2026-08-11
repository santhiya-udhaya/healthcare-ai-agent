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
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
  );

  // =========================
  // LOAD HEALTH DATA
  // =========================
  const load = async () => {
    // Water
    try {
      const response = await api.get('/tracking/water');
      setWater(response.data?.data?.totalMl || 0);
    } catch (err) {
      console.error('Water loading error:', err.response?.data || err.message);
    }

    // Sleep
    try {
      const response = await api.get('/tracking/sleep');
      setSleep(response.data?.data?.avgHours || 0);
    } catch (err) {
      console.error('Sleep loading error:', err.response?.data || err.message);
    }

    // Reminders
    try {
      const response = await api.get('/tracking/reminders');
      setReminders(response.data?.data || []);
    } catch (err) {
      console.error(
        'Reminder loading error:',
        err.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  // =========================
  // NOTIFICATIONS
  // =========================
  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Your browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success('Notifications are already enabled');
      return true;
    }

    if (Notification.permission === 'denied') {
      toast.error(
        'Notifications are blocked. Please allow them in browser settings.'
      );
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast.success('Notifications enabled');
      return true;
    }

    toast.error('Please allow notifications in your browser');
    return false;
  };

  // =========================
  // CHECK REMINDERS
  // =========================
  useEffect(() => {
    if (!reminders.length) return;

    const checkReminders = () => {
      if (
        !('Notification' in window) ||
        Notification.permission !== 'granted'
      ) {
        return;
      }

      const now = new Date();

      const currentTime =
        String(now.getHours()).padStart(2, '0') +
        ':' +
        String(now.getMinutes()).padStart(2, '0');

      const today =
        now.getFullYear() +
        '-' +
        String(now.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(now.getDate()).padStart(2, '0');

      reminders.forEach((reminder) => {
        const reminderTime = reminder.reminder_time
          ? String(reminder.reminder_time).substring(0, 5)
          : '';

        if (reminderTime !== currentTime) return;

        const notificationKey =
          `medicine-reminder-${reminder.id}-${today}`;

        // Show only once per day
        if (localStorage.getItem(notificationKey)) {
          return;
        }

        new Notification(
          reminder.title || 'Medicine Reminder',
          {
            body:
              reminder.message ||
              'It is time to take/check your medicine.',
            icon: '/favicon.ico',
          }
        );

        localStorage.setItem(notificationKey, 'shown');
      });
    };

    // Check immediately
    checkReminders();

    // Check every 5 seconds
    const interval = setInterval(checkReminders, 5000);

    return () => clearInterval(interval);
  }, [reminders]);

  // =========================
  // WATER
  // =========================
  const addWater = async (e) => {
    e.preventDefault();

    const amount = Number(waterInput);

    if (!amount || amount <= 0) {
      toast.error('Enter a valid water amount');
      return;
    }

    try {
      await api.post('/tracking/water', {
        amountMl: amount,
      });

      setWaterInput('');
      await load();

      toast.success('Water logged successfully');
    } catch (err) {
      console.error('Add water error:', err.response?.data || err.message);

      toast.error(
        err.response?.data?.message || 'Could not log water'
      );
    }
  };

  // =========================
  // SLEEP
  // =========================
  const addSleep = async (e) => {
    e.preventDefault();

    const hours = Number(sleepInput);

    if (!hours || hours <= 0) {
      toast.error('Enter valid sleep hours');
      return;
    }

    try {
      await api.post('/tracking/sleep', {
        hoursSlept: hours,
      });

      setSleepInput('');
      await load();

      toast.success('Sleep logged successfully');
    } catch (err) {
      console.error('Add sleep error:', err.response?.data || err.message);

      toast.error(
        err.response?.data?.message || 'Could not log sleep'
      );
    }
  };

  // =========================
  // ADD / UPDATE REMINDER
  // =========================
  const saveReminder = async (e) => {
    e.preventDefault();

    if (!reminderForm.title.trim()) {
      toast.error('Enter a reminder title');
      return;
    }

    if (!reminderForm.reminderTime) {
      toast.error('Select a reminder time');
      return;
    }

    try {
      if (editingId) {
        await api.put(
          `/tracking/reminders/${editingId}`,
          reminderForm
        );

        toast.success('Reminder updated successfully');
      } else {
        await api.post('/tracking/reminders', reminderForm);

        toast.success('Reminder added successfully');
      }

      setReminderForm({
        title: '',
        message: '',
        reminderTime: '',
      });

      setEditingId(null);

      await load();
    } catch (err) {
      console.error(
        'Reminder save error:',
        err.response?.data || err.message
      );

      toast.error(
        err.response?.data?.message ||
          (editingId
            ? 'Could not update reminder'
            : 'Could not add reminder')
      );
    }
  };

  // =========================
  // EDIT REMINDER
  // =========================
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

  // =========================
  // DELETE REMINDER
  // =========================
  const deleteReminder = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this reminder?'
    );

    if (!confirmed) return;

    try {
      await api.delete(`/tracking/reminders/${id}`);

      toast.success('Reminder deleted successfully');

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
      console.error(
        'Delete reminder error:',
        err.response?.data || err.message
      );

      toast.error(
        err.response?.data?.message || 'Could not delete reminder'
      );
    }
  };

  // =========================
  // CANCEL EDIT
  // =========================
  const cancelEdit = () => {
    setEditingId(null);

    setReminderForm({
      title: '',
      message: '',
      reminderTime: '',
    });
  };

 
  return (
  <div style={{ minHeight: '500px', background: 'white', color: 'black', padding: '40px' }}>
    <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>
      HEALTH INSIGHTS PRODUCTION TEST
    </h1>

    <p>Health Insights component is loading.</p>

    <div className="space-y-6 mt-6"></div>
      <h1 className="text-3xl font-bold">
        Health Insights
      </h1>

      {/* ================= WATER ================= */}
      <Card>
        <h2 className="text-xl font-semibold">
          💧 Water Tracker
        </h2>

        <p className="mt-3 text-lg">
          Total logged:{' '}
          <span className="font-semibold">
            {water} ml
          </span>
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
            min="1"
            required
          />

          <Button type="submit">
            Add Water
          </Button>
        </form>
      </Card>

      {/* ================= SLEEP ================= */}
      <Card>
        <h2 className="text-xl font-semibold">
          😴 Sleep Tracker
        </h2>

        <p className="mt-3 text-lg">
          Average logged:{' '}
          <span className="font-semibold">
            {Number(sleep).toFixed(1)} hrs
          </span>
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
            min="0.1"
            max="24"
            step="0.1"
            required
          />

          <Button type="submit">
            Add Sleep
          </Button>
        </form>
      </Card>

      {/* ================= MEDICINE ================= */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">
            💊 Medicine Reminders
          </h2>

          <Button
            type="button"
            onClick={enableNotifications}
          >
            {notificationsEnabled
              ? '🔔 Notifications Enabled'
              : '🔔 Enable Notifications'}
          </Button>
        </div>

        <form
          onSubmit={saveReminder}
          className="mt-5 space-y-3"
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
            placeholder="Medicine / Reminder title"
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
              {editingId
                ? 'Update Reminder'
                : 'Add Reminder'}
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

        {/* ================= REMINDER LIST ================= */}
        <div className="mt-5 space-y-3">
          {reminders.length > 0 ? (
            reminders.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
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
                    <p className="mt-1 text-sm text-brand-600">
                      ⏰{' '}
                      {String(item.reminder_time).substring(
                        0,
                        5
                      )}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      editReminder(item)
                    }
                  >
                    ✏️ Edit
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      deleteReminder(item.id)
                    }
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