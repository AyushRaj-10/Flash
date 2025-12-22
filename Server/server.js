import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import queueRoutes from "./routes/queue.routes.js";

// 🔥 LOAD ENV VARIABLES FIRST
dotenv.config();

const app = express();
const PORT = 3000;

// 🔥 THEN CONNECT DB
connectDB();

app.use(express.json());
app.use("/api/queue", queueRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
