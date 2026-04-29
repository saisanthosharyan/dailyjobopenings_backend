const mongoose = require("mongoose");

const walkInJobSchema = new mongoose.Schema(
  {
    walkintitle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    walkinslug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    companyLogo: {
      type: String
    },

    companyWebsite: {
      type: String
    },

    roleCategory: {
      type: String,
      enum: [
        "Software",
        "Support",
        "BPO",
        "Finance",
        "Sales",
        "Testing",
        "Internship",
        "Hardware",
        "Networking",
        "Other"
      ],
      default: "Other",
      index: true
    },

    employmentType: {
      type: String,
      enum: [
        "Full Time",
        "Internship",
        "Contract",
        "Part Time"
      ],
      default: "Full Time"
    },

    experience: {
      type: String,
      default: "Freshers"
    },

    batch: [
      {
        type: String,
        index: true
      }
    ],

    qualification: [
      {
        type: String,
        trim: true
      }
    ],

    skills: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],

    salary: {
      type: String
    },

    location: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    address: {
      type: String,
      required: true
    },

    googleMapsLink: {
      type: String
    },

    walkInDetails: {
      startDate: {
        type: Date,
        required: true,
        index: true
      },

      endDate: {
        type: Date,
        required: true,
        index: true
      },

      reportingTime: {
        type: String
      },

      venue: {
        type: String,
        required: true
      }
    },

    description: {
      type: String,
      required: true
    },

    responsibilities: [
      {
        type: String
      }
    ],

    eligibility: [
      {
        type: String
      }
    ],

    selectionProcess: [
      {
        type: String
      }
    ],

    documentsRequired: [
      {
        type: String
      }
    ],

    applyLink: {
      type: String
    },

    contactEmail: {
      type: String,
      lowercase: true
    },

    contactPhone: {
      type: String
    },

    mode: {
      type: String,
      enum: ["Walk-In", "Virtual"],
      default: "Walk-In",
      index: true
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },

    views: {
      type: Number,
      default: 0
    },

    clicks: {
      type: Number,
      default: 0
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    },

    tags: [
      {
        type: String,
        lowercase: true,
        trim: true
      }
    ],

    seo: {
      metaTitle: String,
      metaDescription: String
    }
  },
  {
    timestamps: true
  }
);





/* =========================
   INDEXES
========================= */

// SEO slug
walkInJobSchema.index({ walkinslug: 1 });

// Company filtering
walkInJobSchema.index({ companyName: 1 });

// Location filtering
walkInJobSchema.index({ location: 1 });

// Walk-in date sorting
walkInJobSchema.index({
  "walkInDetails.startDate": 1
});

// Active jobs
walkInJobSchema.index({
  isActive: 1,
  createdAt: -1
});

// Featured jobs
walkInJobSchema.index({
  isFeatured: 1,
  createdAt: -1
});

// Batch filtering
walkInJobSchema.index({
  batch: 1
});

// Full-text search
walkInJobSchema.index({
  walkintitle: "text",
  companyName: "text",
  skills: "text",
  tags: "text",
  description: "text"
});

// Duplicate detection
walkInJobSchema.index({
  companyName: 1,
  walkintitle: 1,
  "walkInDetails.startDate": 1
});

module.exports = mongoose.model("WalkInJob", walkInJobSchema);