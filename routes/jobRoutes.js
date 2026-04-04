const express = require("express");
const router = express.Router();

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

} = require("../controllers/jobController");


// POST job
router.post("/post-job", createJob);


// GET jobs (with filters)
router.get("/get-jobs", getJobs);


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


module.exports = router;