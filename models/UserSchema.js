import mongoose from "mongoose";
const { Schema } = mongoose;

const SessionSchema = new Schema(
  {
    fcmToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ["web", "android", "ios"],
      default: "web"
    },
    deviceName: { type: String },
    lastActive: { type: Date, default: Date.now },
    ipAddress: { type: String }
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    customerId: {
      type: String
    },
    username: {
      type: String,
      unique: true
    },
    email: {
      type: String,
      unique: true
    },
    contactNumer: {
      type: String,
      unique: true
    },
    idCardNumber: {
      type: String,
      unique: true
    },
    medicareNumber: {
      type: String,
      unique: true
    },
    dob: {
      type: String
    },
    address: {
      type: String
    },
    gender: {
      type: String
    },
    bloodGroup: {
      type: String
    },
    pastInjury: {
      type: String
    },
    pastOperation: {
      type: String
    },
    medicines: {
      type: String
    },
    healthNote: {
      type: String
    },
    password: String,
    role: {
      type: String,
      enum: ["User"],
      default: "User"
    },
    sessions: [SessionSchema],
    otp: {
      type: String
    },
    medicare: {
      type: String,
      required: true
    },
    otpExpire: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);
const UserModel = mongoose.model("users", UserSchema);
export default UserModel;
