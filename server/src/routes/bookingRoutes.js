// src/routes/bookingRoutes.js
import express from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all bookings
router.get("/", async (req, res) => {
  try {
    const { status, userId, roomId, startDate, endDate } = req.query;

    const where = {};

    if (req.user.role === "USER") {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = parseInt(userId);
    }

    if (status) where.status = status;
    if (roomId) where.roomId = parseInt(roomId);

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, username: true, role: true } },
        room: {
          select: {
            id: true,
            roomNumber: true,
            type: true,
            price: true,
            status: true,
          },
        },
        guests: true, // 👈 include guests
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Get booking by ID
router.get("/:id", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, username: true, role: true } },
        room: {
          select: {
            id: true,
            roomNumber: true,
            type: true,
            price: true,
            status: true,
          },
        },
        guests: true, // 👈 include guests
      },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (req.user.role === "USER" && booking.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// Create booking
router.post(
  "/",
  [
    body("roomId").isInt().withMessage("Room ID must be a number"),
    body("startDate")
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    body("endDate").isISO8601().withMessage("End date must be a valid date"),
    body("customerFirstName").notEmpty().withMessage("First name is required"),
    body("customerLastName").notEmpty().withMessage("Last name is required"),
    body("customerEmail").isEmail().withMessage("Valid email is required"),
    body("paymentType")
      .isIn(["CARD", "CASH", "PAYPAL"])
      .withMessage("Invalid payment type"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const {
        roomId,
        startDate,
        endDate,
        customerFirstName,
        customerLastName,
        customerEmail,
        paymentType,
      } = req.body;
      const userId = req.user.id;

      const start = new Date(startDate);
      const end = new Date(endDate);
      const now = new Date();

      if (start <= now)
        return res
          .status(400)
          .json({ error: "Start date must be in the future" });
      if (end <= start)
        return res
          .status(400)
          .json({ error: "End date must be after start date" });

      const room = await prisma.room.findUnique({
        where: { id: parseInt(roomId) },
      });
      if (!room) return res.status(404).json({ error: "Room not found" });
      if (room.status !== "AVAILABLE")
        return res.status(400).json({ error: "Room is not available" });

      const overlappingBooking = await prisma.booking.findFirst({
        where: {
          roomId: parseInt(roomId),
          status: { in: ["PENDING", "CONFIRMED"] },
          OR: [
            {
              AND: [{ startDate: { lte: start } }, { endDate: { gt: start } }],
            },
            { AND: [{ startDate: { lt: end } }, { endDate: { gte: end } }] },
            { AND: [{ startDate: { gte: start } }, { endDate: { lte: end } }] },
          ],
        },
      });
      if (overlappingBooking) {
        return res
          .status(400)
          .json({ error: "Room is already booked for this period" });
      }

      const booking = await prisma.booking.create({
        data: {
          userId,
          roomId: parseInt(roomId),
          startDate: start,
          endDate: end,
          status: "PENDING",
          customerFirstName,
          customerLastName,
          customerEmail,
          paymentType,
        },
        include: {
          user: { select: { id: true, username: true, role: true } },
          room: {
            select: {
              id: true,
              roomNumber: true,
              type: true,
              price: true,
              status: true,
            },
          },
        },
      });

      // 👇 NEW: Create or update Guest
      await prisma.guest.upsert({
        where: { bookingId: booking.id },
        update: {
          fullName: `${customerFirstName} ${customerLastName}`,
          email: customerEmail,
          roomId: booking.roomId,
          status: "Reserved",
        },
        create: {
          fullName: `${customerFirstName} ${customerLastName}`,
          email: customerEmail,
          roomId: booking.roomId,
          bookingId: booking.id,
          status: "Reserved",
        },
      });

      res
        .status(201)
        .json({ message: "Booking created successfully", booking });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  }
);

// Update booking status
router.patch(
  "/:id/status",
  authorize("ADMIN", "MANAGER"),
  [
    body("status")
      .isIn(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"])
      .withMessage("Invalid status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const bookingId = parseInt(req.params.id);
      const { status } = req.body;

      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status },
        include: {
          user: { select: { id: true, username: true, role: true } },
          room: {
            select: {
              id: true,
              roomNumber: true,
              type: true,
              price: true,
              status: true,
            },
          },
        },
      });

      if (status === "CONFIRMED") {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: "OCCUPIED" },
        });
      } else if (status === "CANCELLED" || status === "COMPLETED") {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: "AVAILABLE" },
        });
      }

      res.json({ message: "Booking status updated successfully", booking });
    } catch (error) {
      if (error.code === "P2025")
        return res.status(404).json({ error: "Booking not found" });
      res.status(500).json({ error: "Failed to update booking status" });
    }
  }
);

// Cancel booking
router.patch("/:id/cancel", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (req.user.role === "USER" && booking.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (booking.status === "CANCELLED")
      return res.status(400).json({ error: "Booking is already cancelled" });
    if (booking.status === "COMPLETED")
      return res.status(400).json({ error: "Cannot cancel completed booking" });

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
      include: {
        user: { select: { id: true, username: true, role: true } },
        room: {
          select: {
            id: true,
            roomNumber: true,
            type: true,
            price: true,
            status: true,
          },
        },
      },
    });

    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "AVAILABLE" },
    });

    res.json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel booking" });
  }
});

// Delete booking
router.delete("/:id", authorize("ADMIN"), async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    await prisma.booking.delete({ where: { id: bookingId } });
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ error: "Booking not found" });
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

// Guests endpoint
router.get("/guests", async (req, res) => {
  try {
    const guests = await prisma.guest.findMany({
      include: {
        room: { select: { id: true, roomNumber: true, type: true } },
        booking: {
          select: {
            startDate: true,
            endDate: true,
            paymentType: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = guests.map((g) => ({
      id: g.id,
      name: g.fullName,
      email: g.email || "-",
      room: g.room?.roomNumber,
      status: g.booking?.status,
      checkIn: g.booking?.startDate,
      checkOut: g.booking?.endDate,
      payment: g.booking?.paymentType || "N/A",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching guests:", err);
    res.status(500).json({ error: "Failed to fetch guests" });
  }
});

export default router;
