import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_TEST_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_TEST_KEY_SECRET || "";

let razorpay = null;

if (keyId && keySecret) {
  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
} else {
  console.warn("⚠️ Razorpay keys not found. Payment features will not work until added to .env");
}

export default razorpay;