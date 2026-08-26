const express = require("express");
const FollowUp = require("../models/FollowUp");
const Lead = require("../models/Lead");

const router = express.Router();

// Add a follow-up to a lead
router.post("/:leadId", async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const followUp = new FollowUp({
      lead: leadId,
      date: req.body.date,
      followUpType: req.body.followUpType,
      remarks: req.body.remarks,
      nextFollowUpDate: req.body.nextFollowUpDate || null,
    });

    const savedFollowUp = await followUp.save();

    res.status(201).json({
      message: "Follow-up added successfully",
      followUp: savedFollowUp,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to add follow-up",
      error: error.message,
    });
  }
});

// Get all follow-ups for a lead
router.get("/:leadId", async (req, res) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    const followUps = await FollowUp.find({
      lead: leadId,
    }).sort({ date: -1 });

    res.status(200).json({
      count: followUps.length,
      followUps,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch follow-ups",
      error: error.message,
    });
  }
});

module.exports = router;