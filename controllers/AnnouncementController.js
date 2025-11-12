import AdminModel from "../models/AdminSchema.js";
import AnnouncementModel from "../models/AnnouncementSchema.js";
import SearchQuery from "../utils/SearchQuery.js";

const handleCreateAnnouncement = async (req, res, next) => {
  try {
    const { adminID } = req.params;

    const {
      title,
      desc,
      announcementTimeStart,
      announcementTimeEnd
    } = req.body;

    const findAdmin = await AdminModel.findById(adminID);
    if (!findAdmin) {
      return res.status(404).json({ message: "Invalid Id provided" });
    }

    const handleCreateAnnouncement = new AnnouncementModel({
      title,
      desc,
      announcementTimeStart,
      announcementTimeEnd
    });
    await handleCreateAnnouncement.save();
    res.status(200).json({ message: "Announcement Created Successfully" });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const handleGetAnnouncement = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || {};
    const matchStage = SearchQuery(search);

    const pipeline = [];

    if (matchStage) pipeline.push(matchStage);
    pipeline.push({ $sort: { createdAt: -1 } });

    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const announcements = await AnnouncementModel.aggregate(pipeline);

    const countPipeline = [];
    if (matchStage) countPipeline.push(matchStage);
    countPipeline.push({ $count: "totalItems" });

    const countResult = await AnnouncementModel.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      announcements,
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

export { handleCreateAnnouncement, handleGetAnnouncement };
