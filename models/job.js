// const mongoose = require("mongoose");

// const jobSchema = new mongoose.Schema(
// {
//   companyLogo: {
//     type: String,
//     required: true
//   },

//   companyName: {
//     type: String,
//     required: true
//   },

//   jobTitle: {
//     type: String,
//     required: true
//   },

//   jobRole: {
//     type: String,
//     required: true
//   },

//   jobDescription: {
//     type: String,
//     required: true
//   },

//   slug: {
//     type: String,
//     unique: true
//   },

//   jobType: {
//     type: String,
//     // enum: ["Full Time", "Internship", "Contract", "Part Time"]
//   },

//   experienceLevel: {
//     type: String,
//     // enum: ["Fresher", "1-3 Years", "3-5 Years", "Senior"]
//   },

//   jobCategory: {
//     type: String,
//     // enum: ["Private", "Government"]
//   },

//   workMode: {
//     type: String,
//     // enum: ["Remote", "Hybrid", "Onsite"]
//   },

//   salary: {
//     type: String
//   },

//   location: {
//     type: String
//   },

//   jobLink: {
//     type: String,
//   },

//   expiryDate: {
//     type: Date
//   },

//   tags: [
//     {
//       type: String
//     }
//   ]

// },
// { timestamps: true }
// );

// module.exports = mongoose.model("Job", jobSchema);


const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
{
  // 🔹 Company Info
  companyLogo: String,
  companyName: String,
  companyWebsite: String,              // official company link
  companyCareersLink: String,          // careers page

  // 🔹 Job Basic Info
  jobTitle: String,
  jobRole: String,
  jobDescription: String,
  slug: { type: String, unique: true },

  // 🔹 Job Details
  salary: String,
  location: String,
  workMode: String,                    // Remote / Hybrid / Onsite
  jobType: String,                     // Full-time / Contract etc
  jobCategory: String,                 // IT / Non-IT
  experienceLevel: String,             // Fresher / 1-3 yrs

  // 🔹 Dates
  postedDate: Date,                    // 🔥 NEW
  expiryDate: Date,

  // 🔹 Eligibility
  education: String,
  eligibleBatches: String,             // "2023-2025"
  department: String,                  // Cloud / Linux

  // 🔹 Hiring Info
  openings: Number,                    // 15
  applicantsCount: Number,             // optional (future use)

  // 🔹 Skills & Tags
  skills: [String],                    // 🔥 NEW (instead of only tags)
  tags: [String],                      // keep for flexibility

  // 🔹 Links
  jobLink: String,                     // apply link

  // 🔹 Extra (future safe)
  perks: [String],                     // optional
  responsibilities: [String],
  qualifications: [String],
  verified: { type: Boolean, default: false }, // for admin verification
  badge: {
  type: String,
  enum: ["featured", "hot", "new", "remote"],
  default: null,
},

badgeLabel: {
  type: String,
  default: null,
}


},
{ timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);