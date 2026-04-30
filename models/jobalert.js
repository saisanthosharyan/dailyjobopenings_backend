const mongoose = require("mongoose");

const jobAlertSchema = new mongoose.Schema({
  //basic deatils of the users
  email: { type: String, required: true , unique: true},
  jobCategory: [String],
  jobRole: [String],
  location: [String],
  workMode: [String],
  eligibleBatches: [String],

  //verification and control goes here
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },

  token: { type: String },
  tokenType: {
    type: String,
    enum: ["verify","edit","unsubscribe"],
    default: "null"
  },
  tokenExpiry: { type: Date },

}, { timestamps: true });

jobAlertSchema.index({ email: 1 });

module.exports = mongoose.model("JobAlert", jobAlertSchema);