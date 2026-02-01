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
  PRESIDENTIAL: 500,
};

// Helper function to get prefix for any room type
function getPrefixForType(type) {
  if (PREFIX_MAP[type]) {
    return PREFIX_MAP[type];
  }
  // For new room types, use a hash-based prefix (500-999 range)
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = ((hash << 5) - hash) + type.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return 500 + (Math.abs(hash) % 500); // Range 500-999
}

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
            !(new Date(b.endDate) < start || new Date(b.startDate) > end),
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
      }),
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
 *     description: "Creates a new room. Room number is automatically generated based on room type (SINGLE: 100+, DOUBLE: 200+, DELUXE: 300+, SUITE: 400+). Image upload is optional."
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
 *                 description: Room type (determines room number prefix). Can be any string (e.g., SINGLE, DOUBLE, DELUXE, SUITE, PRESIDENTIAL)
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
    body("type")
      .notEmpty()
      .withMessage("Room type is required")
      .custom((value) => {
        if (typeof value !== "string" && typeof value !== "undefined") {
          throw new Error("Room type must be a string");
        }
        const trimmed = String(value).trim().toUpperCase();
        if (trimmed.length === 0) {
          throw new Error("Room type cannot be empty");
        }
        if (trimmed.length > 50) {
          throw new Error("Room type must be 50 characters or less");
        }
        if (!/^[A-Z0-9_]+$/.test(trimmed)) {
          throw new Error("Room type must contain only uppercase letters, numbers, and underscores");
        }
        return true;
      }),
    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .custom((value) => {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0) {
          throw new Error("Price must be a valid number greater than or equal to 0");
        }
        return true;
      }),
    body("capacity")
      .notEmpty()
      .withMessage("Capacity is required")
      .custom((value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1 || !Number.isInteger(num)) {
          throw new Error("Capacity must be a positive integer");
        }
        return true;
      }),
    body("floor").optional().isString(),
    body("cleanStatus").optional().isIn(["CLEAN", "DIRTY", "IN_PROGRESS"]),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .custom((value) => {
        if (typeof value !== "string") {
          throw new Error("Description must be a string");
        }
        if (value.trim().length === 0) {
          throw new Error("Description cannot be empty");
        }
        return true;
      }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error("Validation errors:", errors.array());
        const errorMessages = errors.array().map(err => `${err.param}: ${err.msg}`).join(", ");
        return res.status(400).json({ error: errorMessages });
      }

      let { type, price, capacity, cleanStatus, description, floor } =
        req.body;
      
      // Ensure type is uppercase and trimmed (already validated in custom validator)
      type = String(type).trim().toUpperCase();
      price = parseFloat(price);
      capacity = parseInt(capacity, 10);
      description = String(description).trim();
      
      console.log("Creating room with:", { type, price, capacity, cleanStatus, description, floor });

      // Check if this room type already exists
      const existingRoom = await prisma.room.findFirst({
        where: { type },
      });

      // If room type exists, use the existing room's attributes as template for new room
      // If it doesn't exist, this is a new room type creation
      const isNewRoomType = !existingRoom;

      const prefix = getPrefixForType(type);
      let nextRoomNumber;

      // If floor is provided, generate floor-based room numbers (e.g., floor 5 -> 501, 502, etc.)
      if (floor) {
        // Extract floor number from floor string (e.g., "5", "5th Floor", "Floor 5" -> 5)
        const floorMatch = floor.match(/\d+/);
        const floorNum = floorMatch ? parseInt(floorMatch[0], 10) : null;
        
        if (floorNum !== null && floorNum > 0) {
          const floorPrefix = floorNum * 100; // e.g., floor 5 -> 500
          
          // Find all rooms of this type and check their room numbers
          const allRoomsOfType = await prisma.room.findMany({
            where: { type },
            orderBy: { roomNumber: "desc" },
          });

          // Find the highest room number that starts with this floor prefix
          let lastRoomOnFloor = null;
          for (const room of allRoomsOfType) {
            if (/^\d+$/.test(room.roomNumber)) {
              const roomNum = parseInt(room.roomNumber, 10);
              // Check if room number is in the range for this floor (e.g., 500-599 for floor 5)
              if (roomNum >= floorPrefix && roomNum < floorPrefix + 100) {
                lastRoomOnFloor = room;
                break;
              }
            }
          }

          if (lastRoomOnFloor) {
            const lastNum = parseInt(lastRoomOnFloor.roomNumber, 10);
            nextRoomNumber = lastNum + 1;
          } else {
            // No rooms on this floor yet, start from floor prefix + 1 (e.g., floor 5 -> 501)
            nextRoomNumber = floorPrefix + 1;
          }
        } else {
          // Invalid floor format, fall back to type-based prefix
          const lastRoom = await prisma.room.findFirst({
            where: { type },
            orderBy: { roomNumber: "desc" },
          });
          nextRoomNumber =
            lastRoom && /^\d+$/.test(lastRoom.roomNumber)
              ? parseInt(lastRoom.roomNumber, 10) + 1
              : prefix + 1;
        }
      } else {
        // No floor specified, use type-based prefix logic
        const lastRoom = await prisma.room.findFirst({
          where: { type },
          orderBy: { roomNumber: "desc" },
        });
        nextRoomNumber =
          lastRoom && /^\d+$/.test(lastRoom.roomNumber)
            ? parseInt(lastRoom.roomNumber, 10) + 1
            : prefix + 1;
      }

      const imageUrl = req.file ? `/uploads/rooms/${req.file.filename}` : null;

      // For ALMIRA specifically, check for duplicate RoomTypeFeature entries before creating room
      if (type === "ALMIRA" && !isNewRoomType) {
        const almiraFeatures = await prisma.roomTypeFeature.findMany({
          where: { roomType: "ALMIRA" },
        });
        
        // Check for duplicate featureIds
        const featureIdCounts = {};
        almiraFeatures.forEach((rtf) => {
          featureIdCounts[rtf.featureId] = (featureIdCounts[rtf.featureId] || 0) + 1;
        });
        
        const duplicates = Object.entries(featureIdCounts).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
          console.warn(`Found duplicate RoomTypeFeature entries for ALMIRA:`, duplicates);
          // Remove duplicates - keep only the first occurrence of each featureId
          const uniqueFeatureIds = [...new Set(almiraFeatures.map((rtf) => rtf.featureId))];
          const idsToKeep = [];
          for (const featureId of uniqueFeatureIds) {
            const firstEntry = almiraFeatures.find((rtf) => rtf.featureId === featureId);
            if (firstEntry) idsToKeep.push(firstEntry.id);
          }
          
          // Delete all ALMIRA RoomTypeFeature entries
          await prisma.roomTypeFeature.deleteMany({
            where: { roomType: "ALMIRA" },
          });
          
          // Recreate only unique entries
          if (idsToKeep.length > 0) {
            const featuresToKeep = almiraFeatures.filter((rtf) => idsToKeep.includes(rtf.id));
            await prisma.roomTypeFeature.createMany({
              data: featuresToKeep.map((rtf) => ({
                roomType: rtf.roomType,
                featureId: rtf.featureId,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      // Create room first, then handle features separately to avoid constraint issues
      const room = await prisma.room.create({
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

      // Handle features after room is created
      try {
        if (isNewRoomType && req.body.features) {
          // For new room types, create features from the provided list
          const featureNames = String(req.body.features)
            .split(",")
            .map((f) => f.trim().toLowerCase())
            .filter((f) => f.length > 0);

          // Process features: find or create them
          const featureIds = [];
          for (const featureName of featureNames) {
            let feature = await prisma.roomFeature.findFirst({
              where: { name: featureName },
            });
            
            if (!feature) {
              feature = await prisma.roomFeature.create({
                data: { name: featureName },
              });
            }

            featureIds.push(feature.id);
          }

          // Link features to room type (create all at once, skip duplicates)
          if (featureIds.length > 0) {
            const roomTypeFeatureEntries = featureIds.map((featureId) => ({
              roomType: type,
              featureId: featureId,
            }));

            await prisma.roomTypeFeature.createMany({
              data: roomTypeFeatureEntries,
              skipDuplicates: true,
            });

            // Link features to the new room (create all at once, skip duplicates)
            const roomFeatureMapEntries = featureIds.map((featureId) => ({
              roomId: room.id,
              featureId: featureId,
            }));

            await prisma.roomFeatureMap.createMany({
              data: roomFeatureMapEntries,
              skipDuplicates: true,
            });
          }
        } else if (!isNewRoomType) {
          // For existing room types, copy features from RoomTypeFeature to the new room
          const roomTypeFeatures = await prisma.roomTypeFeature.findMany({
            where: { roomType: type },
          });

          if (roomTypeFeatures.length > 0) {
            // Remove duplicate featureIds (in case there are duplicate RoomTypeFeature entries)
            const uniqueFeatureIds = [...new Set(roomTypeFeatures.map((rtf) => rtf.featureId))];
            
            // Check which features already exist for this room to avoid duplicates
            const existingFeatureMaps = await prisma.roomFeatureMap.findMany({
              where: { roomId: room.id },
            });
            const existingFeatureIds = new Set(existingFeatureMaps.map((fm) => fm.featureId));

            // Only create entries for features that don't already exist
            const featureMapEntries = uniqueFeatureIds
              .filter((featureId) => !existingFeatureIds.has(featureId))
              .map((featureId) => ({
                roomId: room.id,
                featureId: featureId,
              }));

            if (featureMapEntries.length > 0) {
              await prisma.roomFeatureMap.createMany({
                data: featureMapEntries,
                skipDuplicates: true,
              });
            }
          }
        }
      } catch (featureError) {
        // If feature creation fails, log but don't fail the room creation
        console.error("Error creating features for room:", featureError);
        console.error("Feature error details:", {
          message: featureError.message,
          code: featureError.code,
          meta: featureError.meta,
          stack: featureError.stack,
        });
      }

      // Return room with features included
      const roomWithFeatures = await prisma.room.findUnique({
        where: { id: room.id },
        include: {
          features: { include: { feature: true } },
        },
      });

      res.status(201).json(roomWithFeatures);
    } catch (err) {
      console.error("Prisma error creating room:", err);
      res.status(500).json({ error: err.message || "Failed to create room" });
    }
  },
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

      const { price, capacity, description, type, cleanStatus, floor, features } =
        req.body;
      
      // Get the room first to know its type
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });
      
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Determine which fields should update all rooms of this type
      const shouldUpdateAllRooms = price || capacity || description || features;
      
      // Build update data
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

      // Use a transaction to update all rooms of the same type atomically
      const result = await prisma.$transaction(async (tx) => {
        if (shouldUpdateAllRooms) {
          // Update ALL rooms of the same type
          await tx.room.updateMany({
            where: { type: room.type },
            data: {
              ...(price && { price: new Prisma.Decimal(price) }),
              ...(capacity && { capacity: parseInt(capacity, 10) }),
              ...(description && { description }),
            },
          });
          
          // If image is provided, update only the specific room's image
          if (req.file) {
            await tx.room.update({
              where: { id: roomId },
              data: { imageUrl: `/uploads/rooms/${req.file.filename}` },
            });
          }
        } else {
          // Update only the specific room if no global fields changed
          await tx.room.update({
            where: { id: roomId },
            data: updateData,
          });
        }

        // Handle features update if provided
        if (features !== undefined && features !== null && features !== "") {
          const featureNames = String(features)
            .split(",")
            .map((f) => f.trim().toLowerCase())
            .filter((f) => f.length > 0);

          // Get all rooms of this type
          const roomsOfType = await tx.room.findMany({
            where: { type: room.type },
          });

          // Delete all room type features for this type ONCE (before the loop)
          await tx.roomTypeFeature.deleteMany({
            where: { roomType: room.type },
          });

          // Delete all room feature maps for all rooms of this type
          const roomIds = roomsOfType.map((r) => r.id);
          await tx.roomFeatureMap.deleteMany({
            where: { roomId: { in: roomIds } },
          });

          // Process and create features ONCE (before the loop)
          const featureIds = [];
          for (const featureName of featureNames) {
            // Find or create the feature
            let feature = await tx.roomFeature.findFirst({
              where: { name: featureName },
            });
            
            if (!feature) {
              feature = await tx.roomFeature.create({
                data: { name: featureName },
              });
            }

            featureIds.push(feature.id);
          }

          // Link features to room type (create all at once, skip duplicates)
          const roomTypeFeatureEntries = featureIds.map((featureId) => ({
            roomType: room.type,
            featureId: featureId,
          }));

          if (roomTypeFeatureEntries.length > 0) {
            await tx.roomTypeFeature.createMany({
              data: roomTypeFeatureEntries,
              skipDuplicates: true,
            });
          }

          // Now link features to each room (this happens per room)
          // Use createMany with skipDuplicates to avoid errors if entries somehow still exist
          const featureMapEntries = [];
          for (const roomToUpdate of roomsOfType) {
            for (const featureId of featureIds) {
              featureMapEntries.push({
                roomId: roomToUpdate.id,
                featureId: featureId,
              });
            }
          }
          
          // Create all feature maps at once, skipping duplicates
          if (featureMapEntries.length > 0) {
            await tx.roomFeatureMap.createMany({
              data: featureMapEntries,
              skipDuplicates: true,
            });
          }
        }

        // Return the updated room
        return await tx.room.findUnique({
          where: { id: roomId },
          include: {
            features: { include: { feature: true } },
          },
        });
      });

      res.json({ message: "Room updated successfully", room: result });
    } catch (err) {
      console.error("Error updating room:", err);
      res.status(500).json({ error: "Failed to update room" });
    }
  },
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
  },
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
  },
);

