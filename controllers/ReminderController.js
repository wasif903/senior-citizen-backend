import ReminderModel from "../models/ReminderSchema.js";
import UserModel from "../models/UserSchema.js";

const handleCreateReminder = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const {
      doctorName,
      appointmentDate,
      remindBefore,
      recurringReminder,
      recurringRemindBefore,
      note
    } = req.body;

    // ✅ Await the user query
    const findUser = await UserModel.findById(userId);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Validation logic
    if (recurringReminder) {
      // Recurring is ON → must have recurringRemindBefore
      if (!recurringRemindBefore || recurringRemindBefore.trim() === "") {
        return res.status(400).json({
          message:
            "Recurring Reminder is active. Please provide a recurring reminder time."
        });
      }
    } else {
      // Recurring is OFF → must NOT have recurringRemindBefore
      if (recurringRemindBefore && recurringRemindBefore.trim() !== "") {
        return res.status(400).json({
          message:
            "Recurring Reminder is not active. Please disable the recurring reminder time."
        });
      }
    }

    // ✅ Create reminder with userId included
    const createReminder = new ReminderModel({
      userId,
      doctorName,
      appointmentDate,
      remindBefore,
      recurringReminder,
      recurringRemindBefore,
      note
    });

    await createReminder.save();

    res.status(200).json({
      message: "Reminder created successfully",
      reminder: createReminder
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export { handleCreateReminder };
