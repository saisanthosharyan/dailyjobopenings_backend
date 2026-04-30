// const JobAlert = require("../models/jobalert");
// const sendEmail = require("../utils/sendemail"); // we’ll create this
// const asyncHandler = require("../utils/asyncHandler"); // we’ll create this too

// exports.subscribeJobAlert = asyncHandler(async (req, res) => {
//   try {
//     const {
//       email,
//       jobCategory,
//       jobRole,
//       location,
//       workMode,
//       eligibleBatches
//     } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required" });
//     }

//     // 🔥 Check if already exists
//     let existing = await JobAlert.findOne({ email });

//     if (existing) {
//       // update preferences instead of duplicate
//       existing.jobCategory = jobCategory || existing.jobCategory;
//       existing.jobRole = jobRole || existing.jobRole;
//       existing.location = location || existing.location;
//       existing.workMode = workMode || existing.workMode;
//       existing.eligibleBatches = eligibleBatches || existing.eligibleBatches;

//       await existing.save();
//     } else {
//       await JobAlert.create({
//         email,
//         jobCategory,
//         jobRole,
//         location,
//         workMode,
//         eligibleBatches
//       });
//     }

//     // 📩 Send confirmation email
//     await sendEmail(
//       email,
//       "Job Alert Subscription Confirmed 🚀",
//       `
//       <h2>You're all set!</h2>
//       <p>Your customized job alerts are now active on <b>Daily Job Openings</b>.</p>
//       <p>We’ll notify you when matching jobs are posted.</p>
//       `
//     );

//     res.json({ message: "Subscribed successfully" });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

const crypto = require("crypto");
const JobAlert = require("../models/jobalert");
const sendEmail = require("../utils/sendemail");
const asyncHandler = require("../utils/asyncHandler");


exports.subscribeJobAlert = asyncHandler(async (req, res) => {
  let {
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

  // ✅ normalize email (IMPORTANT)
  email = email.toLowerCase().trim();

  const token = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  let user = await JobAlert.findOne({ email });

  // ===============================
  // 🟢 CASE 1: USER EXISTS
  // ===============================
  if (user) {

    // ✅ If already verified & active → just update preferences
    if (user.isVerified && user.isActive) {
      user.jobCategory = jobCategory || user.jobCategory;
      user.jobRole = jobRole || user.jobRole;
      user.location = location || user.location;
      user.workMode = workMode || user.workMode;
      user.eligibleBatches = eligibleBatches || user.eligibleBatches;

      await user.save();

      return res.json({
        message: "Preferences updated successfully (already subscribed)"
      });
    }

    // ⚠️ If not verified → re-send verification
    user.jobCategory = jobCategory || user.jobCategory;
    user.jobRole = jobRole || user.jobRole;
    user.location = location || user.location;
    user.workMode = workMode || user.workMode;
    user.eligibleBatches = eligibleBatches || user.eligibleBatches;

    user.isVerified = false;
    user.isActive = false;
    user.token = token;
    user.tokenType = "verify";
    user.tokenExpiry = tokenExpiry;

    await user.save();
  }

  // ===============================
  // 🟢 CASE 2: NEW USER
  // ===============================
  else {
    await JobAlert.create({
      email,
      jobCategory,
      jobRole,
      location,
      workMode,
      eligibleBatches,

      isVerified: false,
      isActive: false,
      token,
      tokenType: "verify",
      tokenExpiry
    });
  }

  // ===============================
  // 📩 SEND VERIFICATION EMAIL
  // ===============================

  const verifyURL = `${process.env.FRONTEND_URL}/user/verify-job-alert?token=${token}`;

  await sendEmail(
    email,
    "Verify Your Job Alerts 🔐",
    `
      <h2>Confirm Your Job Alerts</h2>
      <p>Click below to activate your job alerts:</p>
      <a href="${verifyURL}" target="_blank">Verify Now</a>
      <p>This link will expire in 1 hour.</p>
    `
  );

  return res.json({
    message: "Verification email sent. Please check your inbox."
  });
});

exports.verifyJobAlert = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Invalid token" });
  }

  const user = await JobAlert.findOne({
    token,
    tokenType: "verify",
    tokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Token expired or invalid" });
  }

  // ✅ activate user
  user.isVerified = true;
  user.isActive = true;
  user.token = null;
  user.tokenType = null;
  user.tokenExpiry = null;

  await user.save();

  // 📩 confirmation email
  await sendEmail(
    user.email,
    "Job Alerts Activated ✅",
    `
      <h2>You're all set!</h2>
      <p>Your job alerts are now active.</p>
      <p>You’ll start receiving matching jobs soon 🚀</p>
    `
  );

  res.json({ message: "Email verified successfully" });
});

exports.sendEditLink = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await JobAlert.findOne({ email });

  if (!user || !user.isActive) {
    return res.status(404).json({ message: "No active subscription found" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hr

  user.token = token;
  user.tokenType = "edit";
  user.tokenExpiry = tokenExpiry;

  await user.save();

  const editURL = `${process.env.FRONTEND_URL}/user/edit-job-alert?token=${token}`;

  await sendEmail(
    email,
    "Edit Your Job Alerts ✏️",
    `
      <h2>Update Your Preferences</h2>
      <p>Click below to edit your job alerts:</p>
      <a href="${editURL}" target="_blank">Edit Preferences</a>
      <p>This link expires in 1 hour.</p>
    `
  );

  res.json({ message: "Edit link sent to your email" });
});

exports.getJobAlertByToken = asyncHandler(async (req, res) => {
  const { token } = req.query;

  const user = await JobAlert.findOne({
    token,
    tokenType: "edit",
    tokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired link" });
  }

  res.json({
    email: user.email,
    jobCategory: user.jobCategory,
    jobRole: user.jobRole,
    location: user.location,
    workMode: user.workMode,
    eligibleBatches: user.eligibleBatches
  });
});

exports.updateJobAlert = asyncHandler(async (req, res) => {
  const { token } = req.query;

  const {
    jobCategory,
    jobRole,
    location,
    workMode,
    eligibleBatches
  } = req.body;

  const user = await JobAlert.findOne({
    token,
    tokenType: "edit",
    tokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  user.jobCategory = jobCategory || user.jobCategory;
  user.jobRole = jobRole || user.jobRole;
  user.location = location || user.location;
  user.workMode = workMode || user.workMode;
  user.eligibleBatches = eligibleBatches || user.eligibleBatches;

  // 🔄 clear token after use
  user.token = null;
  user.tokenType = null;
  user.tokenExpiry = null;

  await user.save();

  res.json({ message: "Preferences updated successfully" });
});

exports.unsubscribeJobAlert = asyncHandler(async (req, res) => {
  const { token } = req.query;

  const user = await JobAlert.findOne({
    token,
    tokenType: "unsubscribe",
    tokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired link" });
  }

  user.isActive = false;

  // clear token
  user.token = null;
  user.tokenType = null;
  user.tokenExpiry = null;

  await user.save();

  res.json({ message: "You have been unsubscribed successfully" });
});