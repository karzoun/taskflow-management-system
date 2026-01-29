require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);


// Basic health check route
app.get("/", (req, res) => {
  res.send("TaskFlow API is running");
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "";

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
