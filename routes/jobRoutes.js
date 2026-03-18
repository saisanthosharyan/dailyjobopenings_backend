const express = require("express");
const router = express.Router();

const {
  createJob,
  getJobs,
  getJobBySlug,
  getLatestJobs,
  getSimilarJobs
} = require("../controllers/jobController");


// POST job
router.post("/post-job", createJob);


// GET jobs (with filters)
router.get("/jobs", getJobs);


// GET job details
router.get("/view-job/:slug", getJobBySlug);
router.get("/get-latest-jobs", getLatestJobs);
router.get("/similar-jobs/:jobId", getSimilarJobs);


module.exports = router;