import express from "express";
import multer from "multer";
import { identifier } from "../middlewares/identification.js";
import {
  createTicket,
  getMyTickets,
  getMyTicketById,
  addTicketReplyUser,
} from "../controllers/ticketController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .webp formats allowed"), false);
    }
  },
});

// All ticket routes require user authentication
router.use(identifier);

// Create ticket (optional image upload)
router.post("/", upload.single("image"), createTicket);

// Get all tickets of current user
router.get("/my-tickets", getMyTickets);

// Get single ticket details
router.get("/:id", getMyTicketById);

// Send reply on ticket
router.post("/:id/reply", addTicketReplyUser);

export default router;
