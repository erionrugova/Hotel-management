import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";
import { body, validationResult } from "express-validator";
import { Prisma } from "@prisma/client";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.resolve("uploads/rooms");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `room-${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

async function getActiveBooking(roomId) {
  const today = new Date();
  return await prisma.booking.findFirst({
    where: {
      roomId,
      status: "CONFIRMED",
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });
}

const PREFIX_MAP = {
  SINGLE: 100,
  DOUBLE: 200,
  DELUXE: 300,
  SUITE: 400,
};

// get all rooms
router.get("/", async (req, res) => {
  try {
    const { type, startDate, endDate, guests } = req.query;
    const whereClause = {};

    if (type) whereClause.type = type;
    if (guests) whereClause.capacity = { gte: parseInt(guests, 10) };

    let rooms = await prisma.room.findMany({
      where: whereClause,
      include: {
        features: { include: { feature: true } },
        bookings: true,
      },
      orderBy: { roomNumber: "asc" },
    });

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      rooms = rooms.filter((room) => {
        const hasOverlap = room.bookings.some(
          (b) =>
            b.status === "CONFIRMED" &&
            !(new Date(b.endDate) < start || new Date(b.startDate) > end)
        );
        return !hasOverlap;
      });
    }

    const enriched = await Promise.all(
      rooms.map(async (room) => {
        const activeBooking = await getActiveBooking(room.id);
        return {
          ...room,
          bookingStatus: activeBooking ? "OCCUPIED" : "AVAILABLE",
          bookedCount: room.bookings.filter((b) => b.status === "CONFIRMED")
            .length,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// get single room
router.get("/:id", async (req, res) => {
  try {
    const roomId = parseInt(req.params.id, 10);
    if (isNaN(roomId))
      return res.status(400).json({ error: "Invalid room ID" });

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        features: { include: { feature: true } },
        bookings: true,
      },
    });

    if (!room) return res.status(404).json({ error: "Room not found" });

    const activeBooking = await getActiveBooking(room.id);

    res.json({
      ...room,
      bookingStatus: activeBooking ? "OCCUPIED" : "AVAILABLE",
      bookedCount: room.bookings.filter((b) => b.status === "CONFIRMED").length,
    });
  } catch (err) {
    console.error("Error fetching room:", err);
    res.status(500).json({ error: "Failed to fetch room" });
  }
});

// create Room
router.post(
  "/",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  upload.single("image"),
  [
    body("type").isIn(["SINGLE", "DOUBLE", "DELUXE", "SUITE"]),
    body("price").isNumeric(),
    body("capacity").isInt({ min: 1 }),
    body("floor").optional().isString(),
    body("cleanStatus").optional().isIn(["CLEAN", "DIRTY", "IN_PROGRESS"]),
    body("description").notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { type, price, capacity, cleanStatus, description, floor } =
        req.body;

      const lastRoom = await prisma.room.findFirst({
        where: { type },
        orderBy: { roomNumber: "desc" },
      });

      const prefix = PREFIX_MAP[type] || 999;
      let nextRoomNumber =
        lastRoom && /^\d+$/.test(lastRoom.roomNumber)
          ? parseInt(lastRoom.roomNumber, 10) + 1
          : prefix + 1;

      const imageUrl = req.file ? `/uploads/rooms/${req.file.filename}` : null;

      const newRoom = await prisma.room.create({
        data: {
          roomNumber: String(nextRoomNumber),
          floor: floor || null,
          type,
          price: new Prisma.Decimal(parseFloat(price)),
          capacity: Number(capacity),
          cleanStatus: cleanStatus || "CLEAN",
          description: description.trim(),
          imageUrl,
        },
      });

      res.status(201).json(newRoom);
    } catch (err) {
      console.error("Prisma error creating room:", err);
      res.status(500).json({ error: err.message || "Failed to create room" });
    }
  }
);

// update Room
router.put(
  "/:id",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  upload.single("image"),
  async (req, res) => {
    try {
      const roomId = parseInt(req.params.id, 10);
      if (isNaN(roomId))
        return res.status(400).json({ error: "Invalid room ID" });

      const { price, capacity, description, type, cleanStatus, floor } =
        req.body;
      const updateData = {};

      if (price) updateData.price = new Prisma.Decimal(price);
      if (capacity) updateData.capacity = parseInt(capacity, 10);
      if (description) updateData.description = description;
      if (type) updateData.type = type;
      if (cleanStatus) updateData.cleanStatus = cleanStatus;
      if (floor) updateData.floor = floor;

      if (req.file) {
        updateData.imageUrl = `/uploads/rooms/${req.file.filename}`;
      }

      const updated = await prisma.room.update({
        where: { id: roomId },
        data: updateData,
      });

      res.json({ message: "Room updated successfully", room: updated });
    } catch (err) {
      console.error("Error updating room:", err);
      res.status(500).json({ error: "Failed to update room" });
    }
  }
);

// delete Room
router.delete(
  "/:id",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const roomId = parseInt(req.params.id, 10);
      if (isNaN(roomId))
        return res.status(400).json({ error: "Invalid room ID" });

      const activeBooking = await getActiveBooking(roomId);
      if (activeBooking)
        return res
          .status(400)
          .json({ error: "Cannot delete room with active booking" });

      await prisma.room.delete({ where: { id: roomId } });
      res.json({ message: "Room deleted successfully" });
    } catch (err) {
      console.error("Error deleting room:", err);
      res.status(500).json({ error: "Failed to delete room" });
    }
  }
);

// update cleaning status
router.patch(
  "/:id/clean-status",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const roomId = parseInt(req.params.id, 10);
      const { cleanStatus } = req.body;

      if (!["CLEAN", "DIRTY", "IN_PROGRESS"].includes(cleanStatus)) {
        return res.status(400).json({
          error: "Invalid clean status. Must be CLEAN, DIRTY, or IN_PROGRESS.",
        });
      }

      const updated = await prisma.room.update({
        where: { id: roomId },
        data: { cleanStatus },
      });

      res.json({ message: "Clean status updated successfully", room: updated });
    } catch (err) {
      console.error("Error updating clean status:", err);
      res.status(500).json({ error: "Failed to update clean status" });
    }
  }
);

export default router;
