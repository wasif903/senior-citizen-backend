import mongoose from "mongoose";
const { Schema } = mongoose;

const AdSchema = new Schema(
  {
    name: String,
    category: {
      type: String,
      enum: [
        "Insurance",
        "Financial",
        "Groceries",
        "Healthcare",
        "Restaurants",
        "Travel",
      ],
      default: "Insurance",
    },
    webImage: String,
    appImage: String,
    url: String,
  },
  {
    timestamps: true,
  },
);

const AdModel = mongoose.model("ads", AdSchema);
export default AdModel;
