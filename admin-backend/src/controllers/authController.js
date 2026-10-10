const Admin = require("../models/Admin");

const loginAdmin = async (req, res) => {
  try {
    const { email, password, securityPin, role } = req.body;

    if (!email || !password || !securityPin) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and security PIN are required",
      });
    }

    if (!/^\d{6}$/.test(securityPin)) {
      return res.status(400).json({
        success: false,
        message: "Security PIN must be exactly 6 digits",
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (admin.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (admin.securityPin !== securityPin) {
      return res.status(401).json({
        success: false,
        message: "Invalid security PIN",
      });
    }

    if (role && admin.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Selected role does not match this account",
      });
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  loginAdmin,
};