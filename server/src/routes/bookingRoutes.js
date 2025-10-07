import express from "express";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

// ----------------- PUBLIC ROUTES -----------------
router.get("/:id", async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        room: true,
        user: { select: { id: true, username: true } },
        deal: true,
        guests: true,
      },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// ----------------- ADMIN / MANAGER ROUTES -----------------
router.get(
  "/",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const bookings = await prisma.booking.findMany({
        include: {
          room: {
            select: {
              id: true,
              roomNumber: true,
              type: true,
              capacity: true,
              price: true,
            },
          },
          user: { select: { id: true, username: true, role: true } },
          deal: {
            select: { id: true, name: true, discount: true, status: true },
          },
          guests: {
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true,
              paymentStatus: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const cleaned = bookings.map((b) => ({
        ...b,
        guests: Array.isArray(b.guests) ? b.guests : [],
        room: b.room || {
          id: null,
          roomNumber: "—",
          type: "UNKNOWN",
          capacity: 1,
          price: 0,
        },
      }));

      res.json(cleaned);
    } catch (err) {
      console.error("❌ Error fetching bookings:", err);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }
);

// ----------------- CREATE BOOKING -----------------
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      roomId,
      startDate,
      endDate,
      customerFirstName,
      customerLastName,
      customerEmail,
      paymentType,
      dealId,
    } = req.body;

    if (!roomId || !startDate || !endDate)
      return res
        .status(400)
        .json({ error: "roomId, startDate, and endDate are required" });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start)
      return res
        .status(400)
        .json({ error: "End date must be after start date" });

    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId, 10) },
    });
    if (!room) return res.status(404).json({ error: "Room not found" });

    // Overlap check
    const overlap = await prisma.booking.findFirst({
      where: {
        roomId: parseInt(roomId, 10),
        status: { in: ["PENDING", "CONFIRMED"] },
        NOT: [{ endDate: { lt: start } }, { startDate: { gt: end } }],
      },
    });

    if (overlap)
      return res
        .status(400)
        .json({ error: "Room is already booked on these dates" });

    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    let pricePerNight = parseFloat(room.price);

    if (dealId) {
      const appliedDeal = await prisma.deal.findUnique({
        where: { id: parseInt(dealId, 10) },
      });
      if (
        appliedDeal &&
        appliedDeal.status === "ONGOING" &&
        (appliedDeal.roomType === "ALL" || appliedDeal.roomType === room.type)
      ) {
        pricePerNight -= (pricePerNight * appliedDeal.discount) / 100;
      }
    }

    const finalPrice = pricePerNight * nights;

    const newBooking = await prisma.booking.create({
      data: {
        roomId: parseInt(roomId, 10),
        userId: req.user.userId,
        startDate: start,
        endDate: end,
        customerFirstName,
        customerLastName,
        customerEmail,
        paymentType,
        paymentStatus: "PENDING",
        baseRate: room.price,
        finalPrice,
        dealId: dealId ? parseInt(dealId, 10) : null,
        status: "PENDING",
      },
      include: { room: true, deal: true },
    });

    await prisma.guest.create({
      data: {
        fullName: `${customerFirstName} ${customerLastName}`,
        email: customerEmail,
        bookingId: newBooking.id,
        roomId: parseInt(roomId, 10),
        status: "PENDING",
        paymentStatus: "PENDING",
        finalPrice,
        dealId: dealId ? parseInt(dealId, 10) : null,
      },
    });

    res.status(201).json(newBooking);
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// ----------------- PATCH: UPDATE BOOKING -----------------
router.patch(
  "/:id",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const {
        roomId,
        startDate,
        endDate,
        customerFirstName,
        customerLastName,
        customerEmail,
        paymentType,
        status,
      } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const newRoomId = roomId ? parseInt(roomId, 10) : booking.roomId;
      const newStart = startDate ? new Date(startDate) : booking.startDate;
      const newEnd = endDate ? new Date(endDate) : booking.endDate;

      // Optional overlap check only when dates or room change
      const overlap = await prisma.booking.findFirst({
        where: {
          roomId: newRoomId,
          id: { not: bookingId },
          status: { in: ["PENDING", "CONFIRMED"] },
          NOT: [{ endDate: { lt: newStart } }, { startDate: { gt: newEnd } }],
        },
      });

      if (overlap)
        return res
          .status(400)
          .json({ error: "Room is already booked on these dates" });

      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          roomId: newRoomId,
          startDate: newStart,
          endDate: newEnd,
          customerFirstName: customerFirstName ?? booking.customerFirstName,
          customerLastName: customerLastName ?? booking.customerLastName,
          customerEmail: customerEmail ?? booking.customerEmail,
          paymentType: paymentType ?? booking.paymentType,
          status: status ?? booking.status,
        },
        include: { room: true },
      });

      res.json(updated);
    } catch (err) {
      console.error("Error updating booking:", err);
      res.status(500).json({ error: "Failed to update booking" });
    }
  }
);

// ----------------- DELETE BOOKING -----------------
router.delete(
  "/:id",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      await prisma.guest.deleteMany({ where: { bookingId } });
      await prisma.booking.delete({ where: { id: bookingId } });
      res.json({ message: "Booking deleted successfully" });
    } catch (err) {
      console.error("Error deleting booking:", err);
      res.status(500).json({ error: "Failed to delete booking" });
    }
  }
);

export default router;
