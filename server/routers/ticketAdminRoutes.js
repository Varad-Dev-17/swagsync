import express from "express";
import { identifier } from "../middlewares/identification.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import {
  getAllTicketsAdmin,
  getTicketByIdAdmin,
  updateTicketStatusAdmin,
  respondTicketAdmin,
  deleteTicketAdmin,
} from "../controllers/ticketController.js";

const router = express.Router();

// Admin protection for all routes
router.use(identifier);
router.use(isAdmin);

router.get("/", getAllTicketsAdmin);
router.get("/:id", getTicketByIdAdmin);
router.patch("/:id/status", updateTicketStatusAdmin);
router.post("/:id/reply", respondTicketAdmin);
router.delete("/:id", deleteTicketAdmin);

export default router;
