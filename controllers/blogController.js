const Blog = require("../models/blogModel");
const { generateBlog } = require("../services/groqBlogGenerator");
const generateUniqueSlug = require("../utils/generateUniqueSlug");

// Get all blogs with pagination and filtering
exports.getAllBlogs = async (req, res) => {
  try {
    const queryObj = { ...req.query };

    const excludedFields = ["page", "limit", "sort"];
    excludedFields.forEach((el) => delete queryObj[el]);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const sortOrder = req.query.sort || "latest";

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

// sitemap update
exports.getSitemap = async (req, res) => {
  try {
    const Blog = require("../models/blogModel");

    const blogs = await Blog.find({}, "slug createdAt").sort({
      createdAt: -1,
    });

    const staticPages = [
      {
        loc: "https://rana.net.in/",
        lastmod: "2026-02-27",
        changefreq: "yearly",
        priority: "1.0",
      },
      {
        loc: "https://rana.net.in/about",
        lastmod: "2026-02-27",
        changefreq: "yearly",
        priority: "0.9",
      },
      {
        loc: "https://rana.net.in/projects",
        lastmod: "2026-02-27",
        changefreq: "monthly",
        priority: "0.8",
      },
      {
        loc: "https://rana.net.in/pricing",
        lastmod: "2026-02-27",
        changefreq: "yearly",
        priority: "0.8",
      },
      {
        loc: "https://rana.net.in/blogs",
        lastmod: "2026-02-27",
        changefreq: "weekly",
        priority: "0.7",
      },
      {
        loc: "https://rana.net.in/contact",
        lastmod: "2026-02-27",
        changefreq: "yearly",
        priority: "0.6",
      },
      {
        loc: "https://rana.net.in/faqs",
        lastmod: "2024-02-22",
        changefreq: "yearly",
        priority: "0.6",
      },
      {
        loc: "https://rana.net.in/privacy-policy",
        lastmod: "2026-04-02",
        changefreq: "yearly",
        priority: "0.3",
      },
      {
        loc: "https://rana.net.in/terms-&-conditions",
        lastmod: "2026-04-02",
        changefreq: "yearly",
        priority: "0.3",
      },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    for (const blog of blogs) {
      xml += `
  <url>
    <loc>https://rana.net.in/blog/${blog.slug}</loc>
    <lastmod>${blog.createdAt.toISOString().split("T")[0]}</lastmod>
    <priority>0.6</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate sitemap.");
  }
};
