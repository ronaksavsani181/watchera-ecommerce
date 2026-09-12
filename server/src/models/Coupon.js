import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ["flat", "percentage"],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: 0
    },
    expiryDate: {
      type: Date
    },
    usageLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;