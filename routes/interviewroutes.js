// routes/interviewRoutes.js
import express from "express";
import authMiddleware  from "../middlewares/authmiddleware.js";
import allowRoles from "../middlewares/rolemiddleware.js";
import {
  getInterviews,
  createInterview,
  deleteInterview,
  updateInterview,
} from "../controllers/interviewquesController.js";

const router = express.Router();

router.get("/get-all-interview-ques", getInterviews);
router.post("/create-interview-ques", authMiddleware, allowRoles("admin", "super_admin"), createInterview);
router.delete("/delete-interview-ques/:id", authMiddleware, allowRoles("admin", "super_admin"), deleteInterview);
router.put("/update-interview-ques/:id", authMiddleware, allowRoles("admin", "super_admin"), updateInterview);

export default router;