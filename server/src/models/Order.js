import mongoose from "mongoose";

/* ==============================
   ORDER ITEM SCHEMA (Subdocument)
============================== */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: String,
    image: String,
    price: Number,
    quantity: {
      type: Number,
      required: true
    }
  },
  { _id: false } // Prevents Mongoose from creating an _id for each order item
);

/* ==============================
   SHIPPING SCHEMA (Subdocument)
============================== */
const shippingSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  { _id: false }
);

/* ==============================
   MAIN ORDER SCHEMA
============================== */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    orderItems: [orderItemSchema],
    shippingAddress: shippingSchema,

    /* PAYMENT DETAILS */
    paymentMethod: {
      type: String,
      default: "Card"
    },
    paymentResult: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
      razorpayOrderId: String,
      razorpaySignature: String
    },

    /* PRICING DETAILS */
    itemsPrice: {
      type: Number,
      required: true,
      default: 0
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0
    },

    /* COUPON DETAILS */
    couponCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0
    },

    /* STATUS FLAGS */
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,

    isDelivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
        "Refunded"
      ],
      default: "Pending"
    }
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;