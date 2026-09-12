import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

/* =====================================
   HELPER FUNCTIONS
===================================== */
const ensureCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: []
    });
  }

  // Self-healing: Remove any cart items where the product reference is dead/null
  cart.items = cart.items.filter(item => item.product != null);
  return cart;
};

const getPopulatedCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (cart) {
    // Filter out populated products that came back null (meaning they were deleted from DB)
    cart.items = cart.items.filter(item => item.product != null);
  }
  return cart;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* =====================================
   GET USER CART
===================================== */
export const getCart = async (req, res) => {
  try {
    await ensureCart(req.user._id);
    const cart = await getPopulatedCart(req.user._id);

    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================
   ADD TO CART
===================================== */
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: "Product not available" });
    }

    const parsedQuantity = Math.max(1, Number(quantity) || 1);
    const cart = await ensureCart(req.user._id);
    
    // FIX: Added ?. to safely handle null references
    const itemIndex = cart.items.findIndex(
      (item) => item.product?.toString() === String(productId)
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += parsedQuantity;
    } else {
      cart.items.push({ product: productId, quantity: parsedQuantity });
    }

    await cart.save();
    const populatedCart = await getPopulatedCart(req.user._id);

    res.status(200).json({ success: true, message: "Product added to cart", cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================
   UPDATE CART ITEM
===================================== */
export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID format" });
    }

    const cart = await ensureCart(req.user._id);

    // FIX: Added ?. to safely handle null references
    const item = cart.items.find(
      (entry) => entry.product?.toString() === String(productId)
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    item.quantity = Math.max(1, Number(quantity) || 1);
    await cart.save();

    const populatedCart = await getPopulatedCart(req.user._id);
    
    res.status(200).json({ success: true, message: "Cart updated", cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =====================================
   REMOVE FROM CART
===================================== */
export const removeFromCart = async (req, res) => {
  try {
    const productId = req.body?.productId || req.query?.productId || req.params?.productId;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Valid productId is required" });
    }

    const cart = await ensureCart(req.user._id);
    
    // FIX: Added ?. to safely handle null references
    cart.items = cart.items.filter(
      (item) => item.product?.toString() !== String(productId)
    );

    await cart.save();
    const populatedCart = await getPopulatedCart(req.user._id);

    res.status(200).json({ success: true, message: "Item removed from cart", cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};