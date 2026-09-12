import express from "express";
import {
  createOrder,
  validateCoupon,
  getCheckoutSummary,
  getMyOrders,
  getOrderById,
  getAllOrders,
  markOrderAsPaid,
  updateOrderStatus,
  createRazorpayOrder,
  verifyRazorpayPayment
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.post("/validate-coupon", protect, validateCoupon);
router.post("/checkout-summary", protect, getCheckoutSummary);
router.get("/my-orders", protect, getMyOrders);
router.post("/razorpay", protect, createRazorpayOrder);
router.post("/verify-payment", protect, verifyRazorpayPayment);
router.get("/:id", protect, getOrderById);
router.put("/:id/pay", protect, markOrderAsPaid);

// Admin Routes
router.get("/", protect, adminOnly, getAllOrders);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default router;