import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";
import { getNextSequence } from "../utils/counterHelper.js";
import { createNotification } from "../utils/notificationHelper.js";

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

// Safe query helper that supports both Mongo _id and custom sequential ticketId (e.g. TKT-1)
const getTicketQuery = (id, extra = {}) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ _id: id }, { ticketId: id }], ...extra };
  }
  return { ticketId: id, ...extra };
};

// Upload buffer directly to Cloudinary
const uploadImageBuffer = async (buffer, mimetype) => {
  configureCloudinary();
  const b64 = Buffer.from(buffer).toString("base64");
  const dataURI = "data:" + mimetype + ";base64," + b64;
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      dataURI,
      { folder: "swagsync-tickets", resource_type: "image" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};

// ================= USER CONTROLLERS =================

// Create a new support ticket (with optional image)
export const createTicket = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { category, orderId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a description for your issue",
      });
    }

    let uploadedImageData = { url: "", publicId: "" };

    // If an image file is attached via multer
    if (req.file) {
      try {
        const uploadRes = await uploadImageBuffer(
          req.file.buffer,
          req.file.mimetype
        );
        uploadedImageData = {
          url: uploadRes.secure_url,
          publicId: uploadRes.public_id,
        };
      } catch (uploadError) {
        console.error("Ticket image upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload attached image. Please try again.",
        });
      }
    }

    // Generate sequential ticket number
    const seq = await getNextSequence("ticketId");
    const ticketId = `TKT-${seq}`;

    const newTicket = new Ticket({
      ticketId,
      user: userId,
      category: category || "Order Issues",
      orderId: orderId ? orderId.trim() : "",
      message: message.trim(),
      image: uploadedImageData,
      status: "open",
    });

    await newTicket.save();

    // Trigger notification for user
    createNotification({
      userId,
      type: "ticket",
      title: "Support Ticket Raised",
      message: `Your ticket #${newTicket.ticketId} (${newTicket.category}) has been submitted. Our support team will review it shortly.`,
      link: "/account/tickets",
      linkText: "View Ticket",
      iconType: "ticket",
      color: "amber",
      entityId: newTicket._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("[Create Ticket Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create ticket. Server error.",
    });
  }
};

// Get all tickets created by the logged-in user
export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const tickets = await Ticket.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      tickets,
    });
  } catch (error) {
    console.error("[Get My Tickets Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets. Server error.",
    });
  }
};

// Get single ticket by ID for user
export const getMyTicketById = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const ticket = await Ticket.findOne(getTicketQuery(id, { user: userId }));

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("[Get My Ticket By Id Error]:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching ticket",
    });
  }
};

// User replies to an existing ticket
export const addTicketReplyUser = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const ticket = await Ticket.findOne(getTicketQuery(id, { user: userId }));

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (ticket.status === "closed") {
      return res.status(400).json({
        success: false,
        message: "This ticket is closed. Please open a new ticket.",
      });
    }

    const user = await User.findById(userId).select("username");

    ticket.responses.push({
      sender: "user",
      senderName: user?.username || req.user?.username || "Customer",
      senderId: userId,
      message: message.trim(),
      createdAt: new Date(),
    });

    // If ticket was resolved, reopening it
    if (ticket.status === "resolved") {
      ticket.status = "open";
    }

    ticket.lastResponseAt = new Date();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      ticket,
    });
  } catch (error) {
    console.error("[User Reply Ticket Error]:", error);
    res.status(500).json({
      success: false,
      message: "Server error replying to ticket",
    });
  }
};

// ================= ADMIN CONTROLLERS =================

