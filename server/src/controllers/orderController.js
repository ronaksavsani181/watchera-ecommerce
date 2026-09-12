import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

/* =====================================
   HELPER FUNCTIONS & UTILS
===================================== */
const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toText = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeCouponCode = (value) => toText(value).toUpperCase();

const roundAmount = (value) =>
  Math.max(0, Math.round((toNumber(value, 0) + Number.EPSILON) * 100) / 100);

const getRazorpayCredentials = () => {
  const keyId = toText(process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID);
  const keySecret = toText(
    process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET
  );
  return { keyId, keySecret };
};

const buildRazorpayReceipt = (orderId) => {
  const safeOrderId = toText(orderId).replace(/[^a-zA-Z0-9_-]/g, "");
  const suffix = Date.now().toString().slice(-8);
  return `ord_${safeOrderId.slice(-20)}_${suffix}`.slice(0, 40);
};

const resolveRazorpayPayableAmount = (orderAmountInRupees) => {
  const MAX_ONLINE_PAYMENT_LIMIT = 15000; // Hard limit for Razorpay
  let payableAmountInRupees = roundAmount(orderAmountInRupees);
  let isAmountCapped = false;

  // Cap the amount if the order total exceeds 15,000
  if (payableAmountInRupees > MAX_ONLINE_PAYMENT_LIMIT) {
    payableAmountInRupees = MAX_ONLINE_PAYMENT_LIMIT;
    isAmountCapped = true;
  }

  return {
    payableAmountInRupees,
    isAmountCapped
  };
};

const resolveProductUnitPrice = (product) => {
  const price = toNumber(product.price, 0);
  const discountPrice = toNumber(product.discountPrice, 0);
  if (discountPrice > 0 && discountPrice < price) {
    return discountPrice;
  }
  return price;
};

const hasValidShippingAddress = (shippingAddress) => {
  const requiredFields = [
    "fullName",
    "phone",
    "address",
    "city",
    "state",
    "postalCode",
    "country"
  ];
  return requiredFields.every((field) => toText(shippingAddress?.[field]).length > 0);
};

/* =====================================
   CORE BUSINESS LOGIC
===================================== */
const validateCouponForOrder = async ({ couponCode, itemsPrice, userId }) => {
  const code = normalizeCouponCode(couponCode);
  if (!code) {
    return { valid: false, message: "Coupon code is required" };
  }

  if (itemsPrice <= 0) {
    return { valid: false, message: "Coupon cannot be applied on an empty cart" };
  }

  const now = new Date();
  const coupon = await Coupon.findOne({ code });

  if (coupon) {
    if (!coupon.isActive) return { valid: false, message: "This coupon is inactive" };
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) return { valid: false, message: "This coupon has expired" };
    
    const usageLimit = toNumber(coupon.usageLimit, 0);
    const usedCount = toNumber(coupon.usedCount, 0);
    if (usageLimit > 0 && usedCount >= usageLimit) {
      return { valid: false, message: "This coupon usage limit is reached" };
    }

    const minPurchase = toNumber(coupon.minPurchase, 0);
    if (itemsPrice < minPurchase) {
      return { valid: false, message: `Minimum purchase amount is INR ${minPurchase}` };
    }

    const discountRaw =
      coupon.discountType === "percentage"
        ? (itemsPrice * toNumber(coupon.discountValue, 0)) / 100
        : toNumber(coupon.discountValue, 0);
    
    const discount = roundAmount(Math.min(itemsPrice, Math.max(0, discountRaw)));

    if (discount <= 0) return { valid: false, message: "Invalid coupon discount value" };

    return {
      valid: true,
      code,
      discount,
      discountType: coupon.discountType,
      discountValue: toNumber(coupon.discountValue, 0),
      couponDoc: coupon
    };
  }

  // Hardcoded Fallback Coupons
  if (code === "WATCH10") {
    const discount = roundAmount((itemsPrice * 10) / 100);
    return { valid: true, code, discount, discountType: "percentage", discountValue: 10 };
  }

  if (code === "NEWUSER200") {
    const existingOrders = await Order.countDocuments({ user: userId });
    if (existingOrders > 0) return { valid: false, message: "NEWUSER200 is valid only on your first order" };

    const minimum = 1500;
    if (itemsPrice < minimum) return { valid: false, message: `Minimum purchase amount is INR ${minimum}` };

    return { valid: true, code, discountType: "flat", discountValue: 200, discount: roundAmount(Math.min(itemsPrice, 200)) };
  }

  return { valid: false, message: "Invalid coupon code" };
};

