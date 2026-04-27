// services/duplicateCheckService.js

const Job = require("../models/job");

function normalizeText(text = "") {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateTitleSimilarity(title1, title2) {

  const words1 = normalizeText(title1).split(" ");
  const words2 = normalizeText(title2).split(" ");

  const commonWords = words1.filter(word =>
    words2.includes(word)
  );

  const similarity =
    commonWords.length /
    Math.max(words1.length, words2.length);

  return similarity;
}

async function checkDuplicateJob(jobData) {

  const {
    jobTitle,
    companyName,
    location
  } = jobData;

  if (!jobTitle || !companyName) {
    return [];
  }

  const normalizedCompany =
    normalizeText(companyName);

  const normalizedLocation =
    normalizeText(location);

  // 15 day duplicate window
  const fifteenDaysAgo = new Date();

  fifteenDaysAgo.setDate(
    fifteenDaysAgo.getDate() - 15
  );

  // fetch recent jobs from same company
  const recentJobs = await Job.find({
    createdAt: {
      $gte: fifteenDaysAgo
    },
    companyName: {
      $regex: new RegExp(normalizedCompany, "i")
    }
  });

  const similarJobs = [];

  for (const job of recentJobs) {

    const existingCompany =
      normalizeText(job.companyName);

    const existingLocation =
      normalizeText(job.location);

    // exact company check
    const companyMatch =
      existingCompany === normalizedCompany;

    if (!companyMatch) continue;

    // title similarity
    const titleSimilarity =
      calculateTitleSimilarity(
        job.jobTitle,
        jobTitle
      );

    // location match
    const locationMatch =
      existingLocation === normalizedLocation;

    let confidence = "low";

    if (
      titleSimilarity >= 0.8 &&
      locationMatch
    ) {
      confidence = "high";
    }
    else if (titleSimilarity >= 0.5) {
      confidence = "medium";
    }

    if (
      confidence === "medium" ||
      confidence === "high"
    ) {

      similarJobs.push({
        jobId: job._id,
        slug: job.slug,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        location: job.location,
        confidence,
        createdAt: job.createdAt
      });

    }
  }

  return similarJobs;
}

module.exports = {
  checkDuplicateJob
};