import admin from "../config/firebase.js";
import cron from "node-cron";
import ReminderModel from "../models/ReminderSchema.js";
import UserModel from "../models/UserSchema.js";
import AnnouncementModel from "../models/AnnouncementSchema.js";

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

cron.schedule("* * * * *", async () => {
  const now = new Date();
  console.log(`\n[${now.toISOString()}] Announcement cron started`);

  try {
    // Get today’s date only (ignore time)
    const today = new Date(now.toISOString().split("T")[0]);

    // Define today's range (00:00 to 23:59)
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Find announcements that start today and are not already sent
    const announcements = await AnnouncementModel.find({
      announcementTimeStart: { $gte: startOfDay, $lte: endOfDay },
      sent: { $ne: true } // optional if you add a "sent" field
    });

    if (!announcements.length) {
      console.log(`[${now.toISOString()}] No announcements scheduled for today`);
      return;
    }

    console.log(`[${now.toISOString()}] Found ${announcements.length} announcements for today`);

    // Fetch all users with active sessions (you can filter roles if needed)
    const users = await UserModel.find({ "sessions.fcmToken": { $exists: true, $ne: "" } });

    for (const announcement of announcements) {
      console.log(`Sending announcement "${announcement.title}" to ${users.length} users`);

      // Send push notification to each user session
      for (const user of users) {
        for (const session of user.sessions) {
          if (session.fcmToken) {
            await sendPushNotification(session.fcmToken, {
              title: announcement.title,
              body: announcement.desc,
              data: { type: "announcement", id: announcement._id.toString() }
            });
          }
        }
      }

      // Mark announcement as sent (optional)
      announcement.sent = true;
      await announcement.save();

      console.log(`Announcement "${announcement.title}" sent successfully.`);
    }

    console.log(`[${new Date().toISOString()}] Announcement cron finished`);
  } catch (error) {
    console.error("Error in announcement cron:", error.message);
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
    console.log(reminder)
    await admin.messaging().send({
      token,
      notification: {
        title: `Reminder: ${reminder.doctorName}`,
        body: `Your appointment is at ${new Date(reminder.appointmentDate).toLocaleTimeString()}.`,
      },
      data: {
        reminderId: String(reminder._id),
        type: "reminder",
      },
    });
    console.log(`Notification sent to token ${token}`);
  } catch (err) {
    console.error("Error sending notification:", err.message);
  }
}
