import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

// Import the database connection we just created
import connectDB from "./config/db.js"; 

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// Load environment variables
dotenv.config();

const app = express();

/* ==============================
   MIDDLEWARE
============================== */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4200",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

/* ==============================
   HEALTH CHECK ROUTE
============================== */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Watchera API Running",
  });
});

/* ==============================
   ROUTES
============================== */
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/admin", adminRoutes);

/* ==============================
   SERVER SETUP
============================== */
const PORT = Number(process.env.PORT || 5000);
const MAX_PORT_ATTEMPTS = 10;

const listenWithFallback = (startPort, maxAttempts = MAX_PORT_ATTEMPTS) =>
  new Promise((resolve, reject) => {
    let attempts = 0;

    const tryListen = (port) => {
      const server = app.listen(port, () => resolve({ server, port }));

      server.once("error", (error) => {
        attempts += 1;

        if (error.code === "EADDRINUSE" && attempts < maxAttempts) {
          console.warn(`Port ${port} is in use. Trying ${port + 1}...`);
          setTimeout(() => tryListen(port + 1), 100);
          return;
        }

        reject(error);
      });
    };

    tryListen(startPort);
  });

const startServer = async () => {
  try {
    // 1. Connect to MongoDB using the config/db.js file
    await connectDB();

    // 2. Start Express Server
    const { port } = await listenWithFallback(PORT);
    console.log(`🚀 Server running on port ${port}`);

    // 3. Check Razorpay configs
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      console.log("💳 Razorpay configured successfully");
    } else {
      console.warn("⚠️ Razorpay keys are missing in .env");
    }
  } catch (error) {
    console.error("❌ Error starting server:", error.message);
    process.exit(1);
  }
};

startServer();