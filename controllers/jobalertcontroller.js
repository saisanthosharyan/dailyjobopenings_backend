const JobAlert = require("../models/jobalert");
const sendEmail = require("../utils/sendemail"); // we’ll create this

exports.subscribeJobAlert = async (req, res) => {
  try {
    const {
      email,
      jobCategory,
      jobRole,
      location,
      workMode,
      eligibleBatches
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 🔥 Check if already exists
    let existing = await JobAlert.findOne({ email });

    if (existing) {
      // update preferences instead of duplicate
      existing.jobCategory = jobCategory || existing.jobCategory;
      existing.jobRole = jobRole || existing.jobRole;
      existing.location = location || existing.location;
      existing.workMode = workMode || existing.workMode;
      existing.eligibleBatches = eligibleBatches || existing.eligibleBatches;

      await existing.save();
    } else {
      await JobAlert.create({
        email,
        jobCategory,
        jobRole,
        location,
        workMode,
        eligibleBatches
      });
    }

    // 📩 Send confirmation email
    await sendEmail(
      email,
      "Job Alert Subscription Confirmed 🚀",
      `
      <h2>You're all set!</h2>
      <p>Your customized job alerts are now active on <b>Daily Job Openings</b>.</p>
      <p>We’ll notify you when matching jobs are posted.</p>
      `
    );

    res.json({ message: "Subscribed successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};