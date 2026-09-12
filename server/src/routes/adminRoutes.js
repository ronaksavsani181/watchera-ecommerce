import express from "express";
import {
  createAdminBanner,
  createAdminCoupon,
  createAdminProduct,
  deleteAdminBanner,
  deleteAdminCoupon,
  deleteAdminProduct,
  deleteAdminUser,
  getAdminBanners,
  getAdminCoupons,
  getAdminDashboard,
  getAdminOrders,
  getAdminProducts,
  getAdminReports,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminBannerStatus,
  updateAdminCouponStatus,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminUserStatus,
  // --- NEW: Shipping Controllers ---
  getShippingZones,
  createShippingZone,
  deleteShippingZone
} from "../controllers/adminController.js";

import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================
   APPLY MIDDLEWARE TO ALL ROUTES
===================================== */
router.use(protect, adminOnly);

/* =====================================
   DASHBOARD & REPORTS
===================================== */
router.get("/dashboard", getAdminDashboard);
router.get("/reports", getAdminReports);

/* =====================================
   PRODUCTS MANAGEMENT
===================================== */
router.get("/products", getAdminProducts);
router.post("/products", createAdminProduct);
router.put("/products/:id", updateAdminProduct);
router.delete("/products/:id", deleteAdminProduct);

/* =====================================
   USERS MANAGEMENT
===================================== */
router.get("/users", getAdminUsers);
router.patch("/users/:id/status", updateAdminUserStatus);
router.patch("/users/:id/reset-password", resetAdminUserPassword);
router.delete("/users/:id", deleteAdminUser);

/* =====================================
   ORDERS MANAGEMENT
===================================== */
router.get("/orders", getAdminOrders);
router.patch("/orders/:id/status", updateAdminOrderStatus);

/* =====================================
   COUPONS MANAGEMENT
===================================== */
router.get("/coupons", getAdminCoupons);
router.post("/coupons", createAdminCoupon);
router.patch("/coupons/:id/status", updateAdminCouponStatus);
router.delete("/coupons/:id", deleteAdminCoupon);

/* =====================================
   BANNERS MANAGEMENT
===================================== */
router.get("/banners", getAdminBanners);
router.post("/banners", createAdminBanner);
router.patch("/banners/:id/status", updateAdminBannerStatus);
router.delete("/banners/:id", deleteAdminBanner);

/* =====================================
   SHIPPING ZONES MANAGEMENT
===================================== */
router.get("/shipping-zones", getShippingZones);
router.post("/shipping-zones", createShippingZone);
router.delete("/shipping-zones/:id", deleteShippingZone);

export default router;