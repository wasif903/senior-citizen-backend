import mongoose from "mongoose";
const { Schema } = mongoose;

const BlogSchema = new Schema(
    {
        title: String,
        slug: String,
        content: String,
        excerpt: String,
        featuredImage: String,
        author: String,
        category: String,
        status: String,
    },
    {
        timestamps: true,
    }
);

const BlogModal = mongoose.model("blogs", BlogSchema);
export default BlogModal;