import Product from "../models/Product.js";
import mongoose from "mongoose";

/* =====================================
   HELPER FUNCTIONS
===================================== */
const toPublicProduct = (product) => {
  const plain = product.toObject ? product.toObject() : product;
  return {
    ...plain,
    // Only return reviews that are approved (or where approved is not explicitly false)
    reviews: (plain.reviews || []).filter((review) => review.approved !== false)
  };
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* =====================================
   CREATE PRODUCT (ADMIN)
===================================== */
export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   GET ALL PRODUCTS (FILTER + PAGINATION)
===================================== */
export const getAllProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    // Search by keyword (product name)
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i"
          }
        }
      : {};

    // Filter by category
    const category = req.query.category
      ? { category: req.query.category }
      : {};

    // Fetch active products matching the filters
    const products = await Product.find({
      ...keyword,
      ...category,
      isActive: true
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments({
      ...keyword,
      ...category,
      isActive: true
    });

    res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      products: products.map(toPublicProduct)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   GET SINGLE PRODUCT BY ID
===================================== */
export const getProductById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      product: toPublicProduct(product)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   GET SINGLE PRODUCT BY SLUG
===================================== */
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      product: toPublicProduct(product)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   UPDATE PRODUCT (ADMIN)
===================================== */
export const updateProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   DELETE PRODUCT (ADMIN)
===================================== */
export const deleteProduct = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   GET NEW ARRIVALS
===================================== */
export const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({
      isNewArrival: true,
      isActive: true
    }).limit(8);

    res.status(200).json({
      success: true,
      products: products.map(toPublicProduct)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   GET BEST SELLERS
===================================== */
export const getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({
      isBestSeller: true,
      isActive: true
    }).limit(8);

    res.status(200).json({
      success: true,
      products: products.map(toPublicProduct)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =====================================
   ADD PRODUCT REVIEW
===================================== */
export const addProductReview = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product"
      });
    }

    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: numericRating,
      comment
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;

    product.ratings =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};