const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    followUpType: {
      type: String,
      required: true,
      trim: true,
    },

    remarks: {
      type: String,
      required: true,
      trim: true,
    },

    nextFollowUpDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FollowUp", followUpSchema);