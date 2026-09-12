import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

/* =====================================
   HELPER FUNCTIONS
===================================== */
const ensureWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      products: []
    });
  }

  return wishlist;
};

const getPopulatedWishlist = async (userId) => {
  return await Wishlist.findOne({ user: userId }).populate("products");
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* =====================================
   GET WISHLIST
===================================== */
export const getWishlist = async (req, res) => {
  try {
    await ensureWishlist(req.user._id);
    const wishlist = await getPopulatedWishlist(req.user._id);

    res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   ADD TO WISHLIST
===================================== */
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Product ID is required"
      });
    }

    // Verify the product actually exists before adding
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const wishlist = await ensureWishlist(req.user._id);

    if (!wishlist.products.find((id) => id.toString() === productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    const populatedWishlist = await getPopulatedWishlist(req.user._id);
    
    res.status(200).json({
      success: true,
      message: "Added to wishlist",
      wishlist: populatedWishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   REMOVE FROM WISHLIST
===================================== */
export const removeFromWishlist = async (req, res) => {
  try {
    const productId =
      req.body?.productId || req.query?.productId || req.params?.productId;

    if (!productId || !isValidObjectId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid productId is required"
      });
    }

    const wishlist = await ensureWishlist(req.user._id);
    
    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId
    );
    
    await wishlist.save();

    const populatedWishlist = await getPopulatedWishlist(req.user._id);
    
    res.status(200).json({
      success: true,
      message: "Removed from wishlist",
      wishlist: populatedWishlist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};