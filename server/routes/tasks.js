const express = require("express");
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/auth");

// mergeParams: true lets us access :projectId passed from index.js
const router = express.Router({ mergeParams: true });

// All task routes require authentication
router.use(auth);

// Helper: ensure project belongs to current user
async function ensureProjectOwnership(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, ownerId: userId });
  if (!project) {
    const error = new Error("Project not found or not authorized");
    error.statusCode = 404;
    throw error;
  }
  return project;
}

// GET /projects/:projectId/tasks - list tasks for this project
router.get("/", async (req, res) => {
  try {
    const { projectId } = req.params;
    await ensureProjectOwnership(projectId, req.user.userId);

    const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("GET /tasks error:", err);
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Server error" });
  }
});

// POST /projects/:projectId/tasks - create a new task in this project
router.post("/", async (req, res) => {
  try {
    const { projectId } = req.params;
    await ensureProjectOwnership(projectId, req.user.userId);

    const { title, description, status, priority, dueDate, assigneeId } =
      req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = new Task({
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId: assigneeId || null,
      completedAt:
        status === "done" ? new Date() : null,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error("POST /tasks error:", err);
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Server error" });
  }
});

// PUT /projects/:projectId/tasks/:taskId - update a task
router.put("/:taskId", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    await ensureProjectOwnership(projectId, req.user.userId);

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
    } = req.body;

    const update = {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId: assigneeId || null,
    };

    // Handle completedAt when status changes
    if (status === "done") {
      update.completedAt = new Date();
    } else if (status && status !== "done") {
      update.completedAt = null;
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, projectId },
      update,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (err) {
    console.error("PUT /tasks/:taskId error:", err);
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Server error" });
  }
});

// DELETE /projects/:projectId/tasks/:taskId - delete a task
router.delete("/:taskId", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    await ensureProjectOwnership(projectId, req.user.userId);

    const result = await Task.findOneAndDelete({ _id: taskId, projectId });

    if (!result) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("DELETE /tasks/:taskId error:", err);
    res
      .status(err.statusCode || 500)
      .json({ message: err.message || "Server error" });
  }
});

module.exports = router;
