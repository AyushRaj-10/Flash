import express from "express";
import analyticsController from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/stats", analyticsController.getStats);

export default router;
