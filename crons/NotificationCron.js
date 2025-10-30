import admin from "../config/firebase.js";
import cron from "node-cron";
import ReminderModel from "../models/ReminderModel.js";
import UserModel from "../models/UserModel.js";

// Run every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();

  const reminders = await ReminderModel.find({ recurringReminder: true });

  for (const reminder of reminders) {
    const user = await UserModel.findById(reminder.userId);
    if (!user || !user.fcmToken) continue;

    const appointmentTime = new Date(reminder.appointmentDate);

    // Convert remindBefore to minutes (supports 'hour' or 'min')
    const remindBeforeMinutes = convertToMinutes(reminder.remindBefore);
    const recurringIntervalMinutes = convertToMinutes(
      reminder.recurringRemindBefore
    );

    // Start time for notifications
    const startTime = new Date(
      appointmentTime.getTime() - remindBeforeMinutes * 60000
    );
    const endTime = appointmentTime; // stop at appointment time

    // If current time is within the window before appointment
    if (now >= startTime && now <= endTime) {
      // Calculate time difference from start to now
      const diff = Math.floor((now - startTime) / 60000);

      // Send notification every recurring interval
      if (diff % recurringIntervalMinutes === 0) {
        await sendPushNotification(user.fcmToken, reminder);
        console.log(`Notification sent to ${user._id} at ${now.toISOString()}`);
      }
    }
  }
});

function convertToMinutes(str) {
  if (!str) return 0;
  const num = parseInt(str);
  if (str.includes("hour")) return num * 60;
  if (str.includes("min")) return num;
  return num;
}

async function sendPushNotification(token, reminder) {
  try {
    await admin.messaging().send({
      token,
      notification: {
        title: `Reminder: ${reminder.doctorName}`,
        body: `Your appointment is at ${new Date(
          reminder.appointmentDate
        ).toLocaleTimeString()}.`
      },
      data: {
        reminderId: reminder._id.toString(),
        type: "reminder"
      }
    });
  } catch (err) {
    console.error("Error sending notification:", err.message);
  }
}
