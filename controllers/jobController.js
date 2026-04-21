const Job = require("../models/job");
const slugify = require("slugify");
const JobAlert = require("../models/jobalert");
const sendEmail = require("../utils/sendemail");
const asyncHandler = require("../utils/asyncHandler");
const redis = require("../utils/redisClient");
const { findOrCreateCompany } = require("../services/companyService");

// CREATE JOB
const createJob = asyncHandler(async (req, res) => {
  try {
    const {
      companyName,
      jobTitle,
      location,
      jobRole,
      experienceLevel,
      eligibleBatches
    } = req.body;

    if (!companyName || !jobTitle || !location) {
      return res.status(400).json({
        message: "Company name, job title and location are required"
      });
    }

    // 🔹 Get OR create company (based on your flow)
    const company = await findOrCreateCompany(req.body, req.admin._id);

    // 🔹 Slug
    const slug = slugify(
      `${company.companyName}-${jobTitle}-${location}-${jobRole || ""}-${experienceLevel || ""}-${eligibleBatches || ""}`,
      { lower: true, strict: true }
    );

    const existingSlug = await Job.findOne({ slug });

    if (existingSlug) {
      return res.status(400).json({
        message: "Similar job already exists"
      });
    }

    const job = new Job({
      ...req.body,

      // 🔥 Link + cache
      company: company._id,
      companyName: company.companyName,
      companyLogo: company.companyLogo,

      slug,
      createdBy: req.admin._id,
      postedDate: new Date(),
    });

    const savedJob = await job.save();

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
});

const updateJob = asyncHandler(async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }
    if (job.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "cannot update a closed job",
      })
    }

    // Update fields
    Object.keys(req.body).forEach((key) => {
      job[key] = req.body[key];
    });

    // 🔄 Regenerate slug if important fields changed
    if (
      req.body.companyName ||
      req.body.jobTitle ||
      req.body.location ||
      req.body.jobRole ||
      req.body.experienceLevel ||
      req.body.eligibleBatches
    ) {
      job.slug = slugify(
        `${job.companyName}-${job.jobTitle}-${job.location}-${job.jobRole}-${job.experienceLevel}-${job.eligibleBatches}`,
        { lower: true, strict: true }
      );
    }

    const updatedJob = await job.save();

    res.json({
      success: true,
      message: "Job updated successfully",
      data: updatedJob,
    });
  } catch (error) {
    // Handle duplicate slug error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate job slug, try different values",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating job",
      error: error.message,
    });
  }
});

const deleteJob = asyncHandler(async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting job",
      error: error.message,
    });
  }
});

const closeJob = asyncHandler(async (req, res) => {
  try {
    const jobId = req.params.id;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "Job already closed",
      });
    }

    job.status = "closed";

    const updatedJob = await job.save();

    res.json({
      success: true,
      message: "Job closed successfully",
      data: updatedJob,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error closing job",
      error: error.message,
    });
  }
});

// GET ALL JOBS + FILTER
const getJobs = asyncHandler(async (req, res) => {
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
});

// const getJobBySlug = asyncHandler(async (req, res) => {
//   try {
//     const job = await Job.findOne({ slug: req.params.slug });

//     if (!job) {
//       return res.status(404).json({
//         success: false,
//         message: "Job not found"
//       });
//     }

//     const now = new Date();

//     // ✅ 1. Check closed
//     if (job.status === "closed") {
//       return res.status(400).json({
//         success: false,
//         message: "This job is closed"
//       });
//     }

//     // ✅ 2. Check expired (DB status OR safety check)
//     const isExpired =
//       job.status === "expired" ||
//       (job.expiryDate && job.expiryDate < now);

//     if (isExpired) {
//       return res.status(400).json({
//         success: false,
//         message: "This job has expired"
//       });
//     }

//     // ✅ 3. If active → return job
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
// });

const getDynamicCategories = asyncHandler(async (req, res) => {
  try {
    const cacheKey = "dynamic_categories_cache";

    // Attempt to get from Redis
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.status(200).json(JSON.parse(cached));
        }
      } catch (err) {
        // Safe fail
      }
    }

    // Group jobs by jobCategory
    const categories = await Job.aggregate([
      { 
        $match: { 
          status: "active", 
          expiresAt: { $gt: new Date() },
          jobCategory: { $ne: null, $ne: "" }
        } 
      },
      { 
        $group: { 
          _id: "$jobCategory", 
          count: { $sum: 1 } 
        } 
      },
      { 
        $project: { 
          name: "$_id", 
          count: 1, 
          _id: 0 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    // Get total active jobs
    const allJobsCount = await Job.countDocuments({
      status: "active",
      expiresAt: { $gt: new Date() }
    });

    const response = {
      success: true,
      categories: [
        { name: "All Jobs", count: allJobsCount },
        ...categories
      ]
    };

    // Attempt to set to Redis (300 seconds = 5 mins)
    if (redis) {
      try {
        await redis.set(cacheKey, JSON.stringify(response), "EX", 300);
      } catch (err) {
        // Safe fail
      }
    }

    res.status(200).json(response);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching job categories",
      error: error.message
    });
  }
});

const getJobBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const key = `job:${slug}`;

  // 🔍 1. Try Redis first
  try {
    const cached = await redis.get(key);
    if (cached) {
      const job = JSON.parse(cached);

      // ⚠️ Still validate (important)
      const now = new Date();

      if (job.status === "closed") {
        return res.status(400).json({
          success: false,
          message: "This job is closed",
        });
      }

      const isExpired =
        job.status === "expired" ||
        (job.expiryDate && new Date(job.expiryDate) < now);

      if (isExpired) {
        return res.status(400).json({
          success: false,
          message: "This job has expired",
        });
      }

      return res.status(200).json({
        success: true,
        data: job,
        source: "cache", // 🧪 for testing
      });
    }
  } catch (err) {
    logger.error("Redis GET error:", err);
  }

  // 🗄️ 2. Fetch from DB
  const job = await Job.findOne({ slug }).lean();

  if (!job) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  const now = new Date();

  // ✅ 1. Check closed
  if (job.status === "closed") {
    return res.status(400).json({
      success: false,
      message: "This job is closed",
    });
  }

  // ✅ 2. Check expired
  const isExpired =
    job.status === "expired" ||
    (job.expiryDate && job.expiryDate < now);

  if (isExpired) {
    return res.status(400).json({
      success: false,
      message: "This job has expired",
    });
  }

  // 💾 3. Store in Redis (TTL = 5 min)
  try {
    await redis.set(key, JSON.stringify(job), "EX", 300);
  } catch (err) {
    logger.error("Redis SET error:", err);
  }

  // ✅ 4. Send response
  res.status(200).json({
    success: true,
    data: job,
    source: "db", // 🧪 for testing
  });
});

// GET /api/jobs/latest this controller is for homepage to show latest 3 jobs with only title and company name for alert bar
const getLatestJobs = asyncHandler(async (req, res) => {
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
    logger.error("Error fetching latest jobs:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// GET /api/jobs/similar/:jobId this controller is for fetching the similar jobs in view jobs page
// const getSimilarJobs = asyncHandler(async (req, res) => {
//   try {
//     const { jobId } = req.params;

//     // 1. Get current job
//     const currentJob = await Job.findById(jobId);

//     if (!currentJob) {
//       return res.status(404).json({
//         success: false,
//         message: "Job not found",
//       });
//     }

//     // 2. Fetch candidate jobs (filtered, not full DB)
//     const candidates = await Job.find({
//       _id: { $ne: jobId },
//       experienceLevel: currentJob.experienceLevel, // basic filter
//     }).limit(20); // limit for performance

//     // 3. Apply scoring
//     const scoredJobs = candidates.map((job) => {
//       let score = 0;

//       // 🔥 Role match (partial match)
//       if (
//         job.jobTitle.toLowerCase().includes(currentJob.jobTitle.toLowerCase()) ||
//         currentJob.jobTitle.toLowerCase().includes(job.jobTitle.toLowerCase())
//       ) {
//         score += 5;
//       }

//       // 🔥 Skills match
//       if (job.skills && currentJob.skills) {
//         const commonSkills = job.skills.filter((skill) =>
//           currentJob.skills.includes(skill)
//         );
//         score += commonSkills.length * 2;
//       }

//       // 🔥 Location match
//       if (job.location === currentJob.location) {
//         score += 2;
//       }

//       // 🔥 Work mode match
//       if (job.workMode === currentJob.workMode) {
//         score += 1;
//       }

//       return {
//         ...job.toObject(),
//         score,
//       };
//     });

//     // 4. Sort by score (highest first)
//     scoredJobs.sort((a, b) => b.score - a.score);

//     // 5. Return top 5
//     const similarJobs = scoredJobs.slice(0, 5);

//     res.status(200).json({
//       success: true,
//       count: similarJobs.length,
//       jobs: similarJobs,
//     });
//   } catch (error) {
//     logger.error("Error fetching similar jobs:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// });

const getSimilarJobs = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const key = `similarJobs:${jobId}`;

  // 🔍 1. Check Redis
  try {
    const cached = await redis.get(key);
    if (cached) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cached),
        source: "cache", // 🧪 testing
      });
    }
  } catch (err) {
    logger.error("Redis GET error:", err.message);
  }

  // 🗄️ 2. Get current job
  const currentJob = await Job.findById(jobId).lean();

  if (!currentJob) {
    return res.status(404).json({
      success: false,
      message: "Job not found",
    });
  }

  // 🗄️ 3. Fetch candidate jobs
  const candidates = await Job.find({
    _id: { $ne: jobId },
    experienceLevel: currentJob.experienceLevel,
  })
    .limit(20)
    .lean();

  // ⚡ 4. Scoring logic
  const scoredJobs = candidates.map((job) => {
    let score = 0;

    if (
      job.jobTitle?.toLowerCase().includes(currentJob.jobTitle?.toLowerCase()) ||
      currentJob.jobTitle?.toLowerCase().includes(job.jobTitle?.toLowerCase())
    ) {
      score += 5;
    }

    if (job.skills && currentJob.skills) {
      const commonSkills = job.skills.filter((skill) =>
        currentJob.skills.includes(skill)
      );
      score += commonSkills.length * 2;
    }

    if (job.location === currentJob.location) {
      score += 2;
    }

    if (job.workMode === currentJob.workMode) {
      score += 1;
    }

    return {
      ...job,
      score,
    };
  });

  // 🔽 5. Sort & slice
  scoredJobs.sort((a, b) => b.score - a.score);
  const similarJobs = scoredJobs.slice(0, 5);

  const responseData = {
    count: similarJobs.length,
    jobs: similarJobs,
  };

  // 💾 6. Store in Redis
  try {
    await redis.set(key, JSON.stringify(responseData), "EX", 300);
  } catch (err) {
    logger.error("Redis SET error:", err.message);
  }

  // ✅ 7. Response
  res.status(200).json({
    success: true,
    ...responseData,
    source: "db", // 🧪 testing
  });
});

