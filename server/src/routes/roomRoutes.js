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

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: Get all rooms with optional filters
 *     description: Retrieves all rooms with optional filtering by type, availability dates, and capacity. Returns booking status and active booking information.
 *     tags: [Rooms]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SINGLE, DOUBLE, DELUXE, SUITE]
 *         description: Filter by room type
 *         example: SINGLE
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter available rooms by check-in date (YYYY-MM-DD)
 *         example: "2025-02-15"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter available rooms by check-out date (YYYY-MM-DD). Must be used with startDate.
 *         example: "2025-02-20"
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter by minimum room capacity
 *         example: 2
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Room'
 *                   - type: object
 *                     properties:
 *                       bookingStatus:
 *                         type: string
 *                         enum: [AVAILABLE, OCCUPIED]
 *                         example: "AVAILABLE"
 *                       bookedCount:
 *                         type: integer
 *                         description: Number of confirmed bookings
 *                         example: 3
 *                       features:
 *                         type: array
 *                         items:
 *                           type: object
 *             examples:
 *               rooms:
 *                 value:
 *                   - id: 1
 *                     roomNumber: "101"
 *                     floor: "1st Floor"
 *                     type: "SINGLE"
 *                     price: "100.00"
 *                     capacity: 2
 *                     description: "Spacious room with ocean view"
 *                     imageUrl: "/uploads/rooms/room-1.jpg"
 *                     cleanStatus: "CLEAN"
 *                     bookingStatus: "AVAILABLE"
 *                     bookedCount: 0
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     description: Retrieves detailed information about a specific room including features, bookings, and current availability status.
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Room details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Room'
 *                 - type: object
 *                   properties:
 *                     bookingStatus:
 *                       type: string
 *                       enum: [AVAILABLE, OCCUPIED]
 *                     bookedCount:
 *                       type: integer
 *                     features:
 *                       type: array
 *                       items:
 *                         type: object
 *             examples:
 *               room:
 *                 value:
 *                   id: 1
 *                   roomNumber: "101"
 *                   floor: "1st Floor"
 *                   type: "SINGLE"
 *                   price: "100.00"
 *                   capacity: 2
 *                   description: "Spacious room with ocean view"
 *                   imageUrl: "/uploads/rooms/room-1.jpg"
 *                   cleanStatus: "CLEAN"
 *                   bookingStatus: "AVAILABLE"
 *                   bookedCount: 0
 *       400:
 *         description: Invalid room ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid room ID"
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Room not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: Create a new room (Admin/Manager only)
 *     description: Creates a new room. Room number is automatically generated based on room type (SINGLE: 100+, DOUBLE: 200+, DELUXE: 300+, SUITE: 400+). Image upload is optional.
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - price
 *               - capacity
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SINGLE, DOUBLE, DELUXE, SUITE]
 *                 description: Room type (determines room number prefix)
 *                 example: "SINGLE"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Price per night
 *                 example: 100.00
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Maximum number of guests
 *                 example: 2
 *               floor:
 *                 type: string
 *                 description: Floor location (optional)
 *                 example: "1st Floor"
 *               cleanStatus:
 *                 type: string
 *                 enum: [CLEAN, DIRTY, IN_PROGRESS]
 *                 default: CLEAN
 *                 description: Initial cleaning status
 *                 example: "CLEAN"
 *               description:
 *                 type: string
 *                 description: Room description
 *                 example: "Spacious room with ocean view"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Room image file (JPG, PNG, AVIF - max 5MB)
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *             examples:
 *               created:
 *                 value:
 *                   id: 1
 *                   roomNumber: "101"
 *                   floor: "1st Floor"
 *                   type: "SINGLE"
 *                   price: "100.00"
 *                   capacity: 2
 *                   description: "Spacious room with ocean view"
 *                   imageUrl: "/uploads/rooms/room-1234567890.jpg"
 *                   cleanStatus: "CLEAN"
 *                   bookingStatus: "AVAILABLE"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Manager role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /rooms/{id}:
 *   put:
 *     summary: Update room (Admin/Manager only)
 *     description: Updates room details. All fields are optional - only provided fields will be updated. Image upload is optional.
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [SINGLE, DOUBLE, DELUXE, SUITE]
 *                 example: "SINGLE"
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 120.00
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               floor:
 *                 type: string
 *                 example: "2nd Floor"
 *               cleanStatus:
 *                 type: string
 *                 enum: [CLEAN, DIRTY, IN_PROGRESS]
 *                 example: "CLEAN"
 *               description:
 *                 type: string
 *                 example: "Updated room description"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New room image file (JPG, PNG, AVIF - max 5MB)
 *     responses:
 *       200:
 *         description: Room updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Room updated successfully"
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid room ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Manager role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /rooms/{id}:
 *   delete:
 *     summary: Delete room (Admin/Manager only)
 *     description: Permanently deletes a room. Cannot delete rooms with active bookings. This action cannot be undone.
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Room deleted successfully"
 *       400:
 *         description: Invalid room ID or room has active booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Cannot delete room with active booking"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Manager role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /rooms/{id}/clean-status:
 *   patch:
 *     summary: Update room cleaning status (Admin/Manager only)
 *     description: Updates only the cleaning status of a room. Used by housekeeping to track room cleaning progress.
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cleanStatus
 *             properties:
 *               cleanStatus:
 *                 type: string
 *                 enum: [CLEAN, DIRTY, IN_PROGRESS]
 *                 description: New cleaning status
 *                 example: "CLEAN"
 *           examples:
 *             clean:
 *               value:
 *                 cleanStatus: "CLEAN"
 *             dirty:
 *               value:
 *                 cleanStatus: "DIRTY"
 *             inProgress:
 *               value:
 *                 cleanStatus: "IN_PROGRESS"
 *     responses:
 *       200:
 *         description: Clean status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Clean status updated successfully"
 *                 room:
 *                   $ref: '#/components/schemas/Room'
 *       400:
 *         description: Invalid cleanStatus value
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Manager role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid clean status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 *       404:
 *         description: Room not found
 */
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
