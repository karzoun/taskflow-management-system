const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

router.use(auth);

// GET /users — return all registered users (id, name, email) for assignee dropdowns
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}).select("_id name email").sort({ name: 1 });
    res.json(users);
  } catch (err) {
    console.error("GET /users error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
