import ExtractRelativeFilePath from "../middlewares/ExtractRelativePath.js";
import BlogModal from "../models/BlogSchema.js";
import slugify from "slugify";
import SearchQuery from "../utils/SearchQuery.js";

// @desc    Create Blog
// @route   POST /api/blogs
export const createBlog = async (req, res) => {
  try {
    const featuredImage = req?.files?.featuredImage?.[0];

    if (!featuredImage) {
      return res.status(400).json({ message: "Featured Image Is Required !" });
    }

    // ✅ Generate Base Slug
    let baseSlug = slugify(req.body.title, {
      lower: true,
      strict: true,
    });

    let slug = baseSlug;
    let counter = 1;

    // ✅ Check if slug already exists
    while (await BlogModal.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const extractPath = ExtractRelativeFilePath(featuredImage);

    const data = {
      ...req.body,
      slug,
      featuredImage: extractPath,
    };

    const blog = await BlogModal.create(data);

    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating blog",
      error: error.message,
    });
  }
};
// @desc    Get All Blogs
// @route   GET /api/blogs
export const getAllBlogs = async (req, res) => {
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

    const blogs = await BlogModal.aggregate(pipeline);

    const countPipeline = [];

    if (matchStage) countPipeline.push(matchStage);
    countPipeline.push({ $count: "totalItems" });

    const countResult = await BlogModal.aggregate(countPipeline);
    const totalItems = countResult.length > 0 ? countResult[0].totalItems : 0;
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      blogs,
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
      message: "Error fetching blogs",
      error: error.message,
    });
  }
};

// @desc    Get Single Blog
// @route   GET /api/blogs/:id
export const getSingleBlog = async (req, res) => {
  try {
    const blog = await BlogModal.findOne({
      slug: req.params.id,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching blog",
      error: error.message,
    });
  }
};

// @desc    Update Blog
// @route   PATCH /api/blogs/:id
export const updateBlog = async (req, res) => {
  try {
    const findBlog = await BlogModal.findById(req.params.id);

    if (!findBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    let updateData = { ...req.body };

    // ✅ If title changed → regenerate unique slug
    if (req.body.title && req.body.title !== findBlog.title) {
      let baseSlug = slugify(req.body.title, {
        lower: true,
        strict: true,
      });

      let slug = baseSlug;
      let counter = 1;

      while (
        await BlogModal.findOne({
          slug,
          _id: { $ne: req.params.id }, // exclude current blog
        })
      ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      updateData.slug = slug;
    }

    // ✅ If new featured image uploaded
    const featuredImage = req?.files?.featuredImage?.[0];

    if (featuredImage) {
      const extractPath = ExtractRelativeFilePath(featuredImage);
      updateData.featuredImage = extractPath;
    }

    const blog = await BlogModal.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating blog",
      error: error.message,
    });
  }
};

// @desc    Delete Blog
// @route   DELETE /api/blogs/:id
export const deleteBlog = async (req, res) => {
  try {
    const blog = await BlogModal.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting blog",
      error: error.message,
    });
  }
};
