import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ==============================
   PROTECT ROUTE (Logged In User)
============================== */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token missing"
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and exclude the password from the result
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or has been deleted"
      });
    }

    // Check if the user is banned/inactive
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked. Please contact support."
      });
    }

    // Attach user to the request object so other routes can use it
    req.user = user;
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired, please log in again"
      });
    }
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token"
    });
  }
};

/* ==============================
   ADMIN ONLY MIDDLEWARE
============================== */
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required."
    });
  }
};