// This is an additional controller to fetch only active jobs for the alert bar on homepage
const getActiveJobs = asyncHandler(async (req, res) => {
  try {
    const jobs = await Job.find({ status: "active" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    logger.error("Error fetching active jobs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching active jobs",
      error: error.message
    });
  }
});

// This is an additional controller to fetch only expired jobs for the admin panel
const getExpiredJobs = asyncHandler(async (req, res) => {
  try {
    const jobs = await Job.find({ status: "expired" })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    logger.error("Error fetching expired jobs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expired jobs",
      error: error.message
    });
  }
});

//this is an controller to fetch the stats for the landing page
const getStats = asyncHandler(async (req, res) => {
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
    logger.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching stats",
      error: error.message
    });
  }
});

//this is used to fetch the quick job categories in app.jsx page
const getJobCategories = asyncHandler(async (req, res) => {
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
    logger.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message
    });
  }
});

//this is top hiring companies controller for the landing page.
const getTopCompanies = asyncHandler(async (req, res) => {
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
    });

  } catch (error) {
    logger.error("Error fetching top companies:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching top companies",
      error: error.message
    });
  }
});

//get jobs by location controller for the landing page
const getJobsByLocation = asyncHandler(async (req, res) => {
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
});

const sendJobAlerts = asyncHandler(async (job) => {
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

        <a href="https://dailyjobopenings.online/view-job/${job.slug}" style="color:blue;">
          Apply Now
        </a>

        <p style="margin-top:10px;">Good luck 🚀</p>
        `
      );
    }

  } catch (err) {
    logger.error("Error sending job alerts:", err);
  }
});

const subscribeJobAlert = asyncHandler(async (req, res) => {
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
});

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

const getJobsByCategories = asyncHandler(async (req, res) => {
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
    logger.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// GET /api/jobs/ticker
// Live Hiring Pulse Ticker Controller
const getTickerJobs = async (req, res) => {
  try {
    const now = new Date();

    // Fetch only active + verified jobs
    let jobs = await Job.find({
      status: "active",
      verified: true,
      expiryDate: { $gte: now }
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "jobTitle companyName slug badge badgeLabel salary expiryDate createdAt"
      );

    // Smart ranking logic
    const rankedJobs = jobs.map((job) => {
      let priority = 0;
      let tickerLabel = "🚀 NEW";

      // 1. Urgent closing soon jobs
      const daysLeft = Math.ceil(
        (new Date(job.expiryDate) - now) / (1000 * 60 * 60 * 24)
      );

      if (daysLeft <= 2) {
        priority += 50;
        tickerLabel = "🔥 URGENT";
      }

      // 2. Featured / hot jobs
      if (job.badge === "featured" || job.badge === "hot") {
        priority += 40;
        tickerLabel = "🔥 HOT";
      }

      // 3. High salary jobs
      if (job.salary && /\d+/.test(job.salary)) {
        priority += 20;
      }

      // 4. Fresh newest jobs
      priority += Math.max(0, 10 - daysLeft);

      return {
        title: `${tickerLabel} ${job.companyName} hiring for ${job.jobTitle}`,
        slug: job.slug,
        companyName: job.companyName,
        jobTitle: job.jobTitle,
        priority
      };
    });

    // Sort by priority descending
    rankedJobs.sort((a, b) => b.priority - a.priority);

    // Return only top 5 ticker items
    const tickerJobs = rankedJobs.slice(0, 8);

    res.status(200).json({
      success: true,
      count: tickerJobs.length,
      data: tickerJobs
    });
  } catch (error) {
    console.error("Ticker Jobs Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ticker jobs"
    });
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
  getJobsByCategories,
  updateJob,
  deleteJob,
  closeJob,
  getTickerJobs,
  getDynamicCategories
};