import mongoose from "mongoose";
const { Schema } = mongoose;

const SessionSchema = new Schema(
  {
    fcmToken: { type: String, required: false },
    refreshToken: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ["web", "android", "ios"],
      default: "web",
    },
    timezone: {
      type: String,
      default: "UTC", // e.g. "Asia/Karachi"
    },
    deviceName: { type: String },
    lastActive: { type: Date, default: Date.now },
    ipAddress: { type: String },
  },
  { _id: false }
);

// const UserSchema = new Schema(
//   {
//     customerId: {
//       type: String,
//     },
//     username: {
//       type: String,
//       unique: true,
//     },
//     email: {
//       type: String,
//     },
//     contactNumber: {
//       type: String,
//     },
//     idCardNumber: {
//       type: String,
//     },
//     medicareNumber: {
//       type: String,
//     },
//     dob: {
//       type: String,
//     },
//     address: {
//       type: String,
//     },
//     gender: {
//       type: String,
//     },
//     bloodGroup: {
//       type: String,
//     },
//     pastInjury: {
//       type: String,
//     },
//     pastOperation: {
//       type: String,
//     },
//     medicines: {
//       type: String,
//     },
//     healthNote: {
//       type: String,
//     },
//     password: String,
//     role: {
//       type: String,
//       enum: ["User"],
//       default: "User",
//     },
//     sessions: [SessionSchema],
//     otp: {
//       type: String,
//     },
//     medicare: {
//       type: String,
//       // required: true
//     },
//     profilePicture: {
//       type: String,
//       // required: true
//       default: ""
//     },
//     otpExpire: {
//       type: Date,
//     },

//   },
//   {
//     timestamps: true,
//   }
// );
const UserSchema = new Schema(
  {
    customerId: String,

    username: {
      type: String,
      unique: true,
      required: true,
    },

    email: {
      type: String,
      sparse: true, // important if optional + unique later
    },

    contactNumber: {
      type: String,
      default: null,
    },

    idCardNumber: {
      type: String,
      default: null,
      sparse: true,
    },

    medicareNumber: {
      type: String,
      default: null,
      sparse: true,
    },

    dob: {
      type: String,
      default: null,
    },

    address: {
      type: String,
      default: null,
    },

    gender: {
      type: String,
      default: null,
    },

    bloodGroup: {
      type: String,
      default: null,
    },

    pastInjury: {
      type: String,
      default: null,
    },

    pastOperation: {
      type: String,
      default: null,
    },

    medicines: {
      type: String,
      default: null,
    },

    healthNote: {
      type: String,
      default: null,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["User"],
      default: "User",
    },

    sessions: [SessionSchema],

    otp: String,
    otpExpire: Date,

    medicare: {
      type: String,
    },

    profilePicture: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("users", UserSchema);
export default UserModel;
