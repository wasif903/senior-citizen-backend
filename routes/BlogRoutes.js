import express from "express";
import {
    createBlog,
    getAllBlogs,
    getSingleBlog,
    updateBlog,
    deleteBlog,
} from "../controllers/blogController.js";
import { CreateUploadMiddleware } from "../middlewares/MulterMiddleware.js";

const router = express.Router();

router.post("/", CreateUploadMiddleware([
    { name: "featuredImage", isMultiple: false }
]), createBlog);
router.get("/", getAllBlogs);
router.get("/:id", getSingleBlog);
router.patch("/:id", CreateUploadMiddleware([
    { name: "featuredImage", isMultiple: false }
]), updateBlog);
router.delete("/:id", deleteBlog);

export default router;