const buildCheckoutSnapshot = async ({ userId, couponCode }) => {
  const cart = await Cart.findOne({ user: userId });
  const cartItems = Array.isArray(cart?.items) ? cart.items : [];

  if (cartItems.length === 0) {
    return { valid: false, status: 400, message: "Your cart is empty" };
  }

  const normalizedItems = [];
  const stockUpdates = [];
  let calculatedItemsPrice = 0;

  for (const cartItem of cartItems) {
    const productId = cartItem?.product;
    const quantity = Math.floor(toNumber(cartItem?.quantity, 0));

    if (!productId || quantity <= 0) return { valid: false, status: 400, message: "Invalid cart item detected" };

    const product = await Product.findById(productId);
    if (!product || !product.isActive) return { valid: false, status: 400, message: "One or more products in your cart are unavailable" };

    if (toNumber(product.stock, 0) < quantity) {
      return { valid: false, status: 400, message: `${product.name} has only ${product.stock} item(s) left in stock` };
    }

    const unitPrice = roundAmount(resolveProductUnitPrice(product));
    const productImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "";

    normalizedItems.push({
      product: product._id,
      name: product.name,
      image: productImage,
      price: unitPrice,
      quantity
    });

    calculatedItemsPrice = roundAmount(calculatedItemsPrice + unitPrice * quantity);
    stockUpdates.push({ productId: product._id, quantity });
  }

  let appliedCouponCode = "";
  let couponDiscount = 0;
  let couponDoc = null;

  if (toText(couponCode)) {
    const couponResult = await validateCouponForOrder({ couponCode, itemsPrice: calculatedItemsPrice, userId });
    if (!couponResult.valid) return { valid: false, status: 400, message: couponResult.message };

    appliedCouponCode = couponResult.code;
    couponDiscount = couponResult.discount;
    couponDoc = couponResult.couponDoc || null;
  }

  const taxPrice = 0; // Configurable tax
  const shippingPrice = 0; // Configurable shipping
  const totalPrice = roundAmount(calculatedItemsPrice + taxPrice + shippingPrice - couponDiscount);

  return {
    valid: true,
    normalizedItems,
    stockUpdates,
    couponDoc,
    pricing: {
      itemsPrice: calculatedItemsPrice,
      taxPrice,
      shippingPrice,
      couponCode: appliedCouponCode,
      couponDiscount,
      totalPrice
    }
  };
};

