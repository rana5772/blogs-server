const mongoose = require("mongoose");
const { format } = require("date-fns");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true, // Important for SEO and URL lookups
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "design",
        "marketing",
        "business",
        "technology",
        "ai automation",
        "general",
      ],
      default: "general",
      lowercase: true,
    },
    image: {
      type: String,
      default:
        "https://images.unsplash.com/photo-1594101608074-022f60b618b9?q=80&w=1074&auto=format&fit=crop",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * PRE-SAVE HOOK
 * This version removes the 'next' parameter. 
 * Mongoose will automatically proceed once the function block finishes.
 */
blogSchema.pre("validate", function () {
  if (this.title) {
    this.slug = slugify(this.title, {
      lower: true, // convert to lower case
      strict: true, // remove special characters like symbols
    });
  }
});

/**
 * VIRTUAL PROPERTY: formattedDate
 */
blogSchema.virtual("formattedDate").get(function () {
  return format(this.createdAt, "d MMMM yyyy");
});

module.exports = mongoose.model("Blog", blogSchema);