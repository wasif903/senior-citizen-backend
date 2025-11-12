import mongoose from "mongoose";
const { Schema } = mongoose;

const AnnouncementSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    desc: {
      type: String,
      required: true
    },
    announcementTimeStart: {
      type: Date,
      required: true
    },
    announcementTimeEnd: {
      type: Date,
      required: true
    },
    sent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const AnnouncementModel = mongoose.model("announcements", AnnouncementSchema);
export default AnnouncementModel;
