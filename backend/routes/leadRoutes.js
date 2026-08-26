const express = require("express");
const Lead = require("../models/Lead");

const router = express.Router();

// Create a new lead
router.post("/", async (req, res) => {
  try {
    const lead = new Lead(req.body);
    const savedLead = await lead.save();

    res.status(201).json({
      message: "Lead created successfully",
      lead: savedLead,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create lead",
      error: error.message,
    });
  }
});

// Get all leads with search, filter and sorting
router.get("/", async (req, res) => {
  try {
    const {
      search,
      status,
      service,
      assignedTo,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // Build search/filter query
    const query = {};

    // Search by lead name, company name, mobile or email
    if (search) {
      query.$or = [
        { leadName: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by service
    if (service) {
      query.service = service;
    }

    // Filter by assigned person
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }

    // Allow only safe sorting fields
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "estimatedValue",
      "leadName",
      "companyName",
    ];

    const selectedSortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;

    const leads = await Lead.find(query).sort({
      [selectedSortField]: sortOrder,
    });

    res.status(200).json({
      count: leads.length,
      leads,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch leads",
      error: error.message,
    });
  }
});

// Update a lead
router.put("/:id", async (req, res) => {
  try {
    const updatedLead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedLead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    res.status(200).json({
      message: "Lead updated successfully",
      lead: updatedLead,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update lead",
      error: error.message,
    });
  }
});

// Delete a lead
router.delete("/:id", async (req, res) => {
  try {
    const deletedLead = await Lead.findByIdAndDelete(req.params.id);

    if (!deletedLead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    res.status(200).json({
      message: "Lead deleted successfully",
      lead: deletedLead,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete lead",
      error: error.message,
    });
  }
});

module.exports = router;