const slugify = require("slugify");
const Blog = require("../models/blogModel");

async function generateUniqueSlug(title) {
    const baseSlug = slugify(title, {
        lower: true,
        strict: true,
    });

    let slug = baseSlug;
    let counter = 2;

    while (await Blog.exists({ slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

module.exports = generateUniqueSlug;