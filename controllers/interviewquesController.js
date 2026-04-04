// controllers/interviewController.js

import Interview from "../models/interviewques.js";


// ✅ GET all (with filters + search)
export const getInterviews = async (req, res) => {
  try {
    const { category, difficulty, level, search } = req.query;

    let query = {};

    // 🎯 Category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // 🎯 Difficulty filter
    if (difficulty && difficulty !== "All") {
      query.$or = [
        { difficulty: difficulty },
        { level: difficulty },
      ];
    }

    // 🔍 Search (title, desc, category)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { desc: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const interviews = await Interview.find(query).sort({ createdAt: -1 });

    res.status(200).json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ CREATE
export const createInterview = async (req, res) => {
  try {
    const newInterview = new Interview(req.body);
    const saved = await newInterview.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



// ✅ DELETE
export const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;

    await Interview.findByIdAndDelete(id);

    res.status(200).json({ message: "Interview deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ✅ UPDATE
export const updateInterview = async (req, res) => {
  try {
    const updated = await Interview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};