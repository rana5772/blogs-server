require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const colors = require("colors");

const app = express();

app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected successfully".green))
  .catch((err) => console.error("DB connection error:".red, err));

// Blog Controller
const blogController = require("./controllers/blogController");

// Blog Routes
app.get("/api/blogs/get-all", blogController.getAllBlogs);
app.get("/api/blogs/title/:slug", blogController.getBlogBySlug);
app.get("/api/blogs/:id", blogController.getBlogById);

// Root Route
app.get("/", (req, res) => {
  res.send("server is running");
});

app.use("/", (req, res) => {
  res.status(404).send("404 Not Found");
});

// Start Server
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.cyan);
});