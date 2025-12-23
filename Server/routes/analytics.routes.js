import express from "express";
import analyticsController from "../controllers/analytics.controller.js";

const router = express.Router();

// Analytics endpoints
router.get("/stats", analyticsController.getStats);                   // Get queue stats
router.get("/seated", analyticsController.getSeatedForAnalytics);    // Get all seated customers

export default router;
