const express = require("express");
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const Task = require("../models/Task");

const router = express.Router();

router.use(auth);

// GET /analytics/summary — workspace-wide counts
router.get("/summary", async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments({});

    if (totalProjects === 0) {
      return res.json({
        totalProjects: 0,
        totalTasks: 0,
        tasksByStatus: { todo: 0, inProgress: 0, done: 0 },
      });
    }

    const [totalTasks, todoCount, inProgressCount, doneCount] = await Promise.all([
      Task.countDocuments({}),
      Task.countDocuments({ status: "todo" }),
      Task.countDocuments({ status: "in-progress" }),
      Task.countDocuments({ status: "done" }),
    ]);

    res.json({
      totalProjects,
      totalTasks,
      tasksByStatus: { todo: todoCount, inProgress: inProgressCount, done: doneCount },
    });
  } catch (err) {
    console.error("GET /analytics/summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /analytics/my-tasks — tasks assigned to the current user across all projects
router.get("/my-tasks", async (req, res) => {
  try {
    const tasks = await Task.find({ assigneeId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate("projectId", "title");
    res.json(tasks);
  } catch (err) {
    console.error("GET /analytics/my-tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
