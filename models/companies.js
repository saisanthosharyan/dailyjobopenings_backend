const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
companyName: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
  index: true
},
  companyWebsite: String,
  companyCareersLink: String,
  companyLogo: String,
  aboutCompany: String,
  perks: [String],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }

}, { timestamps: true });
// 🔍 Text search (for autocomplete later)
companySchema.index({
  companyName: "text",
  aboutCompany: "text"
});


module.exports = mongoose.model("Company", companySchema);