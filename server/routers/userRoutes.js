import express from "express";
import {
  getAllUsers,
  getUserDetails,
  makeAdmin,
  removeAdmin,
  deleteUser,
  toggleUserStatus,
} from "../controllers/userController.js";

import { identifier } from "../middlewares/identification.js";
import { isAdmin } from "../middlewares/isAdmin.js";

const router = express.Router();

router.get("/", identifier, isAdmin, getAllUsers);
router.get("/:id", identifier, isAdmin, getUserDetails);
router.patch("/make-admin/:userId", identifier, isAdmin, makeAdmin);
router.patch("/remove-admin/:userId", identifier, isAdmin, removeAdmin);
router.delete("/:id", identifier, isAdmin, deleteUser);
router.put("/:id/toggle-status", identifier, isAdmin, toggleUserStatus);

export default router;
