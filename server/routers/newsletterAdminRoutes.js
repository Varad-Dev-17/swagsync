import express from "express";
import { getSubscribers, broadcastNewsletter } from "../controllers/newsletterController.js";
import { identifier } from "../middlewares/identification.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.get("/subscribers", identifier, isAdmin, getSubscribers);
router.post("/broadcast", identifier, isAdmin, broadcastNewsletter);

export default router;
