import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import queueRoutes from "./routes/queue.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json());
app.use("/api/queue", queueRoutes);
app.use("/api/analytics", analyticsRoutes);

// WebSocket
io.on("connection", (socket) => {
  console.log("🟢 New client connected", socket.id);
  socket.on("disconnect", () => console.log("🔴 Client disconnected", socket.id));
});

app.set("io", io);

server.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
});
