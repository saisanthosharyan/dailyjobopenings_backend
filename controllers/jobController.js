const Job = require("../models/job");
const slugify = require("slugify");
const JobAlert = require("../models/jobalert");
const sendEmail = require("../utils/sendemail");

// CREATE JOB
const createJob = async (req, res) => {
  try {
    const {
      companyName,
      jobTitle,
      location,
      jobRole,
      experienceLevel,
      eligibleBatches,
      jobCategory,
      workMode
    } = req.body;

    const slug = slugify(
      `${companyName}-${jobTitle}-${location}-${jobRole}-${experienceLevel}-${eligibleBatches}`,
      { lower: true, strict: true }
    );

    const job = new Job({
      ...req.body,
      slug
    });

    const savedJob = await job.save();

    // 🔥 TRIGGER ALERT SYSTEM
    await sendJobAlerts(savedJob);

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
// const getJobBySlug = async (req, res) => {
//   try {

//     const job = await Job.findOne({ slug: req.params.slug });

//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: "Job not found"
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: job
//     });

//   } catch (error) {

//     res.status(500).json({
//       success: false,
//       message: "Error fetching job",
//       error: error.message
//     });

//   }
// };

const getJobBySlug = async (req, res) => {
  try {
    const job = await Job.findOne({ slug: req.params.slug });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const now = new Date();

    // ✅ 1. Check closed
    if (job.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This job is closed"
      });
    }

    // ✅ 2. Check expired (DB status OR safety check)
    const isExpired =
      job.status === "expired" ||
      (job.expiryDate && job.expiryDate < now);

    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "This job has expired"
      });
    }

    // ✅ 3. If active → return job
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

// This is an additional controller to fetch only active jobs for the alert bar on homepage
const getActiveJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "active" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching active jobs",
      error: error.message
    });
  }
};

// This is an additional controller to fetch only expired jobs for the admin panel
const getExpiredJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "expired" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching expired jobs",
      error: error.message
    });
  }
};

//this is an controller to fetch the stats for the landing page
const getStats = async (req, res) => {
  try {
    const now = new Date();

    // ✅ Active Jobs
    const activeJobs = await Job.countDocuments({
      status: "active",
      expiryDate: { $gte: now }
    });

    // ✅ Companies Count (unique)
    const companies = await Job.distinct("companyName");

    // ✅ New Jobs (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const newJobs = await Job.countDocuments({
      createdAt: { $gte: last7Days }
    });

    res.status(200).json({
      success: true,
      data: {
        activeJobs,
        companies: companies.length,
        newJobs
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching stats",
      error: error.message
    });
  }
};

//this is used to fetch the quick job categories in app.jsx page
const getJobCategories = async (req, res) => {
  try {
    const categories = [
      {
        label: "Software IT Jobs",
        count: await Job.countDocuments({ jobCategory: "IT" })
      },
      {
        label: "Work From Home",
        count: await Job.countDocuments({ workMode: "Remote" })
      },
      {
        label: "Government Jobs",
        count: await Job.countDocuments({ jobCategory: "Government" })
      },
      {
        label: "MBA / BBA Jobs",
        count: await Job.countDocuments({
          education: { $regex: /MBA|BBA/i }
        })
      },
      {
        label: "Internships",
        count: await Job.countDocuments({ jobType: "Internship" })
      },
      {
        label: "Walk-in Jobs",
        count: await Job.countDocuments({
          tags: { $in: ["walk-in"] }
        })
      },
      {
        label: "Data Analyst Jobs",
        count: await Job.countDocuments({
          jobRole: { $regex: /data/i }
        })
      },
      {
        label: "Non-Engineering",
        count: await Job.countDocuments({
          jobCategory: { $ne: "IT" }
        })
      }
    ];

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message
    });
  }
};

