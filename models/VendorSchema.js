import mongoose from "mongoose";
const { Schema } = mongoose;

const VendorSchema = new Schema(
  {
    image: String,
    name: String,
    url: String,
  },
  {
    timestamps: true,
  }
);

const VendorModal = mongoose.model("vendors", VendorSchema);
export default VendorModal;
