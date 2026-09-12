import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.put("/update", protect, updateCartItem);
router.delete("/remove", protect, removeFromCart);
router.delete("/remove/:productId", protect, removeFromCart);

export default router;