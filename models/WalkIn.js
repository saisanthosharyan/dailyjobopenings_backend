const mongoose = require("mongoose");

const walkInJobSchema = new mongoose.Schema(
  {
    company: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Company"
},
    walkintitle: {
      type: String,
      trim: true,
      index: true
    },

    walkinslug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },

    companyName: {
      type: String,
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
      index: true
    },

    employmentType: {
      type: String,
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
      trim: true,
      index: true
    },

    address: {
      type: String,
    },

    googleMapsLink: {
      type: String
    },

    walkInDetails: {
      startDate: {
        type: Date,
        index: true
      },

      endDate: {
        type: Date,
        index: true
      },

      reportingTime: {
        type: String
      },

      venue: {
        type: String,
      }
    },

    description: {
      type: String,
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

    isVerified: {
      type: Boolean,
      default: true,
      index: true
    },

    highlight_type_label: {
      type: String,
      index: true,
      default: "featured"
    },

    walkin_type_label: {
      type: String,
      index: true,
      default: "Walk-in Drive"
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