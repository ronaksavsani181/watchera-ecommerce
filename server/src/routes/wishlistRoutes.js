import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getWishlist);
router.post("/add", protect, addToWishlist);
router.delete("/remove", protect, removeFromWishlist);
router.delete("/remove/:productId", protect, removeFromWishlist);

export default router;