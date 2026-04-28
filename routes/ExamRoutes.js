const express = require("express");
const router = express.Router();

const {  createExam,
  getAllExams,
  getSingleExam,
  updateExam,
  deleteExam } = require("../controllers/ExamController");

const authMiddleware = require("../middlewares/authmiddleware");
const allowRoles = require("../middlewares/rolemiddleware");

// CREATE EXAM
router.post("/create-an-exam",authMiddleware,allowRoles("admin","super_admin"), createExam);



// GET ALL EXAMS
router.get("/get-all-exams", getAllExams);



// GET SINGLE EXAM
router.get("/get-exam/:slug", getSingleExam);


// UPDATE EXAM
router.put("/update-exam/:id", authMiddleware, allowRoles("admin", "super_admin"), updateExam);



// DELETE EXAM
router.delete("/delete-exam/:id", authMiddleware, allowRoles("admin", "super_admin"), deleteExam);

module.exports = router;