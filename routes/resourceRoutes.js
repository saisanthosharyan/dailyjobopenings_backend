import express from "express";
import authMiddleware from "../middlewares/authmiddleware.js";
import allowRoles from "../middlewares/rolemiddleware.js";
import {
  getResources,
  createResource,
  deleteResource,
  updateResource
} from "../controllers/resourceController.js";

const router = express.Router();


// GET all resources
router.get("/get-all-resources", getResources);

// CREATE resource
router.post("/create-resource",authMiddleware, allowRoles("admin", "super_admin"), createResource);

// DELETE resource
router.delete("/delete-resource/:id",authMiddleware, allowRoles("admin", "super_admin"), deleteResource);

//update resource
router.put("/update-resource/:id",authMiddleware, allowRoles("admin", "super_admin"), updateResource);

export default router;