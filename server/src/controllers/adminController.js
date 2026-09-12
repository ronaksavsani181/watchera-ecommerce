import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Coupon from "../models/Coupon.js";
import Banner from "../models/Banner.js";
import ShippingZone from "../models/ShippingZone.js"; // Added for 100% real data

const ORDER_STATUS_OPTIONS = [
  "Pending", "Confirmed", "Processing", "Shipped",
  "Out for Delivery", "Delivered", "Cancelled", "Returned", "Refunded"
];

const PRODUCT_CATEGORIES = ["Luxury", "Sport", "Casual", "Smart"];
const PRODUCT_GENDERS = ["Men", "Women", "Unisex"];

// --- Helper Functions ---
const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
};

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toText = (value) => (typeof value !== "string" ? "" : value.trim());

const slugify = (value) => toText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const normalizeCouponType = (value) => {
  const type = toText(value).toLowerCase();
  return ["flat", "percentage"].includes(type) ? type : "";
};

const normalizeBannerStatus = (status, isActive) => {
  const statusText = toText(status).toLowerCase();
  if (statusText === "active") return true;
  if (statusText === "inactive") return false;
  return toBoolean(isActive, true);
};

const normalizeImages = (images, image) => {
  if (Array.isArray(images)) return images.map(toText).filter(Boolean);
  if (typeof images === "string") return images.split(/[\n,]/).map(toText).filter(Boolean);
  if (typeof image === "string" && toText(image)) return [toText(image)];
  return [];
};

const isRevenueOrder = (order) => !["Cancelled", "Refunded"].includes(order.orderStatus);

const getStartOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
const getEndOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const resolveRange = (range, from, to) => {
  const now = new Date();
  const todayEnd = getEndOfDay(now);

  if (range === "week") return { start: getStartOfDay(addDays(now, -6)), end: todayEnd, bucket: "day" };
  if (range === "quarter") return { start: getStartOfDay(addDays(now, -89)), end: todayEnd, bucket: "month" };
  if (range === "year") return { start: new Date(now.getFullYear(), now.getMonth() - 11, 1), end: todayEnd, bucket: "month" };
  
  if (range === "custom" && from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
      const start = getStartOfDay(fromDate);
      const end = getEndOfDay(toDate);
      const bucket = Math.round((end - start) / 86400000) > 90 ? "month" : "day";
      return { start, end, bucket };
    }
  }
  return { start: getStartOfDay(addDays(now, -29)), end: todayEnd, bucket: "day" };
};

const bucketKey = (date, bucket) => bucket === "month" 
  ? `${date.getFullYear()}-${date.getMonth() + 1}` 
  : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const formatBucketLabel = (date, bucket) => bucket === "month"
  ? date.toLocaleDateString("en-IN", { month: "short", year: "2-digit" })
  : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const buildSeries = (orders, start, end, bucket) => {
  const points = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    points.push({ key: bucketKey(cursor, bucket), label: formatBucketLabel(cursor, bucket), value: 0 });
    bucket === "month" ? cursor.setMonth(cursor.getMonth() + 1) : cursor.setDate(cursor.getDate() + 1);
  }

  const pointMap = new Map(points.map((p) => [p.key, p]));

  orders.forEach(order => {
    if (!isRevenueOrder(order)) return;
    const key = bucketKey(new Date(order.createdAt), bucket);
    if (pointMap.has(key)) pointMap.get(key).value += toNumber(order.totalPrice, 0);
  });

  return points.map(({ key, ...rest }) => rest);
};

const mapOrder = (order) => ({
  _id: order._id,
  user: order.user ? { _id: order.user._id, name: order.user.name, email: order.user.email } : null,
  totalPrice: order.totalPrice,
  orderStatus: order.orderStatus,
  paymentMethod: order.paymentMethod,
  isPaid: order.isPaid,
  createdAt: order.createdAt,
  itemCount: Array.isArray(order.orderItems) ? order.orderItems.reduce((acc, item) => acc + toNumber(item.quantity, 0), 0) : 0
});

