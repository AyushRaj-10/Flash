import express from "express";
import queueController from "../controllers/queue.controller.js";

const router = express.Router();

router.post("/join", queueController.joinQueue);
router.get("/status", queueController.getQueue);
router.delete("/cancel/:id", queueController.cancelQueue);
router.post("/seat", queueController.seatNext);

export default router;
