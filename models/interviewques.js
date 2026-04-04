// models/Interview.js
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    desc: { type: String },

    category: { type: String, required: true },

    // 🔥 NEW FIELDS (important for your UI)
    count: { type: Number, default: 0 }, // ❓ number of questions
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "Mixed"],
      default: "Beginner",
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    // 🎨 UI styling
    color: { type: String, default: "#3b82f6" },
    icon: { type: String, default: "📄" },

    // 📄 File info
    type: { type: String, default: "PDF" },
    pages: { type: Number },
    size: { type: String },
    fileUrl: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);