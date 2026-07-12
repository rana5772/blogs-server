const Blog = require("../models/blogModel");
const { generateBlog } = require("../services/groqBlogGenerator");
const generateUniqueSlug = require("../utils/generateUniqueSlug");

// Get all blogs with pagination and filtering
exports.getAllBlogs = async (req, res) => {
  try {
    const queryObj = { ...req.query };

    const excludedFields = ["page", "limit", "sort", "all"];
    excludedFields.forEach((el) => delete queryObj[el]);

    const sortOrder = req.query.sort || "latest";

    // Used by sitemap
    if (req.query.all === "true") {
      const blogs = await Blog.find(queryObj, "slug createdAt")
        .sort({
          createdAt: sortOrder === "oldest" ? 1 : -1,
        });

      return res.json({
        blogs,
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find(queryObj)
      .sort({
        createdAt: sortOrder === "oldest" ? 1 : -1,
      })
      .skip(skip)
      .limit(limit);

    const totalBlogs = await Blog.countDocuments(queryObj);

    res.json({
      blogs,
      totalResults: totalBlogs,
      totalPages: Math.ceil(totalBlogs / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const blog = new Blog(req.body);
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get a single blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single blog by slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a blog by ID
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true, // Crucial: This validates the 'category' enum on update
    });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a blog by ID
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// generate ai blog
exports.generateAiBlog = async (req, res) => {
  const secret = req.headers["x-blog-secret"];

  if (secret !== process.env.BLOG_GENERATOR_SECRET) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  try {
    const generated = await generateBlog();

    const slug = await generateUniqueSlug(generated.title);

    const blog = await Blog.create({
      title: generated.title,
      slug,
      content: generated.content,
      category: generated.category,
    });

    // Warm the new blog page, blogs page and sitemap (fire-and-forget)
    Promise.allSettled([
      fetch(`https://rana.net.in/blog/${blog.slug}`),
      fetch("https://rana.net.in/blogs"),
      fetch("https://rana.net.in/sitemap.xml"),
    ]).catch((err) => {
      console.error("Warm-up failed:", err);
    });

    res.status(201).json({
      success: true,
      blog,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
