const mongoose = require("mongoose");
const examSchema = new mongoose.Schema(
{
  title: {
    type: String,
    required: true
  },

  slug: {
    type: String,
    required: true,
    unique: true
  },

  shortTitle: {
    type: String
  },

  organization: {
    type: String,
    required: true
  },

  examType: {
    type: String,
    enum: [
      "Government",
      "Engineering",
      "Banking",
      "Railway",
      "Defence",
      "Teaching",
      "Medical",
      "Law",
      "Management",
      "SSC",
      "UPSC",
      "State PSC",
      "Entrance",
      "Private",
      "Other"
    ],
    required: true
  },

  category: {
    type: String,
    enum: [
      "Notification",
      "Admit Card",
      "Result",
      "Answer Key",
      "Syllabus",
      "Counselling",
      "Scholarship",
      "Recruitment"
    ],
    default: "Notification"
  },

  description: {
    type: String
  },

  overview: {
    type: String
  },

  eligibility: {
    type: String
  },

  applicationFee: {
    type: String
  },

  ageLimit: {
    type: String
  },

  examMode: {
    type: String,
    enum: ["Online", "Offline", "Hybrid"]
  },

  applicationStartDate: {
    type: Date
  },

  applicationEndDate: {
    type: Date
  },

  examDate: {
    type: Date
  },

  resultDate: {
    type: Date
  },

  officialWebsite: {
    type: String
  },

//   officialNotificationUrl: {
//     type: String
//   },

  applyUrl: {
    type: String
  },

//   syllabusUrl: {
//     type: String
//   },

//   admitCardUrl: {
//     type: String
//   },

//   resultUrl: {
//     type: String
//   },

  location: {
    type: String
  },

  qualification: [{
    type: String
  }],

  tags: [{
    type: String
  }],

  image: {
    type: String
  },

  isActive: {
    type: Boolean,
    default: true
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

//   views: {
//     type: Number,
//     default: 0
//   },

//   source: {
//     type: String
//   },

  publishedAt: {
    type: Date,
    default: Date.now
  }

},
{
  timestamps: true
});
module.exports = mongoose.model("Exam", examSchema);