// Admin: Get all tickets with filtering, search, pagination
export const getAllTicketsAdmin = async (req, res) => {
  try {
    const {
      status,
      category,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      // Find matching users first
      const matchedUsers = await User.find({
        $or: [{ username: searchRegex }, { email: searchRegex }],
      }).select("_id");
      const matchedUserIds = matchedUsers.map((u) => u._id);

      query.$or = [
        { ticketId: searchRegex },
        { orderId: searchRegex },
        { message: searchRegex },
        { user: { $in: matchedUserIds } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, totalCount, statsData] = await Promise.all([
      Ticket.find(query)
        .populate("user", "username email mobileNo profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Ticket.countDocuments(query),
      Ticket.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = {
      total: 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    };

    statsData.forEach((s) => {
      if (stats[s._id] !== undefined) {
        stats[s._id] = s.count;
      }
    });
    stats.total = Object.values(stats).reduce((acc, curr) => acc + curr, 0) - stats.total;

    // Total actual count
    const actualTotal = await Ticket.countDocuments();
    stats.total = actualTotal;

    res.status(200).json({
      success: true,
      tickets,
      totalCount,
      totalPages: Math.ceil(totalCount / Number(limit)) || 1,
      currentPage: Number(page),
      stats,
    });
  } catch (error) {
    console.error("[Admin Get All Tickets Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tickets for admin",
    });
  }
};

// Admin: Get single ticket details
export const getTicketByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOne(getTicketQuery(id)).populate(
      "user",
      "username email mobileNo profileImage"
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("[Admin Get Ticket Error]:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching ticket",
    });
  }
};

// Admin: Update status and/or priority
export const updateTicketStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const ticket = await Ticket.findOne(getTicketQuery(id));

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;

    await ticket.save();

    // Trigger notification if status was changed
    if (status && ticket.user) {
      const statusLabels = {
        open: "Open",
        in_progress: "In Progress",
        resolved: "Resolved",
        closed: "Closed",
      };
      const label = statusLabels[status] || status;
      createNotification({
        userId: ticket.user,
        type: "ticket",
        title: `Ticket #${ticket.ticketId} ${label}`,
        message: `Your support ticket #${ticket.ticketId} status has been updated to "${label}".`,
        link: "/account/tickets",
        linkText: "View Ticket",
        iconType: "ticket",
        color: status === "resolved" ? "emerald" : status === "closed" ? "slate" : "amber",
        entityId: ticket._id.toString(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      ticket,
    });
  } catch (error) {
    console.error("[Admin Update Ticket Status Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ticket",
    });
  }
};

// Admin: Submit a response / reply to ticket
export const respondTicketAdmin = async (req, res) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const { message, newStatus } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Response message cannot be empty",
      });
    }

    const ticket = await Ticket.findOne(getTicketQuery(id)).populate(
      "user",
      "username email mobileNo profileImage"
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const adminUser = await User.findById(adminId).select("username");

    ticket.responses.push({
      sender: "admin",
      senderName: adminUser?.username || "SwagSync Support",
      senderId: adminId,
      message: message.trim(),
      createdAt: new Date(),
    });

    // Update status if provided, or default to 'in_progress' if currently 'open'
    if (newStatus) {
      ticket.status = newStatus;
    } else if (ticket.status === "open") {
      ticket.status = "in_progress";
    }

    ticket.lastResponseAt = new Date();
    await ticket.save();

    // Trigger notification to customer that admin has replied
    const customerId = ticket.user?._id || ticket.user;
    if (customerId) {
      const previewMsg = message.trim().length > 90
        ? message.trim().slice(0, 90) + "..."
        : message.trim();
      createNotification({
        userId: customerId,
        type: "ticket",
        title: `Reply on Ticket #${ticket.ticketId}`,
        message: `Support team replied: "${previewMsg}"`,
        link: "/account/tickets",
        linkText: "View Reply",
        iconType: "ticket",
        color: "blue",
        entityId: ticket._id.toString(),
      });
    }

    res.status(200).json({
      success: true,
      message: "Response sent to customer successfully",
      ticket,
    });
  } catch (error) {
    console.error("[Admin Respond Ticket Error]:", error);
    res.status(500).json({
      success: false,
      message: "Server error responding to ticket",
    });
  }
};

// Admin: Delete ticket
export const deleteTicketAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findOneAndDelete(getTicketQuery(id));

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Clean up cloudinary image if present
    if (ticket.image?.publicId) {
      try {
        configureCloudinary();
        await cloudinary.uploader.destroy(ticket.image.publicId);
      } catch (cErr) {
        console.warn("Could not delete ticket image from cloudinary:", cErr);
      }
    }

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("[Admin Delete Ticket Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
    });
  }
};
