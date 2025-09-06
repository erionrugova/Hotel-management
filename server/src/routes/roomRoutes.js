// src/routes/roomRoutes.js
import express from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all rooms
router.get("/", async (req, res) => {
  try {
    const { type, status, minPrice, maxPrice } = req.query;

    const where = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { roomNumber: "asc" },
    });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// Get room by ID
router.get("/:id", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

// Create room (Admin/Manager only)
router.post(
  "/",
  authorize("ADMIN", "MANAGER"),
  [
    body("roomNumber").notEmpty().withMessage("Room number is required"),
    body("type")
      .isIn(["SINGLE", "DOUBLE", "SUITE", "DELUXE"])
      .withMessage("Invalid room type"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("status")
      .optional()
      .isIn(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "OUT_OF_ORDER"])
      .withMessage("Invalid room status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { roomNumber, type, price, status = "AVAILABLE" } = req.body;

      const room = await prisma.room.create({
        data: {
          roomNumber,
          type,
          price: parseFloat(price),
          status,
        },
      });

      res.status(201).json({
        message: "Room created successfully",
        room,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({ error: "Room number already exists" });
      }
      res.status(500).json({ error: "Failed to create room" });
    }
  }
);

// Update room (Admin/Manager only)
router.put(
  "/:id",
  authorize("ADMIN", "MANAGER"),
  [
    body("roomNumber")
      .optional()
      .notEmpty()
      .withMessage("Room number cannot be empty"),
    body("type")
      .optional()
      .isIn(["SINGLE", "DOUBLE", "SUITE", "DELUXE"])
      .withMessage("Invalid room type"),
    body("price").optional().isNumeric().withMessage("Price must be a number"),
    body("status")
      .optional()
      .isIn(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "OUT_OF_ORDER"])
      .withMessage("Invalid room status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const roomId = parseInt(req.params.id);
      const { roomNumber, type, price, status } = req.body;

      const updateData = {};
      if (roomNumber) updateData.roomNumber = roomNumber;
      if (type) updateData.type = type;
      if (price) updateData.price = parseFloat(price);
      if (status) updateData.status = status;

      const room = await prisma.room.update({
        where: { id: roomId },
        data: updateData,
      });

      res.json({
        message: "Room updated successfully",
        room,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({ error: "Room number already exists" });
      }
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Room not found" });
      }
      res.status(500).json({ error: "Failed to update room" });
    }
  }
);

// Delete room (Admin only)
router.delete("/:id", authorize("ADMIN"), async (req, res) => {
  try {
    const roomId = parseInt(req.params.id);

    // Check if room has active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        roomId,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (activeBookings) {
      return res.status(400).json({
        error: "Cannot delete room with active bookings",
      });
    }

    await prisma.room.delete({
      where: { id: roomId },
    });

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Room not found" });
    }
    res.status(500).json({ error: "Failed to delete room" });
  }
});

export default router;
