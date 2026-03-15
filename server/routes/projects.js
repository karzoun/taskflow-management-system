const express = require("express");
const Project = require("../models/Project");
const Task = require("../models/Task");
const auth = require("../middleware/auth");

const router = express.Router();

const VALID_STATUSES = ["planned", "in-progress", "done"];

// All routes require authentication
router.use(auth);

// GET /projects - list ALL projects (shared workspace)
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("GET /projects error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /projects - create new project (ownerId stored for audit)
router.post("/", async (req, res) => {
  try {
    const { title, description, status, startDate, endDate } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (title.trim().length > 100) {
      return res.status(400).json({ error: "Title must be 100 characters or fewer" });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const project = new Project({
      ownerId: req.user.userId,
      title: title.trim(),
      description: description ? String(description).trim() : "",
      status: status || "planned",
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error("POST /projects error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /projects/:id - any authenticated user can access
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    console.error("GET /projects/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /projects/:id - any authenticated user can rename/update
router.put("/:id", async (req, res) => {
  try {
    const { title, description, status, startDate, endDate } = req.body;

    const update = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      if (title.trim().length > 100) {
        return res.status(400).json({ error: "Title must be 100 characters or fewer" });
      }
      update.title = title.trim();
    }

    if (description !== undefined) update.description = String(description).trim();
    if (startDate !== undefined) update.startDate = startDate || null;
    if (endDate !== undefined) update.endDate = endDate || null;

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
      }
      update.status = status;
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    console.error("PUT /projects/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /projects/:id - delete project and all its tasks
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    await Task.deleteMany({ projectId: req.params.id });
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("DELETE /projects/:id error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
