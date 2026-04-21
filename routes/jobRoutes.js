const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authmiddleware");
const allowRoles = require("../middlewares/rolemiddleware");

const {
  createJob,
  getJobs,
  getJobBySlug,
  getLatestJobs,
  getSimilarJobs,
  getActiveJobs,
  getExpiredJobs,
  getStats,
  getJobCategories,
  getTopCompanies,
  getJobsByLocation,
  getJobsByCategories,
  updateJob,
  deleteJob,
  closeJob,
  getTickerJobs,
  getDynamicCategories,

} = require("../controllers/jobController");


// POST job
router.post("/post-job", authMiddleware, allowRoles("admin", "super_admin"), createJob);
router.put("/update-job/:id", authMiddleware, allowRoles("admin", "super_admin"), updateJob);
router.delete("/delete-job/:id", authMiddleware, allowRoles("admin", "super_admin"), deleteJob);
router.patch("/close-job/:id", authMiddleware, allowRoles("admin", "super_admin"), closeJob);


// GET jobs (with filters)
router.get("/get-jobs", getJobs);
router.get("/browse-by-categories", getDynamicCategories);

// GET job details
router.get("/view-job/:slug", getJobBySlug);
router.get("/get-latest-jobs", getLatestJobs);
router.get("/similar-jobs/:jobId", getSimilarJobs);
router.get("/active-jobs", getActiveJobs);
router.get("/expired-jobs", getExpiredJobs);
router.get("/get-stats", getStats);
router.get("/quick-job-categories", getJobCategories);
router.get("/top-hiring-companies", getTopCompanies);
router.get("/jobs-by-location", getJobsByLocation);
router.get("/jobs-by-categories", getJobsByCategories);
router.get("/top-ticker-jobs", getTickerJobs);


module.exports = router;