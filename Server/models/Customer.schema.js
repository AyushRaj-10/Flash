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

    phoneNumber: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ["WAITING", "SEATED"],
      default: "WAITING"
    },

    position: {
      type: Number,
      default: 0
    },

    estimatedWaitTime: {
      type: Number,
      default: 0
    },

    joinedAt: {
      type: Date,
      default: Date.now
    },

    seatedAt: {
      type: Date,
      default: null
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
