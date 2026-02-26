import ExtractRelativeFilePath from "../middlewares/ExtractRelativePath.js";
import AdModel from "../models/AdSchema.js";
import SearchQuery from "../utils/SearchQuery.js";

/**
 * CREATE AD
 * METHOD: POST
 * ENDPOINT: /api/ads
 */
export const handleCreateAd = async (req, res, next) => {
  try {
    const { name, category, url } = req.body;

    const webImage = req?.files?.webImage?.[0];
    const appImage = req?.files?.appImage?.[0];

    if (!webImage || !appImage) {
      return res.status(400).json({
        success: false,
        message: "Both webImage and appImage are required",
      });
    }

    let extractWebImagePath = ExtractRelativeFilePath(webImage);
    let extractAppImagePath = ExtractRelativeFilePath(appImage);

    const ad = await AdModel.create({
      name,
      category,
      webImage: extractWebImagePath,
      appImage: extractAppImagePath,
      url,
    });

    res.status(201).json({
      success: true,
      message: "Ad created successfully",
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET ALL ADS
 * METHOD: GET
 * ENDPOINT: /api/ads
 * Optional Query: ?category=Insurance
 */
export const handleGetAllAds = async (req, res, next) => {
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

    const ads = await AdModel.aggregate(pipeline);

    const countPipeline = [];

    if (matchStage) countPipeline.push(matchStage);
    countPipeline.push({ $count: "totalItems" });

    const countResult = await AdModel.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      ads,
      meta: {
        totalItems,
        totalPages,
        page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET SINGLE AD
 * METHOD: GET
 * ENDPOINT: /api/ads/:id
 */
export const handleGetSingleAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ad = await AdModel.findById(id);
    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    res.status(200).json({
      success: true,
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE AD
 * METHOD: PUT
 * ENDPOINT: /api/ads/:id
 */
export const handleUpdateAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const webImage = req?.files?.webImage?.[0];
    const appImage = req?.files?.appImage?.[0];

    const updateFields = {
      ...req.body,
    };

    const findAd = await AdModel.findById(id);
    if (!findAd) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    // Only update webImage if new file provided
    if (webImage) {
      updateFields.webImage = ExtractRelativeFilePath(webImage);
    } else {
      updateFields.webImage = findAd.webImage; // Retain existing webImage if not updated
    }

    // Only update appImage if new file provided
    if (appImage) {
      updateFields.appImage = ExtractRelativeFilePath(appImage);
    } else {
      updateFields.appImage = findAd.appImage; // Retain existing appImage if not updated
    }

    const updatedAd = await AdModel.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedAd) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ad updated successfully",
      data: updatedAd,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE AD
 * METHOD: DELETE
 * ENDPOINT: /api/ads/:id
 */
export const handleDeleteAd = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedAd = await AdModel.findByIdAndDelete(id);

    if (!deletedAd) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
