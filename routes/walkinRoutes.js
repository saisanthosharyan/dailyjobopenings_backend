const express = require ("express");

const {
  createWalkIn,
  getAllWalkIns,
  getWalkInBySlug,
  updateWalkIn,
  deleteWalkIn
} = require("../controllers/walkincontrollers");
const authMiddleware = require("../middlewares/authmiddleware");
const allowRoles = require("../middlewares/rolemiddleware");

const router = express.Router();



// CREATE
router.post("/create-walkin",authMiddleware,  allowRoles("admin", "super_admin"), createWalkIn);

// GET ALL
router.get("/get-all-walkins", getAllWalkIns);

// GET SINGLE
router.get("/get-walkin-by-slug/:walkinslug", getWalkInBySlug);

// UPDATE
router.put("/update-walkin/:id",authMiddleware,  allowRoles("admin", "super_admin"), updateWalkIn);

// DELETE
router.delete("/delete-walkin/:id",authMiddleware,  allowRoles("admin", "super_admin"), deleteWalkIn);



module.exports = router;