const buildTopSelling = (orders, limit = 5) => {
  const buckets = new Map();
  orders.filter(isRevenueOrder).forEach(order => {
    (order.orderItems || []).forEach(item => {
      const id = item.product?.toString() || item.product || item.name;
      if (!id) return;
      
      const qty = toNumber(item.quantity, 0);
      const existing = buckets.get(id) || { productId: id, name: item.name || "Watch", image: item.image || "", quantity: 0, revenue: 0 };
      existing.quantity += qty;
      existing.revenue += qty * toNumber(item.price, 0);
      buckets.set(id, existing);
    });
  });
  return [...buckets.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
};

const buildProductPayload = (body, isCreate = true) => {
  const name = toText(body.name);
  const payload = {
    name: name || undefined,
    description: toText(body.description) || undefined,
    shortDescription: toText(body.shortDescription) || undefined,
    brand: toText(body.brand) || undefined,
    modelNumber: toText(body.modelNumber) || undefined,
    sku: toText(body.sku) || undefined,
    slug: toText(body.slug) || undefined,
    category: PRODUCT_CATEGORIES.includes(body.category) ? body.category : undefined,
    gender: PRODUCT_GENDERS.includes(body.gender) ? body.gender : undefined,
    subcategory: toText(body.subcategory) || undefined,
    price: body.price !== undefined ? toNumber(body.price, 0) : undefined,
    discountPrice: body.discountPrice !== undefined ? toNumber(body.discountPrice, 0) : undefined,
    stock: body.stock !== undefined ? toNumber(body.stock, 0) : undefined,
    images: normalizeImages(body.images, body.image).length > 0 ? normalizeImages(body.images, body.image) : undefined,
    video: toText(body.video) || undefined,
    movement: toText(body.movement) || undefined,
    caseMaterial: toText(body.caseMaterial) || undefined,
    strapMaterial: toText(body.strapMaterial) || undefined,
    dialColor: toText(body.dialColor) || undefined,
    caseSize: toText(body.caseSize) || undefined,
    waterResistance: toText(body.waterResistance) || undefined,
    warranty: toText(body.warranty) || undefined,
    isFeatured: body.isFeatured !== undefined ? toBoolean(body.isFeatured) : undefined,
    isNewArrival: body.isNewArrival !== undefined ? toBoolean(body.isNewArrival) : undefined,
    isBestSeller: body.isBestSeller !== undefined ? toBoolean(body.isBestSeller) : undefined,
    isActive: body.isActive !== undefined ? toBoolean(body.isActive, true) : undefined
  };

  if (!isCreate) {
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    return payload;
  }

  payload.name = payload.name || "Watchera Timepiece";
  payload.brand = payload.brand || "Watchera";
  payload.description = payload.description || "Premium watch.";
  payload.shortDescription = payload.shortDescription || payload.description.slice(0, 140);
  payload.slug = payload.slug || `${slugify(payload.name)}-${Date.now()}`;
  payload.sku = payload.sku || `WR-${Date.now()}`;
  payload.category = payload.category || "Luxury";
  payload.gender = payload.gender || "Unisex";
  payload.price = payload.price ?? 0;
  payload.stock = payload.stock ?? 0;
  payload.images = payload.images || ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1200"];
  payload.isActive = payload.isActive ?? true;
  return payload;
};

// --- Controllers ---

export const getAdminDashboard = async (req, res) => {
  try {
    const { range = "month", from, to } = req.query;
    const { start, end, bucket } = resolveRange(range, from, to);

    const [products, users, orders, recentOrderDocs, recentUserDocs] = await Promise.all([
      Product.find().select('stock').lean(),
      User.find().select('role').lean(),
      Order.find().populate("user", "name email").lean(),
      Order.find().populate("user", "name email").sort({ createdAt: -1 }).limit(8).lean(),
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(8).select("-password").lean()
    ]);

    const rangeOrders = orders.filter(o => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end);
    const validOrders = orders.filter(isRevenueOrder);
    const now = new Date();

    const calculateSales = (dateFrom) => validOrders
      .filter(o => new Date(o.createdAt) >= dateFrom)
      .reduce((acc, o) => acc + toNumber(o.totalPrice, 0), 0);

    res.status(200).json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalCustomers: users.filter(u => u.role === "user").length,
        totalOrders: orders.length,
        totalRevenue: validOrders.reduce((acc, o) => acc + toNumber(o.totalPrice, 0), 0),
        pendingOrders: orders.filter(o => ["Pending", "Confirmed", "Processing", "Shipped", "Out for Delivery"].includes(o.orderStatus)).length,
        lowStockProducts: products.filter(p => toNumber(p.stock, 0) <= 5).length,
        salesToday: calculateSales(getStartOfDay(now)),
        salesWeekly: calculateSales(getStartOfDay(addDays(now, -6))),
        salesMonthly: calculateSales(getStartOfDay(addDays(now, -29))),
        salesYearly: calculateSales(new Date(now.getFullYear(), 0, 1))
      },
      salesSeries: buildSeries(rangeOrders, start, end, bucket),
      topSelling: buildTopSelling(orders, 6),
      recentOrders: recentOrderDocs.map(mapOrder),
      recentCustomers: recentUserDocs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminReports = async (req, res) => {
  try {
    const { range = "month", from, to } = req.query;
    const { start, end, bucket } = resolveRange(range, from, to);

    const [products, orders] = await Promise.all([
      Product.find().select('stock').lean(),
      Order.find({ createdAt: { $gte: start, $lte: end } }).populate("user", "name email").lean()
    ]);

    const validOrders = orders.filter(isRevenueOrder);
    const totalRevenue = validOrders.reduce((acc, o) => acc + toNumber(o.totalPrice, 0), 0);

    res.status(200).json({
      success: true,
      summary: {
        totalRevenue,
        totalOrders: orders.length,
        unitsSold: validOrders.reduce((acc, o) => acc + (o.orderItems || []).reduce((qty, i) => qty + toNumber(i.quantity, 0), 0), 0),
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        lowStockProducts: products.filter(p => toNumber(p.stock, 0) <= 5 && toNumber(p.stock, 0) > 0).length,
        outOfStockProducts: products.filter(p => toNumber(p.stock, 0) <= 0).length
      },
      statusBreakdown: ORDER_STATUS_OPTIONS.map(status => ({ status, count: orders.filter(o => o.orderStatus === status).length })),
      salesSeries: buildSeries(orders, start, end, bucket),
      topSelling: buildTopSelling(orders, 10),
      orders: orders.slice(0, 200).map(mapOrder)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Product CRUD ---
export const getAdminProducts = async (req, res) => {
  try {
    const page = Math.max(1, toNumber(req.query.page, 1));
    const limit = Math.min(200, Math.max(1, toNumber(req.query.limit, 40))); // Increased limit for inventory management
    const query = {};

    if (req.query.keyword) query.$or = [{ name: new RegExp(req.query.keyword, 'i') }, { sku: new RegExp(req.query.keyword, 'i') }];
    if (req.query.category) query.category = req.query.category;
    if (req.query.status === "active") query.isActive = true;
    if (req.query.status === "inactive") query.isActive = false;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(query)
    ]);

    res.status(200).json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdminProduct = async (req, res) => {
  try {
    const product = await Product.create(buildProductPayload(req.body, true));
    res.status(201).json({ success: true, message: "Product created successfully", product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAdminProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, buildProductPayload(req.body, false), { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product updated successfully", product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAdminProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- User Management ---
export const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminUserStatus = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) return res.status(400).json({ success: false, message: "Cannot block yourself." });
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: toBoolean(req.body.isActive, true) }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: `User ${user.isActive ? "unblocked" : "blocked"}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetAdminUserPassword = async (req, res) => {
  try {
    if (toText(req.body.password).length < 6) return res.status(400).json({ success: false, message: "Password min 6 chars" });
    const user = await User.findById(req.params.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.password = toText(req.body.password);
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdminUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) return res.status(400).json({ success: false, message: "Cannot delete yourself." });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Orders Management ---
export const getAdminOrders = async (req, res) => {
  try {
    const page = Math.max(1, toNumber(req.query.page, 1));
    const limit = Math.min(250, Math.max(1, toNumber(req.query.limit, 50)));
    const query = req.query.status ? { orderStatus: req.query.status } : {};

    const [orders, total] = await Promise.all([
      Order.find(query).populate("user", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(query)
    ]);

    res.status(200).json({ success: true, orders: orders.map(mapOrder), total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdminOrderStatus = async (req, res) => {
  try {
    const status = toText(req.body.status);
    if (!ORDER_STATUS_OPTIONS.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.orderStatus = status;
    if (status === "Delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }
    await order.save();
    res.status(200).json({ success: true, message: "Order updated", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Coupons & Banners (Optimized) ---
export const getAdminCoupons = async (req, res) => {
  try {
    res.status(200).json({ success: true, coupons: await Coupon.find().sort({ createdAt: -1 }).lean() });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createAdminCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({
      code: toText(req.body.code).toUpperCase(),
      discountType: normalizeCouponType(req.body.discountType),
      discountValue: toNumber(req.body.value || req.body.discountValue, 0),
      minPurchase: toNumber(req.body.minPurchase, 0),
      usageLimit: toNumber(req.body.usageLimit, 0),
      isActive: toBoolean(req.body.active || req.body.isActive, true),
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
    });
    res.status(201).json({ success: true, message: "Coupon created", coupon });
  } catch (error) { res.status(400).json({ success: false, message: error.code === 11000 ? "Code exists" : error.message }); }
};

export const updateAdminCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { isActive: toBoolean(req.body.isActive) }, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, message: "Updated", coupon });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteAdminCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getAdminBanners = async (req, res) => {
  try { res.status(200).json({ success: true, banners: await Banner.find().sort({ sortOrder: 1, createdAt: -1 }).lean() }); } 
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const createAdminBanner = async (req, res) => {
  try {
    const banner = await Banner.create({
      title: toText(req.body.title),
      image: toText(req.body.imageUrl || req.body.image),
      redirectLink: toText(req.body.redirectLink) || "/collections",
      sortOrder: toNumber(req.body.sortOrder, 0),
      isActive: normalizeBannerStatus(req.body.status, req.body.isActive)
    });
    res.status(201).json({ success: true, message: "Created", banner });
  } catch (error) { res.status(400).json({ success: false, message: error.message }); }
};

export const updateAdminBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, { isActive: toBoolean(req.body.isActive) }, { new: true });
    res.status(200).json({ success: true, message: "Updated", banner });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const deleteAdminBanner = async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};


// =========================================================================
// NEW: 100% REAL SHIPPING ENDPOINTS (Replaces Mock Data)
// =========================================================================

export const getShippingZones = async (req, res) => {
  try {
    const zones = await ShippingZone.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, zones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createShippingZone = async (req, res) => {
  try {
    const region = toText(req.body.region);
    if (!region) return res.status(400).json({ success: false, message: "Region is required" });

    const zone = await ShippingZone.create({
      region,
      cost: Math.max(0, toNumber(req.body.cost, 0)),
      eta: toText(req.body.eta) || "3-5 days"
    });
    res.status(201).json({ success: true, message: "Shipping zone added", zone });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteShippingZone = async (req, res) => {
  try {
    const zone = await ShippingZone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: "Zone not found" });
    res.status(200).json({ success: true, message: "Shipping zone removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};