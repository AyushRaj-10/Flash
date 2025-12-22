import express from "express";
import staffController from "../controllers/staff.controller.js";

const router = express.Router();

router.post("/login", staffController.login);
router.get("/next", staffController.getNext);
router.post("/admit-next", staffController.admitNext);
router.post("/skip", staffController.skip);

export default router;
