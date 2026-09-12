import mongoose from "mongoose";

/* ==============================
   REVIEW SCHEMA (Subdocument)
============================== */
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    name: String,
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    approved: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* ==============================
   MAIN PRODUCT SCHEMA
============================== */
const productSchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    name: {
      type: String,
      required: [true, "Product name required"],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      required: true
    },
    shortDescription: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      required: true
    },
    modelNumber: {
      type: String
    },
    sku: {
      type: String,
      required: true,
      unique: true
    },
    category: {
      type: String,
      enum: ["Luxury", "Sport", "Casual", "Smart"],
      required: true
    },
    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      required: true
    },
    subcategory: {
      type: String
    },

    /* PRICING & INVENTORY */
    price: {
      type: Number,
      required: true
    },
    discountPrice: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      required: true,
      default: 0
    },

    /* MEDIA */
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.length >= 1;
        },
        message: "Minimum 1 product image required"
      }
    },
    video: {
      type: String
    },

    /* WATCH SPECIFICATIONS */
    movement: String,
    caseMaterial: String,
    strapMaterial: String,
    dialColor: String,
    caseSize: String,
    waterResistance: String,
    weight: String,
    warranty: String,

    /* VISIBILITY FLAGS */
    isFeatured: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },

    /* REVIEWS & RATINGS */
    reviews: [reviewSchema],
    ratings: {
      type: Number,
      default: 0
    },
    numReviews: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;