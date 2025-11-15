import mongoose from "mongoose";
import ReminderModel from "../models/ReminderSchema.js";
import UserModel from "../models/UserSchema.js";
import SearchQuery from "../utils/SearchQuery.js";

// CREATE REMINDERS
// METHOD: POST
// ENDPOINT:  /api/reminders/userId/create-plans
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

// GET REMINDERS
// METHOD: GET
// ENDPOINT: /api/reminders/userId/get-reminders
const handleGetReminders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { userId } = req.params;

    const search = req.query.search || {};
    const matchStage = SearchQuery(search);

    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "users"
        }
      },
      {
        $unwind: {
          path: "$users",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          doctorName: 1,
          appointmentDate: 1,
          remindBefore: 1,
          recurringReminder: 1,
          recurringRemindBefore: 1,
          note: 1,
          createdAt: 1,
          updatedAt: 1,
          users: {
            _id: 1,
            username: 1,
            email: 1,
            idCardNumber: 1,
            medicareNumber: 1,
            dob: 1,
            address: 1,
            gender: 1,
            bloodGroup: 1,
            pastInjury: 1,
            pastOperation: 1,
            medicines: 1,
            healthNote: 1,
            password: 1,
            role: 1,
            createdAt: 1,
            updatedAt: 1,
            customerId: 1
          }
        }
      }
    ];

    if (matchStage) pipeline.push(matchStage);
    pipeline.push({ $sort: { createdAt: -1 } });

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const reminders = await ReminderModel.aggregate(pipeline);

    const countPipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId)
        }
      }
    ];
    if (matchStage) countPipeline.push(matchStage);
    countPipeline.push({ $count: "totalItems" });

    const countResult = await ReminderModel.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      reminders,
      meta: {
        totalItems,
        totalPages,
        page,
        limit
      }
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export { handleCreateReminder, handleGetReminders };
