const express = require("express");
const router = express.Router();
const Visitor = require("../models/Visitor");

// Track a page visit
router.post("/track", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown";

    const { page } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const visitor = new Visitor({
      ip,
      page,
      date: today
    });

    await visitor.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Tracking failed" });
  }
});

// Unique visitors (all time)
router.get("/unique", async (req, res) => {
  try {
    const unique = await Visitor.distinct("ip");
    res.json({ uniqueVisitors: unique.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unique visitors" });
  }
});

// Daily visitors
router.get("/daily", async (req, res) => {
  try {
    const result = await Visitor.aggregate([
      {
        $group: {
          _id: "$date",
          count: { $addToSet: "$ip" }
        }
      },
      {
        $project: {
          date: "$_id",
          visitors: { $size: "$count" },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily visitors" });
  }
});

// Page-wise visits
router.get("/pages", async (req, res) => {
  try {
    const result = await Visitor.aggregate([
      {
        $group: {
          _id: "$page",
          visits: { $sum: 1 }
        }
      },
      {
        $project: {
          page: "$_id",
          visits: 1,
          _id: 0
        }
      }
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch page analytics" });
  }
});

module.exports = router;