/**
 * @swagger
 * /rooms/type/{type}:
 *   delete:
 *     summary: Delete entire room type and all its rooms (Admin/Manager only)
 *     description: Deletes all rooms of a specific type, along with their features, bookings, and rates. This is a destructive operation.
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Room type to delete (e.g., PRESIDENTIAL)
 *         example: "PRESIDENTIAL"
 *     responses:
 *       200:
 *         description: Room type deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Room type PRESIDENTIAL and all its rooms deleted successfully"
 *                 deletedRooms:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Cannot delete room type with active bookings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 *       404:
 *         description: Room type not found
 *       500:
 *         description: Server error
 */
// delete entire room type
router.delete(
  "/type/:type",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const roomType = String(req.params.type).trim().toUpperCase();

      // Check if room type exists
      const roomsOfType = await prisma.room.findMany({
        where: { type: roomType },
        include: {
          bookings: {
            where: {
              status: {
                in: ["PENDING", "CONFIRMED"],
              },
            },
          },
        },
      });

      if (roomsOfType.length === 0) {
        return res.status(404).json({
          error: `Room type "${roomType}" not found`,
        });
      }

      // Check for active bookings
      const hasActiveBookings = roomsOfType.some(
        (room) => room.bookings.length > 0,
      );

      if (hasActiveBookings) {
        const activeBookingCount = roomsOfType.reduce(
          (sum, room) => sum + room.bookings.length,
          0,
        );
        return res.status(400).json({
          error: `Cannot delete room type "${roomType}". There are ${activeBookingCount} active booking(s) for rooms of this type. Please cancel or complete these bookings first.`,
        });
      }

      // Get all room IDs for this type
      const roomIds = roomsOfType.map((r) => r.id);

      // Delete in transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Delete room feature maps (cascade should handle this, but being explicit)
        await tx.roomFeatureMap.deleteMany({
          where: { roomId: { in: roomIds } },
        });

        // Delete rates for these rooms
        await tx.rate.deleteMany({
          where: { roomId: { in: roomIds } },
        });

        // Delete rooms (this will cascade delete bookings via foreign key)
        await tx.room.deleteMany({
          where: { type: roomType },
        });

        // Delete room type features
        await tx.roomTypeFeature.deleteMany({
          where: { roomType: roomType },
        });
      });

      res.json({
        message: `Room type "${roomType}" and all its rooms deleted successfully`,
        deletedRooms: roomsOfType.length,
      });
    } catch (err) {
      console.error("Error deleting room type:", err);
      res.status(500).json({
        error: err.message || "Failed to delete room type",
      });
    }
  },
);

export default router;
