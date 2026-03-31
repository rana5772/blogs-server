require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected successfully"))
  .catch((err) => console.error("DB connection error:", err));

// Blog Controller
const blogController = require("./controllers/blogController");

// Blog Routes
app.get("/api/blogs/get-all", blogController.getAllBlogs);
// app.post("/api/blogs/new", blogController.createBlog);
app.get("/api/blogs/:id", blogController.getBlogById);
// app.put("/api/blogs/:id", blogController.updateBlog);
// app.delete("/api/blogs/:id", blogController.deleteBlog);

// Root Route for basic testing
app.get("/", (req, res) => {
  res.send("server is running");
});

app.use("/", (req, res) => {
  res.status(404).send("404 Not Found");
});

// Start the Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
