import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    partySize: { type: Number, required: true },
    email: { type: String, required: true },
    status: { type: String, enum: ["WAITING", "SEATED"], default: "WAITING" },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", CustomerSchema);
