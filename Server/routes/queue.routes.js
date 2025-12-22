import express from "express";
import queueController from "../controllers/queue.controller.js";

const router = express.Router();

router.post("/join", queueController.joinQueue);
router.get("/", queueController.getQueue);
router.post("/seat", queueController.seatNext);

export default router;
