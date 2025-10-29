import mongoose from "mongoose";
const { Schema } = mongoose;

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
    refreshToken: String,
    otp: {
      type: String
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
