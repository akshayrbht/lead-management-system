const express = require("express");
const Lead = require("../models/Lead");

const router = express.Router();

// Dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();

    const newLeads = await Lead.countDocuments({
      status: "New",
    });

    const contactedLeads = await Lead.countDocuments({
      status: "Contacted",
    });

    const proposalSentLeads = await Lead.countDocuments({
      status: "Proposal Sent",
    });

    const negotiationLeads = await Lead.countDocuments({
      status: "Negotiation",
    });

    const wonLeads = await Lead.countDocuments({
      status: "Won",
    });

    const lostLeads = await Lead.countDocuments({
      status: "Lost",
    });

    const potentialValueResult = await Lead.aggregate([
      {
        $match: {
          status: {
            $ne: "Lost",
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$estimatedValue",
          },
        },
      },
    ]);

    const wonValueResult = await Lead.aggregate([
      {
        $match: {
          status: "Won",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$estimatedValue",
          },
        },
      },
    ]);

    const potentialBusinessValue =
      potentialValueResult.length > 0
        ? potentialValueResult[0].total
        : 0;

    const wonBusinessValue =
      wonValueResult.length > 0
        ? wonValueResult[0].total
        : 0;

    res.status(200).json({
      totalLeads,
      newLeads,
      contactedLeads,
      proposalSentLeads,
      negotiationLeads,
      wonLeads,
      lostLeads,
      potentialBusinessValue,
      wonBusinessValue,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
});

module.exports = router;
