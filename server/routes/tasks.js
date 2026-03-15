const express = require("express");
const Task = require("../models/Task");
const Project = require("../models/Project");
const auth = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

const VALID_STATUSES = ["todo", "in-progress", "done"];
const VALID_PRIORITIES = ["low", "medium", "high"];

router.use(auth);

// Helper: ensure project exists (shared workspace — no ownership check)
async function ensureProjectExists(projectId) {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }
  return project;
}

// GET /projects/:projectId/tasks
router.get("/", async (req, res) => {
  try {
    const { projectId } = req.params;
    await ensureProjectExists(projectId);

    const tasks = await Task.find({ projectId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error("GET /tasks error:", err);
    res.status(err.statusCode || 500).json({ error: err.message || "Server error" });
  }
});

// POST /projects/:projectId/tasks
router.post("/", async (req, res) => {
  try {
    const { projectId } = req.params;
    await ensureProjectExists(projectId);

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({ error: "Title must be 200 characters or fewer" });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
    }

    const resolvedStatus = status || "todo";

    const task = new Task({
      projectId,
      title: title.trim(),
      description: description ? String(description).trim() : "",
      status: resolvedStatus,
      priority: priority || "medium",
      dueDate: dueDate || undefined,
      assigneeId: assigneeId || null,
      completedAt: resolvedStatus === "done" ? new Date() : null,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    console.error("POST /tasks error:", err);
    res.status(err.statusCode || 500).json({ error: err.message || "Server error" });
  }
});

// PUT /projects/:projectId/tasks/:taskId
router.put("/:taskId", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    await ensureProjectExists(projectId);

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const update = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({ error: "Title must be 200 characters or fewer" });
      }
      update.title = title.trim();
    }

    if (description !== undefined) update.description = String(description).trim();
    if (dueDate !== undefined) update.dueDate = dueDate || null;
    if (assigneeId !== undefined) update.assigneeId = assigneeId || null;

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
      }
      update.status = status;
      update.completedAt = status === "done" ? new Date() : null;
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({ error: `Priority must be one of: ${VALID_PRIORITIES.join(", ")}` });
      }
      update.priority = priority;
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, projectId },
      { $set: update },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (err) {
    console.error("PUT /tasks/:taskId error:", err);
    res.status(err.statusCode || 500).json({ error: err.message || "Server error" });
  }
});

// DELETE /projects/:projectId/tasks/:taskId
router.delete("/:taskId", async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    await ensureProjectExists(projectId);

    const result = await Task.findOneAndDelete({ _id: taskId, projectId });
    if (!result) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted" });
  } catch (err) {
    console.error("DELETE /tasks/:taskId error:", err);
    res.status(err.statusCode || 500).json({ error: err.message || "Server error" });
  }
});

module.exports = router;
