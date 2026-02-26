import ExtractRelativeFilePath from "../middlewares/ExtractRelativePath.js";
import VendorModal from "../models/VendorSchema.js";
import SearchQuery from "../utils/SearchQuery.js";

/**
 * @desc    Create Vendor
 * @route   POST /api/vendors
 */
export const createVendor = async (req, res) => {
  try {
    const { name, url } = req.body;

    const image = req?.files?.image?.[0];

    let extractPath;
    if (image) {
      extractPath = ExtractRelativeFilePath(image);
      // return res.status(400).json({ message: "Medicare File is required!" });
    }

    const vendor = await VendorModal.create({
      image: extractPath,
      name,
      url,
    });

    res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating vendor",
      error: error.message,
    });
  }
};

/**
 * @desc    Get All Vendors
 * @route   GET /api/vendors
 */
export const getAllVendors = async (req, res) => {
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

    const vendors = await VendorModal.aggregate(pipeline);

    const countPipeline = [];

    if (matchStage) countPipeline.push(matchStage);
    countPipeline.push({ $count: "totalItems" });

    const countResult = await VendorModal.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      vendors,
      meta: {
        totalItems,
        totalPages,
        page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vendors",
      error: error.message,
    });
  }
};

/**
 * @desc    Get Single Vendor
 * @route   GET /api/vendors/:id
 */
export const getSingleVendor = async (req, res) => {
  try {
    const vendor = await VendorModal.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching vendor",
      error: error.message,
    });
  }
};

/**
 * @desc    Update Vendor
 * @route   PUT /api/vendors/:id
 */
export const updateVendor = async (req, res) => {
  try {
    const { name, url } = req.body;

    const image = req?.files?.image?.[0];

    let extractPath;
    if (image) {
      extractPath = ExtractRelativeFilePath(image);
    }

    let vendor;

    if (image) {
      vendor = await VendorModal.findByIdAndUpdate(
        req.params.id,
        { image: extractPath, name, url },
        { new: true, runValidators: true }
      );

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }
    } else {
      vendor = await VendorModal.findByIdAndUpdate(
        req.params.id,
        { name, url },
        { new: true, runValidators: true }
      );

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Vendor updated successfully",
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating vendor",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete Vendor
 * @route   DELETE /api/vendors/:id
 */
export const deleteVendor = async (req, res) => {
  try {
    const vendor = await VendorModal.findByIdAndDelete(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting vendor",
      error: error.message,
    });
  }
};
