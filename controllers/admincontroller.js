const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generatetoken");
const sendEmail = require("../utils/sendemail");
const asyncHandler = require("../utils/asyncHandler");
const Company = require("../models/companies");

// LOGIN
exports.loginAdmin = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(admin);
    // console.log("generated token:", token); // Debug log

    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        isTempPassword: admin.isTempPassword,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


exports.createAdmin = asyncHandler(async (req, res) => {
  try {
    const { email, role } = req.body;

    // 🔍 Check duplicate
    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // 🔐 Generate temp password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 💾 Create admin
    const newAdmin = await Admin.create({
      email,
      password: hashedPassword,
      role: role || "admin",
      isTempPassword: true,
    });

    // 🔗 Correct login link
    const loginLink = "https://dailyjobopenings.online/admin/login";

    // ✉️ Email HTML
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background:#f4f7fb;">
        <div style="max-width: 500px; margin:auto; background:#fff; padding:25px; border-radius:10px;">
          
          <h2 style="color:#0f4c81;">Welcome to Daily Job Openings</h2>
          
          <p>Your admin account has been created.</p>

          <div style="background:#f9fafb; padding:15px; border-radius:8px; margin:20px 0;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>

          <p>Please login and reset your password immediately.</p>

          <a href="${loginLink}" 
            style="display:inline-block; margin-top:15px; padding:10px 18px; background:#0f4c81; color:#fff; text-decoration:none; border-radius:6px;">
            Login Now
          </a>

          <p style="margin-top:20px; font-size:12px; color:#777;">
            If you did not expect this email, please ignore it.
          </p>

        </div>
      </div>
    `;

    console.log("Sending email to:", email);

    let emailSent = true;

    try {
      await sendEmail(email, "Your Admin Account Details", html);
    } catch (err) {
      emailSent = false;
      logger.error("Email failed:", err.message);
    }

    // ✅ Response based on email status
    res.status(201).json({
      message: emailSent
        ? "Admin created and email sent successfully"
        : "Admin created, but email failed to send",
    });

  } catch (error) {
    logger.error("Create Admin Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

exports.getAllAdmins = asyncHandler(async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.json(admins);
  } catch (error) {
    logger.error("Get All Admins Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


exports.deleteAdmin = asyncHandler(async (req, res) => {
  try {
    const adminToDelete = await Admin.findById(req.params.id);

    if (!adminToDelete) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 🔍 DEBUG LOGS
    console.log("Logged in admin ID:", req.admin._id.toString());
    console.log("Deleting admin ID:", adminToDelete._id.toString());

    // ✅ FIXED SELF DELETE CHECK
    if (adminToDelete._id.equals(req.admin._id)) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    // ❌ Prevent deleting last super admin
    if (adminToDelete.role === "super_admin") {
      const superAdmins = await Admin.countDocuments({
        role: "super_admin",
      });

      if (superAdmins <= 1) {
        return res.status(400).json({
          message: "Cannot delete the last super admin",
        });
      }
    }

    await adminToDelete.deleteOne();

    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    logger.error("Delete Admin Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD
exports.resetPassword = asyncHandler(async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    admin.password = hashedPassword;
    admin.isTempPassword = false;

    await admin.save();

    res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    logger.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

exports.updateAdmin = asyncHandler(async (req, res) => {
  try {
    const { email, role } = req.body;
    const adminId = req.params.id;

    const adminToUpdate = await Admin.findById(adminId);

    if (!adminToUpdate) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // ❌ Prevent updating yourself (optional but recommended)
    if (adminToUpdate._id.equals(req.admin._id)) {
      return res.status(400).json({
        message: "You cannot update your own account",
      });
    }

    // 🔐 EMAIL UPDATE
    if (email) {
      const existing = await Admin.findOne({ email });

      if (existing && !existing._id.equals(adminId)) {
        return res.status(400).json({
          message: "Email already in use",
        });
      }

      adminToUpdate.email = email;
    }

    // 🔐 ROLE UPDATE
    if (role) {
      // Validate role
      if (!["admin", "super_admin"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      // ❌ Prevent removing last super admin
      if (
        adminToUpdate.role === "super_admin" &&
        role !== "super_admin"
      ) {
        const superAdmins = await Admin.countDocuments({
          role: "super_admin",
        });

        if (superAdmins <= 1) {
          return res.status(400).json({
            message: "Cannot change role of the last super admin",
          });
        }
      }

      adminToUpdate.role = role;
    }

    await adminToUpdate.save();

    res.json({
      message: "Admin updated successfully",
      admin: {
        id: adminToUpdate._id,
        email: adminToUpdate.email,
        role: adminToUpdate.role,
      },
    });
  } catch (error) {
    logger.error("Update Admin Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

exports.createCompany = asyncHandler(async (req, res) => {
  try {
    let { companyName } = req.body;

    if (!companyName) {
      return res.status(400).json({ message: "Company name is required" });
    }

    const normalizedName = companyName.toLowerCase().trim();

    const existingCompany = await Company.findOne({ companyName: normalizedName });

    if (existingCompany) {
      return res.status(400).json({
        message: "Company already exists"
      });
    }

    const company = await Company.create({
      ...req.body,
      companyName: normalizedName,
      createdBy: req.admin._id
    });

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: company
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating company",
      error: error.message
    });
  }
});

exports.getCompanies = asyncHandler(async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const query = search
      ? { companyName: { $regex: search.toLowerCase(), $options: "i" } }
      : {};

    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Company.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      data: companies
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching companies",
      error: error.message
    });
  }
});

exports.updateCompany = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Normalize name if updating
    if (req.body.companyName) {
      req.body.companyName = req.body.companyName.toLowerCase().trim();
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: updatedCompany
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating company",
      error: error.message
    });
  }
});

exports.deleteCompany = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if jobs exist
    const jobExists = await Job.exists({ company: id });

    if (jobExists) {
      return res.status(400).json({
        message: "Cannot delete company with existing jobs"
      });
    }

    await Company.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Company deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting company",
      error: error.message
    });
  }
});