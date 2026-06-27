// sitemap update
exports.getSitemap = async (req, res) => {
  try {
    // Escape special XML characters (keeps & in your URL)
    const escapeXml = (str) => str.replace(/&/g, "&amp;");

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
    <loc>${escapeXml(page.loc)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    for (const blog of blogs) {
      xml += `
  <url>
    <loc>${escapeXml(`https://rana.net.in/blog/${blog.slug}`)}</loc>
    <lastmod>${blog.createdAt.toISOString().split("T")[0]}</lastmod>
    <priority>0.6</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate sitemap.");
  }
};
