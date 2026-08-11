const cron = require('node-cron');
const { query } = require('../config/db');

async function processDueMedicineReminders() {
  const dueReminders = await query(
    `SELECT id, user_id, title, message, reminder_time
     FROM medicine_reminders
     WHERE is_active = TRUE
       AND reminder_time IS NOT NULL
       AND reminder_time <= NOW()
     ORDER BY reminder_time ASC`
  );

  let processed = 0;

  for (const reminder of dueReminders.rows) {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, scheduled_at)
       VALUES ($1, 'medicine', $2, $3, $4)`,
      [
        reminder.user_id,
        reminder.title,
        reminder.message || 'It is time to take/check your medicine.',
        reminder.reminder_time,
      ]
    );

    await query(
      `UPDATE medicine_reminders
       SET is_active = FALSE
       WHERE id = $1`,
      [reminder.id]
    );

    processed += 1;
  }

  return processed;
}

function startReminderScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      const count = await processDueMedicineReminders();
      if (count > 0) {
        console.log(`✅ Processed ${count} due medicine reminder(s).`);
      }
    } catch (error) {
      console.error('❌ Failed to process due medicine reminders:', error.message);
    }
  });

  return true;
}

module.exports = {
  processDueMedicineReminders,
  startReminderScheduler,
};