//this is top hiring companies controller for the landing page.
const getTopCompanies = async (req, res) => {
  try {
    const companies = await Job.aggregate([
      {
        $match: {
          status: "active"
        }
      },
      {
        $group: {
          _id: "$companyName",
          count: { $sum: 1 },
          logo: { $first: "$companyLogo" },
          website: { $first: "$companyWebsite" }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // format response
    const formatted = companies.map((c) => ({
      name: c._id,
      count: c.count,
      logo: c.logo,
      website: c.website
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching top companies",
      error: error.message
    });
  }
};

//get jobs by location controller for the landing page
const getJobsByLocation = async (req, res) => {
  try {
    const locations = await Job.aggregate([
      {
        $match: {
          status: "active",
          expiryDate: { $gte: new Date() }
        }
      },
      {
        $group: {
          _id: "$location",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 7
      }
    ]);

    const formatted = locations.map((l) => ({
      label: l._id,
      count: l.count
    }));

    res.status(200).json({
      success: true,
      data: formatted
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching locations",
      error: error.message
    });
  }
};

const sendJobAlerts = async (job) => {
  try {
    const alerts = await JobAlert.find();

    const matchedUsers = alerts.filter(alert => {
      let score = 0;

      if (alert.jobCategory?.includes(job.jobCategory)) score++;
      if (alert.jobRole?.includes(job.jobRole)) score++;
      if (alert.location?.includes(job.location)) score++;
      if (alert.workMode?.includes(job.workMode)) score++;
      if (alert.eligibleBatches?.includes(job.eligibleBatches)) score++;

      return score >= 2; // 🔥 minimum 2 matches (tune this)
    });

    // 📩 Send emails
    for (const user of matchedUsers) {
      await sendEmail(
        user.email,
        `🔥 New Job Alert: ${job.jobTitle}`,
        `
        <h2>${job.jobTitle}</h2>
        <p><b>Company:</b> ${job.companyName}</p>
        <p><b>Location:</b> ${job.location}</p>
        <p><b>Experience:</b> ${job.experienceLevel}</p>
        <p><b>Type:</b> ${job.jobType}</p>

        <a href="${job.jobLink}" style="color:blue;">
          Apply Now
        </a>

        <p style="margin-top:10px;">Good luck 🚀</p>
        `
      );
    }

  } catch (err) {
    console.error("Error sending job alerts:", err);
  }
};

const subscribeJobAlert = async (req, res) => {
  try {
    const data = req.body;

    let existing = await JobAlert.findOne({ email: data.email });

    if (existing) {
      await JobAlert.updateOne({ email: data.email }, data);
    } else {
      await JobAlert.create(data);
    }

    // 📩 Confirmation email
    await sendEmail(
      data.email,
      "✅ Job Alert Activated",
      `
      <h2>You're all set! 🎯</h2>
      <p>Your job alerts are now active on <b>Daily Job Openings</b>.</p>
      `
    );

    res.json({ message: "Subscribed successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const CATEGORY_FILTERS = {
  fresher: { experienceLevel: "0-1 Years" },
  experienced: { experienceLevel: { $ne: "0-1 Years" } },
  remote: { workMode: "Remote" },
  "part-time": { jobType: "Part-Time" },
  "full-time": { jobType: "Full-Time" },
  urgent: { badge: "hot" },
  abroad: {
    location: { $regex: "USA|UK|Canada|Germany|Australia", $options: "i" },
  },
};

const getJobsByCategories = async (req, res) => {
  try {
    let { category, page = 1, limit = 10 } = req.query;

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Support multiple categories
    const categories = category.split(",");

    // Build OR conditions
    const categoryQueries = categories.map((cat) => {
      return CATEGORY_FILTERS[cat] || {};
    });

    // Base query
    const query = {
      status: "active",
      expiryDate: { $gte: new Date() },
      $or: categoryQueries,
    };

    // Pagination
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ postedDate: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select(
          "jobTitle companyName location salary slug badge workMode jobType experienceLevel"
        ),

      Job.countDocuments(query),
    ]);

    res.status(200).json({
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
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
  sendJobAlerts,
  subscribeJobAlert,
  getJobsByCategories
};