import mongoose from "mongoose";

const shippingZoneSchema = new mongoose.Schema(
  {
    region: { 
      type: String, 
      required: [true, "Region name is required"], 
      trim: true 
    },
    cost: { 
      type: Number, 
      required: [true, "Shipping cost is required"], 
      default: 0,
      min: [0, "Cost cannot be negative"]
    },
    eta: { 
      type: String, 
      default: "3-5 days", 
      trim: true 
    }
  },
  { 
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

const ShippingZone = mongoose.model("ShippingZone", shippingZoneSchema);

export default ShippingZone;