/* =====================================
   EXPORTS / ROUTE HANDLERS
===================================== */
export const validateCoupon = async (req, res) => {
  try {
    const code = req.body?.code;
    const itemsPrice = roundAmount(Math.max(0, toNumber(req.body?.itemsPrice, 0)));

    const result = await validateCouponForOrder({ couponCode: code, itemsPrice, userId: req.user._id });

    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      coupon: {
        code: result.code,
        discount: result.discount,
        discountType: result.discountType,
        discountValue: result.discountValue
      },
      totals: {
        itemsPrice,
        discount: result.discount,
        total: roundAmount(itemsPrice - result.discount)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCheckoutSummary = async (req, res) => {
  try {
    const couponCode = req.body?.couponCode;
    const checkoutSnapshot = await buildCheckoutSnapshot({ userId: req.user._id, couponCode });

    if (!checkoutSnapshot.valid) {
      return res.status(checkoutSnapshot.status || 400).json({ success: false, message: checkoutSnapshot.message });
    }

    const summaryItems = checkoutSnapshot.normalizedItems.map((item) => ({
      productId: item.product.toString(),
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      lineTotal: roundAmount(item.price * item.quantity)
    }));

    return res.status(200).json({
      success: true,
      summary: {
        items: summaryItems,
        ...checkoutSnapshot.pricing
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;
    const normalizedPaymentMethod = toText(paymentMethod) || "Card";
    const isRazorpayCheckout = normalizedPaymentMethod.toLowerCase() === "razorpay";

    if (!hasValidShippingAddress(shippingAddress)) {
      return res.status(400).json({ success: false, message: "Complete shipping address is required" });
    }

    const checkoutSnapshot = await buildCheckoutSnapshot({ userId: req.user._id, couponCode });
    if (!checkoutSnapshot.valid) {
      return res.status(checkoutSnapshot.status || 400).json({ success: false, message: checkoutSnapshot.message });
    }

    const { normalizedItems, stockUpdates, couponDoc, pricing } = checkoutSnapshot;

    // Deduct stock immediately if NOT Razorpay
    if (!isRazorpayCheckout) {
      for (const update of stockUpdates) {
        await Product.findByIdAndUpdate(update.productId, { $inc: { stock: -update.quantity } });
      }
    }

    const createdOrder = await Order.create({
      user: req.user._id,
      orderItems: normalizedItems,
      shippingAddress,
      paymentMethod: normalizedPaymentMethod,
      ...pricing
    });

    if (couponDoc && !isRazorpayCheckout) {
      couponDoc.usedCount = toNumber(couponDoc.usedCount, 0) + 1;
      await couponDoc.save();
    }

    const order = await Order.findById(createdOrder._id).populate("orderItems.product");

    if (!isRazorpayCheckout) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });
    }

    res.status(201).json({ success: true, message: "Order created successfully", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate("orderItems.product");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);
    res.status(200).json({ success: true, totalAmount, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = req.body;
    await order.save();

    res.status(200).json({ success: true, message: "Order marked as paid" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.orderStatus = req.body.status;
    if (req.body.status === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }
    await order.save();

    res.status(200).json({ success: true, message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { keyId, keySecret } = getRazorpayCredentials();
    if (!keyId || !keySecret) return res.status(500).json({ success: false, message: "Razorpay is not configured on server" });

    const orderId = toText(req.body?.orderId);
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ success: false, message: "Valid Order ID is required" });
    }

    const orderDoc = await Order.findById(orderId);
    if (!orderDoc) return res.status(404).json({ success: false, message: "Order not found" });

    if (orderDoc.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Not authorized for this order" });
    if (orderDoc.isPaid) return res.status(400).json({ success: false, message: "Order is already paid" });

    const amountInRupees = roundAmount(toNumber(orderDoc.totalPrice, 0));
    if (amountInRupees <= 0) return res.status(400).json({ success: false, message: "Invalid order amount" });

    const { payableAmountInRupees, isAmountCapped } = resolveRazorpayPayableAmount(amountInRupees);

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const options = {
      amount: Math.round(payableAmountInRupees * 100), // Razorpay requires lowest denomination (paise)
      currency: "INR",
      receipt: buildRazorpayReceipt(orderDoc._id.toString()),
      notes: { internalOrderId: orderDoc._id.toString() }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    orderDoc.paymentMethod = "Razorpay";
    orderDoc.paymentResult = {
      ...(orderDoc.paymentResult || {}),
      status: "Created",
      razorpayOrderId: razorpayOrder.id,
      update_time: new Date().toISOString()
    };
    await orderDoc.save();

    res.status(200).json({
      success: true,
      key: keyId,
      razorpayOrder,
      orderId: orderDoc._id,
      amount: options.amount,
      currency: options.currency,
      orderAmount: amountInRupees,
      payableAmount: payableAmountInRupees,
      isAmountCapped
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ success: false, message: "Invalid payment verification payload" });
    }

    const { keySecret } = getRazorpayCredentials();
    if (!keySecret) return res.status(500).json({ success: false, message: "Razorpay is not configured" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: "Not authorized" });
    if (order.isPaid) return res.status(200).json({ success: true, message: "Payment already verified" });

    const expectedOrderId = toText(order.paymentResult?.razorpayOrderId);
    if (expectedOrderId && expectedOrderId !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: "Razorpay order id mismatch" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(body.toString()).digest("hex");

    if (expectedSignature === razorpay_signature) {
      
      const requiredQuantities = new Map();
      for (const item of order.orderItems || []) {
        const productId = item?.product?.toString?.() || toText(item?.product);
        const quantity = Math.max(1, Math.floor(toNumber(item.quantity, 0)));

        if (!productId) {
          return res.status(400).json({ success: false, message: "Invalid order item" });
        }
        requiredQuantities.set(productId, toNumber(requiredQuantities.get(productId), 0) + quantity);
      }

      const productIds = Array.from(requiredQuantities.keys());
      const products = await Product.find({ _id: { $in: productIds } });
      const productMap = new Map(products.map((product) => [product._id.toString(), product]));

      for (const [productId, quantity] of requiredQuantities.entries()) {
        const product = productMap.get(productId);
        if (!product || !product.isActive || toNumber(product.stock, 0) < quantity) {
          return res.status(400).json({ success: false, message: "One or more products went out of stock during payment" });
        }
      }

      for (const [productId, quantity] of requiredQuantities.entries()) {
        const product = productMap.get(productId);
        if (product) {
            product.stock = Math.max(0, toNumber(product.stock, 0) - quantity);
            await product.save();
        }
      }

      order.isPaid = true;
      order.paidAt = Date.now();
      order.orderStatus = "Confirmed";
      order.paymentMethod = "Razorpay";
      order.paymentResult = { id: razorpay_payment_id, status: "Paid", razorpayOrderId: razorpay_order_id, razorpaySignature: razorpay_signature, update_time: new Date().toISOString() };

      if (order.couponCode) {
        const coupon = await Coupon.findOne({ code: order.couponCode });
        if (coupon) {
          coupon.usedCount = toNumber(coupon.usedCount, 0) + 1;
          await coupon.save();
        }
      }

      await order.save();
      await Cart.findOneAndUpdate({ user: req.user._id }, { $set: { items: [] } });

      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      order.paymentResult = { ...(order.paymentResult || {}), id: razorpay_payment_id, status: "Failed", razorpayOrderId: razorpay_order_id, razorpaySignature: razorpay_signature, update_time: new Date().toISOString() };
      await order.save();
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};