const express = require("express");
const Project = require("../models/Project");
const auth = require("../middleware/auth");

const router = express.Router();

// All routes below require a valid token
router.use(auth);

// GET /projects - list projects for current user
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({ ownerId: req.user.userId }).sort({
      createdAt: -1,
    });
    res.json(projects);
  } catch (err) {
    console.error("GET /projects error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /projects - create new project
router.post("/", async (req, res) => {
  try {
    const { title, description, status, startDate, endDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const project = new Project({
      ownerId: req.user.userId,
      title,
      description,
      status,
      startDate,
      endDate,
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error("POST /projects error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /projects/:id - get single project (must belong to user)
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      ownerId: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    console.error("GET /projects/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /projects/:id - update project
router.put("/:id", async (req, res) => {
  try {
    const { title, description, status, startDate, endDate } = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.userId },
      { title, description, status, startDate, endDate },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    console.error("PUT /projects/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /projects/:id - delete project
router.delete("/:id", async (req, res) => {
  try {
    const result = await Project.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.userId,
    });

    if (!result) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("DELETE /projects/:id error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
