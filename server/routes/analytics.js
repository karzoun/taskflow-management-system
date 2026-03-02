const express = require("express");
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const Task = require("../models/Task");

const router = express.Router();

// All analytics routes require auth
router.use(auth);

// GET /analytics/summary
// Returns counts for projects and tasks by status for the current user
router.get("/summary", async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all projects for this user
    const projects = await Project.find({ ownerId: userId }).select("_id");
    const projectIds = projects.map((p) => p._id);

    if (projectIds.length === 0) {
      return res.json({
        totalProjects: 0,
        totalTasks: 0,
        tasksByStatus: {
          todo: 0,
          inProgress: 0,
          done: 0,
        },
      });
    }

    const [totalTasks, todoCount, inProgressCount, doneCount] =
      await Promise.all([
        Task.countDocuments({ projectId: { $in: projectIds } }),
        Task.countDocuments({
          projectId: { $in: projectIds },
          status: "todo",
        }),
        Task.countDocuments({
          projectId: { $in: projectIds },
          status: "in-progress",
        }),
        Task.countDocuments({
          projectId: { $in: projectIds },
          status: "done",
        }),
      ]);

    res.json({
      totalProjects: projects.length,
      totalTasks,
      tasksByStatus: {
        todo: todoCount,
        inProgress: inProgressCount,
        done: doneCount,
      },
    });
  } catch (err) {
    console.error("GET /analytics/summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;