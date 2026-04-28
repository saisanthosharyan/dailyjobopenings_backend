// controllers/examController.js
const Exam = require("../models/Exams");
const slugify = require("slugify");
// CREATE EXAM
exports.createExam = async (req, res) => {
  try {

    const {
      title,
      shortTitle,
      organization,
      examType,
      category,
      description,
      overview,
      eligibility,
      applicationFee,
      ageLimit,
      examMode,
      applicationStartDate,
      applicationEndDate,
      examDate,
      resultDate,
      officialWebsite,
      officialNotificationUrl,
      applyUrl,
      syllabusUrl,
      admitCardUrl,
      resultUrl,
      location,
      qualification,
      tags,
      image,
      isFeatured,
      source
    } = req.body;

    // generate slug
    const slug = slugify(title, {
      lower: true,
      strict: true
    });

    // check existing
    const existingExam = await Exam.findOne({ slug });

    if (existingExam) {
      return res.status(400).json({
        success: false,
        message: "Exam already exists"
      });
    }

    const exam = await Exam.create({
      title,
      slug,
      shortTitle,
      organization,
      examType,
      category,
      description,
      overview,
      eligibility,
      applicationFee,
      ageLimit,
      examMode,
      applicationStartDate,
      applicationEndDate,
      examDate,
      resultDate,
      officialWebsite,
      officialNotificationUrl,
      applyUrl,
      syllabusUrl,
      admitCardUrl,
      resultUrl,
      location,
      qualification,
      tags,
      image,
      isFeatured,
      source
    });

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      exam
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create exam",
      error: error.message
    });
  }
};




// GET ALL EXAMS
exports.getAllExams = async (req, res) => {
  try {

    const exams = await Exam.find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      exams
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      error: error.message
    });
  }
};




// GET SINGLE EXAM BY SLUG
exports.getSingleExam = async (req, res) => {
  try {

    const exam = await Exam.findOne({
      slug: req.params.slug
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found"
      });
    }

    // increment views
    exam.views += 1;
    await exam.save();

    res.status(200).json({
      success: true,
      exam
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch exam",
      error: error.message
    });
  }
};




// UPDATE EXAM
exports.updateExam = async (req, res) => {
  try {

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found"
      });
    }

    // update slug if title changes
    if (req.body.title) {
      req.body.slug = slugify(req.body.title, {
        lower: true,
        strict: true
      });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      exam: updatedExam
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to update exam",
      error: error.message
    });
  }
};




// DELETE EXAM
exports.deleteExam = async (req, res) => {
  try {

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found"
      });
    }

    await exam.deleteOne();

    res.status(200).json({
      success: true,
      message: "Exam deleted successfully"
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete exam",
      error: error.message
    });
  }
};