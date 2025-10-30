import mongoose from "mongoose";
const { Schema } = mongoose;

const ReminderSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },
    doctorName: {
      type: String,
      required: true
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    remindBefore: {
      type: String
    },
    recurringReminder: {
      type: Boolean,
      default: false
    },
    recurringRemindBefore: {
      type: String
    },
    note: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const ReminderModel = mongoose.model("reminders", ReminderSchema);
export default ReminderModel;
