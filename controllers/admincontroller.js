const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generatetoken");

// LOGIN
exports.loginAdmin = async (req, res) => {
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
};

const sendEmail = require("../utils/sendEmail");

exports.createAdmin = async (req, res) => {
  try {
    const { email, role } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // 🔐 Generate temp password
    const tempPassword = Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const newAdmin = await Admin.create({
      email,
      password: hashedPassword,
      role: role || "admin",
      isTempPassword: true,
    });

    // ✉️ Send Email
    const loginLink = `${process.env.FRONTEND_URL}/admin/login`;

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

        </div>
      </div>
    `;
console.log("Sending email to:", email);
    await sendEmail(email, "Your Admin Account Details", html);

    res.status(201).json({
      message: "Admin created and email sent successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


exports.deleteAdmin = async (req, res) => {
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
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
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateAdmin = async (req, res) => {
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
    res.status(500).json({ message: "Server error" });
  }
};