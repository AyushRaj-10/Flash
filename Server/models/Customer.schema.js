import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true
    },

    name: {
      type: String,
      required: true
    },

    partySize: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ["WAITING", "SEATED"],
      default: "WAITING"
    },

    // 🔥 User-provided event date
    eventDate: {
      type: Date,
      required: true
    },

    // 🔥 TTL field (MongoDB watches this)
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
