import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true },
    name: { type: String, required: true },
    partySize: { type: Number, required: true },
    email: { type: String, required: true },       // NEW
    status: { type: String, enum: ["WAITING", "SEATED"], default: "WAITING" },
    eventDate: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }  // TTL
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
