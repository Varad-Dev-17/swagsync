import express from "express";
import { adminSignIn } from "../controllers/adminController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/signin", authLimiter, adminSignIn);

export default router;
