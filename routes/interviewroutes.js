// routes/interviewRoutes.js

import express from "express";
import {
  getInterviews,
  createInterview,
  deleteInterview,
  updateInterview,
} from "../controllers/interviewquesController.js";

const router = express.Router();

router.get("/get-all-interview-ques", getInterviews);
router.post("/create-interview-ques", createInterview);
router.delete("/delete-interview-ques/:id", deleteInterview);
router.put("/update-interview-ques/:id", updateInterview);

export default router;