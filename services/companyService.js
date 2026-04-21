const Company = require("../models/companies");

const findOrCreateCompany = async (data, adminId) => {
  // 🔹 Validation
  if (!data.companyName) {
    throw new Error("Company name is required");
  }

  const normalizedName = data.companyName.toLowerCase().trim();

  // 🔹 Find existing
  let company = await Company.findOne({ companyName: normalizedName });

  if (company) return company;

  // 🔹 Create new
  company = await Company.create({
    companyName: normalizedName,
    companyWebsite: data.companyWebsite?.trim(),
    companyCareersLink: data.companyCareersLink?.trim(),
    companyLogo: data.companyLogo,
    aboutCompany: data.aboutCompany,
    perks: data.companyPerks || [], // keep consistent with frontend
    createdBy: adminId
  });

  return company;
};

module.exports = { findOrCreateCompany };