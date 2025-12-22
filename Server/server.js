import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import connectDB from "./config/db.js";
import queueRoutes from "./routes/queue.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import Customer from "./models/Customer.schema.js";

// 🔥 LOAD ENV VARIABLES FIRST
dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 5000;

// 🔥 THEN CONNECT DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/queue", queueRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/analytics", analyticsRoutes);

// Broadcast updates to all connected clients
export function broadcastUpdate(type, data) {
  const message = JSON.stringify({ type, data, timestamp: Date.now() });
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// WebSocket connection handling
wss.on('connection', async (ws) => {
  console.log('Client connected');

  try {
    // Send initial queue state
    const queue = await Customer.find({ status: "WAITING" }).sort({
      createdAt: 1
    });

    ws.send(JSON.stringify({
      type: 'INITIAL_STATE',
      data: {
        queue: queue,
        queueLength: queue.length
      }
    }));
  } catch (error) {
    console.error('Error sending initial state:', error);
  }

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Queue system initialized`);
});
