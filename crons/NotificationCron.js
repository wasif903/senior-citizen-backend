import admin from "../config/firebase.js";
import cron from "node-cron";
import ReminderModel from "../models/ReminderSchema.js";
import UserModel from "../models/UserSchema.js";

// Run every minute
cron.schedule("* * * * *", async () => {
  const now = new Date();
  console.log(`\n[${now.toISOString()}] Cron job started`);

  let reminders;
  try {
    reminders = await ReminderModel.find({ appointmentDate: { $gte: now } });
    console.log(`[${now.toISOString()}] Found ${reminders.length} upcoming reminders`);
  } catch (err) {
    console.error("Error fetching reminders:", err.message);
    return;
  }

  for (const reminder of reminders) {
    let user;
    try {
      user = await UserModel.findById(reminder.userId);
    } catch (err) {
      console.error(`Error fetching user ${reminder.userId}:`, err.message);
      continue;
    }

    if (!user || !user.sessions?.length) {
      console.log(`No active sessions for user ${reminder.userId}`);
      continue;
    }

    const appointmentTime = new Date(reminder.appointmentDate);
    const remindBeforeMinutes = convertToMinutes(reminder.remindBefore);
    const startTime = new Date(appointmentTime.getTime() - remindBeforeMinutes * 60000);

    if (!reminder.recurringReminder) {
      if (now >= startTime && now < new Date(startTime.getTime() + 60000)) {
        console.log(`Sending single notification for user ${user._id}`);
        for (const session of user.sessions) {
          if (session.fcmToken) await sendPushNotification(session.fcmToken, reminder);
        }
      } else {
        console.log(`Single notification not due yet for user ${user._id}`);
      }
    } else {
      const recurringIntervalMinutes = convertToMinutes(reminder.recurringRemindBefore);
      const diff = Math.floor((now - startTime) / 60000);
      if (diff >= 0 && diff % recurringIntervalMinutes === 0) {
        console.log(`Sending recurring notification for user ${user._id}`);
        for (const session of user.sessions) {
          if (session.fcmToken) await sendPushNotification(session.fcmToken, reminder);
        }
      } else {
        console.log(`Recurring notification not due yet for user ${user._id}, diff: ${diff} min`);
      }
    }
  }

  console.log(`[${new Date().toISOString()}] Cron job finished`);
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
        body: `Your appointment is at ${new Date(reminder.appointmentDate).toLocaleTimeString()}.`,
      },
      data: {
        reminderId: reminder._id.toString(),
        type: "reminder",
      },
    });
    console.log(`Notification sent to token ${token}`);
  } catch (err) {
    console.error("Error sending notification:", err.message);
  }
}
