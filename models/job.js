const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
{
  // 🔹 Company Info
  companyLogo: String,
  companyName: String,
  companyWebsite: String,
  companyCareersLink: String,
  aboutCompany: String,
  
  // 🔹 Job Basic Info
  jobTitle: String,
  jobRole: String,
  jobDescription: String,
  slug: { type: String, unique: true },

  // 🔹 Job Details
  salary: String,
  location: String,
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
  perks: [String],
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


module.exports = mongoose.model("Job", jobSchema);