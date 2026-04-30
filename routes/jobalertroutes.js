const express = require("express");
const router = express.Router();

const {
  subscribeJobAlert,
  verifyJobAlert,
  sendEditLink,
  getJobAlertByToken,
  updateJobAlert,
  unsubscribeJobAlert
} = require("../controllers/jobalertcontroller");

// ✅ Subscribe (send verification email)
router.post("/subscribe-to-job-alerts", subscribeJobAlert);

// ✅ Verify email (activate subscription)
router.get("/verify-job-alert", verifyJobAlert);

// ✅ Send edit link to email
router.post("/edit-request-for-job-alerts", sendEditLink);

// ✅ Get existing preferences (via token)
router.get("/edit-job-alert", getJobAlertByToken);

// ✅ Update preferences
router.post("/update-job-alert", updateJobAlert);

// ✅ Unsubscribe (one-click link)
router.get("/unsubscribe-from-job-alerts", unsubscribeJobAlert);

module.exports = router;