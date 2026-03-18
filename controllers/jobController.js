const Job = require("../models/job");
const slugify = require("slugify");


// CREATE JOB
const createJob = async (req, res) => {
  try {

    const { companyName, jobTitle, location, jobRole, experienceLevel, eligibleBatches } = req.body;

    const slug = slugify(`${companyName}-${jobTitle}-${location}-${jobRole}-${experienceLevel}-${eligibleBatches}`, {
      lower: true,
      strict: true
    });

    const job = new Job({
      ...req.body,
      slug
    });

    const savedJob = await job.save();

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: savedJob
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error creating job",
      error: error.message
    });

  }
};



// GET ALL JOBS + FILTER
const getJobs = async (req, res) => {
  try {

    const query = {};

    if (req.query.experienceLevel) {
      query.experienceLevel = req.query.experienceLevel;
    }

    if (req.query.jobType) {
      query.jobType = req.query.jobType;
    }

    if (req.query.jobCategory) {
      query.jobCategory = req.query.jobCategory;
    }

    if (req.query.workMode) {
      query.workMode = req.query.workMode;
    }

    if (req.query.location) {
      query.location = req.query.location;
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      results: jobs.length,
      data: jobs
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message
    });

  }
};



// GET JOB BY SLUG
const getJobBySlug = async (req, res) => {
  try {

    const job = await Job.findOne({ slug: req.params.slug });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Error fetching job",
      error: error.message
    });

  }
};

// GET /api/jobs/latest this controller is for homepage to show latest 3 jobs with only title and company name for alert bar
const getLatestJobs = async (req, res) => {
  try {
    const jobs = await Job.find({})
      .sort({ createdAt: -1 }) // latest first
      .limit(3) // only 3 jobs
      .select("companyName"); // only required fields

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching latest jobs:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET /api/jobs/similar/:jobId this controller is for fetching the similar jobs in view jobs page
const getSimilarJobs = async (req, res) => {
  try {
    const { jobId } = req.params;

    // 1. Get current job
    const currentJob = await Job.findById(jobId);

    if (!currentJob) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // 2. Fetch candidate jobs (filtered, not full DB)
    const candidates = await Job.find({
      _id: { $ne: jobId },
      experienceLevel: currentJob.experienceLevel, // basic filter
    }).limit(20); // limit for performance

    // 3. Apply scoring
    const scoredJobs = candidates.map((job) => {
      let score = 0;

      // 🔥 Role match (partial match)
      if (
        job.jobTitle.toLowerCase().includes(currentJob.jobTitle.toLowerCase()) ||
        currentJob.jobTitle.toLowerCase().includes(job.jobTitle.toLowerCase())
      ) {
        score += 5;
      }

      // 🔥 Skills match
      if (job.skills && currentJob.skills) {
        const commonSkills = job.skills.filter((skill) =>
          currentJob.skills.includes(skill)
        );
        score += commonSkills.length * 2;
      }

      // 🔥 Location match
      if (job.location === currentJob.location) {
        score += 2;
      }

      // 🔥 Work mode match
      if (job.workMode === currentJob.workMode) {
        score += 1;
      }

      return {
        ...job.toObject(),
        score,
      };
    });

    // 4. Sort by score (highest first)
    scoredJobs.sort((a, b) => b.score - a.score);

    // 5. Return top 5
    const similarJobs = scoredJobs.slice(0, 5);

    res.status(200).json({
      success: true,
      count: similarJobs.length,
      jobs: similarJobs,
    });
  } catch (error) {
    console.error("Error fetching similar jobs:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobBySlug,
  getLatestJobs,
  getSimilarJobs
};