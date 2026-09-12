import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ==============================
   GENERATE JWT TOKEN
============================== */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

/* ==============================
   REGISTER USER
============================== */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: sanitizedEmail,
      password
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==============================
   LOGIN USER
============================== */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Select password manually because select:false in schema
    const user = await User.findOne({ email: sanitizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Please contact support."
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ==============================
   RESET PASSWORD (EMAIL + NEW PASSWORD)
============================== */
export const resetPasswordByEmail = async (req, res) => {
  try {
    const email = (req.body?.email || "").toLowerCase().trim();
    const password = req.body?.password || "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found for this email"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is blocked. Please contact support."
      });
    }

    user.password = password;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};