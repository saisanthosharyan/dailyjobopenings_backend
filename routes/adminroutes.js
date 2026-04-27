const express = require("express");
const router = express.Router();

const {
  loginAdmin,
  createAdmin,
  getAllAdmins,
  deleteAdmin,
  resetPassword,
  updateAdmin,
  createCompany,
  getCompanies,
  updateCompany,
  deleteCompany,
  extractJobFromURL,
  extractJobFromText,
  checkDuplicate
} = require("../controllers/admincontroller");

const authMiddleware = require("../middlewares/authmiddleware");
const allowRoles = require("../middlewares/rolemiddleware");

// Public
router.post("/login", loginAdmin);

// Protected
router.post(
  "/create-admin",
  authMiddleware,
  allowRoles("super_admin"),
  createAdmin
);

router.get(
  "/get-all-admins",
  authMiddleware,
  allowRoles("super_admin"),
  getAllAdmins
);

router.delete(
  "/delete-admin/:id",
  authMiddleware,
  allowRoles("super_admin"),
  deleteAdmin
);

router.put(
  "/reset-password",
  authMiddleware,
  resetPassword
);

router.put(
  "/update-admin/:id",
  authMiddleware,
  allowRoles("super_admin"),
  updateAdmin
);
router.post(
  "/create-companies",
  authMiddleware,
  allowRoles("admin", "super_admin"),
  createCompany
);
router.get(
  "/get-companies",
  authMiddleware,
  allowRoles("admin", "super_admin"),
  getCompanies
);
router.put(
  "/update-companies/:id",
  authMiddleware,
  allowRoles("super_admin"),
  updateCompany
);
router.delete(
  "/delete-companies/:id",
  authMiddleware,
  allowRoles("super_admin"),
  deleteCompany
);

router.post(
  "/extract-job-using-link",
  authMiddleware,
  allowRoles("admin", "super_admin"),
  extractJobFromURL
);

router.post(
  "/extract-job-using-text",
  authMiddleware,
  allowRoles("admin", "super_admin"),
  extractJobFromText
);

router.post(
  "/check-duplicate",
  authMiddleware,
  allowRoles("admin", "super_admin"),
  checkDuplicate
);
module.exports = router;