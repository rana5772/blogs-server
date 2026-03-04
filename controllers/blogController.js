const Blog = require("../models/blogModel");

// Get all blogs with pagination and filtering
exports.getAllBlogs = async (req, res) => {
  try {
    // 1. Create a copy of the query for filtering
    const queryObj = { ...req.query };

    // 2. Exclude pagination fields from the filter object
    const excludedFields = ["page", "limit"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 3. Set pagination variables
    // Page 1 is default; limit 6 is default
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    // 4. Execute Query
    // We filter using queryObj, then skip/limit for pagination
    const blogs = await Blog.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 5. Get total count for the specific filter (not all blogs)
    const totalBlogs = await Blog.countDocuments(queryObj);

    res.json({
      blogs,
      totalResults: totalBlogs,
      totalPages: Math.ceil(totalBlogs / limit),
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
