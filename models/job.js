const mongoose = require("mongoose");
const slug = require("slugify");

const jobSchema = new mongoose.Schema(
{
  //company reference
  company:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
    index: true
  },
  // 🔹 Company Info
  companyLogo: String,
  companyName: String,
  companyWebsite: String,
  companyCareersLink: String,
  aboutCompany: String,

  // 🔹 Job Basic Info
  jobTitle: { type: String, required: true },
  jobRole: String,
  jobDescription: { type: String, required: true },
  slug: { type: String, unique: true, index:true },

  // 🔹 Job Details
  salary: String,
  location: { type: String, required: true },
  workMode: String,
  jobType: String,
  jobCategory: String,
  experienceLevel: String,

  // 🔹 Dates
  postedDate: Date,
  expiryDate: Date,

  // 🔥 Auto delete support
  expiresAt: {
    type: Date,
    index: true
  },

  // 🔹 Eligibility
  education: String,
  eligibleBatches: String,
  department: String,

  // 🔹 Hiring Info
  openings: Number,
  applicantsCount: Number,

  // 🔹 Skills & Tags
  skills: [String],
  tags: [String],

  // 🔹 Links
  jobLink: String,

  // 🔹 Extra
  // 🔹 Perks (with control)
  perks: [String],
  useCompanyPerks: {
    type: Boolean,
    default: true
  },
  responsibilities: [String],
  qualifications: [String],
  verified: { type: Boolean, default: false },

  badge: {
    type: String,
    enum: ["featured", "hot", "new", "remote"],
    default: null,
  },

  badgeLabel: {
    type: String,
    default: null,
  },
  createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Admin"
},

  status: {
    type: String,
    enum: ["active", "expired", "draft", "closed"],
    default: "active"
  }

},
{ timestamps: true }
);


// 🔧 Middleware (Auto expiry + delete logic)
jobSchema.pre("save", async function () {
  const now = new Date();

  // default expiry (60 days)
if (!this.slug) {
    this.slug = slugify(
      `${this.jobTitle}-${this.companyName}-${Date.now()}`,
      { lower: true, strict: true }
    );
  }

  // default expiry (60 days)
  if (!this.expiryDate) {
    const defaultExpiry = new Date(now);
    defaultExpiry.setDate(defaultExpiry.getDate() + 60);
    this.expiryDate = defaultExpiry;
  }

  // expiresAt = expiryDate + 15 days
  const deleteAfter = new Date(this.expiryDate);
  deleteAfter.setDate(deleteAfter.getDate() + 15);

  this.expiresAt = deleteAfter;
});


// 🔥 TTL Index (Auto delete after expiresAt)
jobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

//single feild indexes for faster queries
jobSchema.index({jobTitle: 1});
jobSchema.index({location: 1});
jobSchema.index({jobCategory: 1});
jobSchema.index({createdAt: -1});
jobSchema.index({slug: 1});

//compund indexes(high impact)
jobSchema.index({jobTitle: 1, location: 1});
jobSchema.index({jobCategory: 1, location:1});

//Text search
jobSchema.index({jobTitle: "text", companyName: "text", jobDescription: "text",});

module.exports = mongoose.model("Job", jobSchema);