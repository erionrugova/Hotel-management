import express from "express";
import moment from "moment-timezone";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();
moment.tz.setDefault("Europe/Belgrade");

function localizeBookingDates(bookings) {
  return bookings.map((b) => ({
    ...b,
    startDate: b.startDate
      ? moment.tz(b.startDate, "Europe/Belgrade").format()
      : null,
    endDate: b.endDate
      ? moment.tz(b.endDate, "Europe/Belgrade").format()
      : null,
    createdAt: b.createdAt
      ? moment.tz(b.createdAt, "Europe/Belgrade").format()
      : null,
    updatedAt: b.updatedAt
      ? moment.tz(b.updatedAt, "Europe/Belgrade").format()
      : null,
  }));
}

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

    res.json(localizeBookingDates([booking])[0]);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

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
        orderBy: { startDate: "desc" },
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

      res.json(localizeBookingDates(cleaned));
    } catch (err) {
      console.error("Error fetching bookings:", err);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  }
);

// create booking
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

    // find requested room to identify type
    const requestedRoom = await prisma.room.findUnique({
      where: { id: parseInt(roomId, 10) },
    });
    if (!requestedRoom)
      return res.status(404).json({ error: "Room not found" });

    const { type } = requestedRoom;

    // find all rooms of same type
    const allRoomsOfType = await prisma.room.findMany({
      where: { type },
      include: {
        bookings: {
          where: { status: { in: ["PENDING", "CONFIRMED"] } },
        },
      },
      orderBy: { roomNumber: "asc" },
    });

    // Normalize dates to start of day for accurate comparison
    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    
    const normalizedStart = normalizeDate(start);
    const normalizedEnd = normalizeDate(end);

    // find first available room
    let availableRoom = null;
    for (const room of allRoomsOfType) {
      const isOccupied = room.bookings.some((b) => {
        const bStart = normalizeDate(b.startDate);
        const bEnd = normalizeDate(b.endDate);
        // Check for overlap: bookings overlap if dates conflict
        // A room is occupied if:
        // - Existing booking ends AFTER new booking starts (bEnd > normalizedStart)
        // AND
        // - Existing booking starts BEFORE new booking ends (bStart < normalizedEnd)
        // This allows same-day transitions: check-out on day X, check-in on day X is allowed
        // Example: Existing Jan 1-5, New Jan 5-10: bEnd(Jan5) > normalizedStart(Jan5) = false, so no overlap ✓
        // Example: Existing Jan 1-5, New Jan 4-10: bEnd(Jan5) > normalizedStart(Jan4) = true AND bStart(Jan1) < normalizedEnd(Jan10) = true, so overlap ✗
        return bEnd > normalizedStart && bStart < normalizedEnd;
      });
      if (!isOccupied) {
        availableRoom = room;
        break;
      }
    }

    // if no rooms free, then find next available date
    if (!availableRoom) {
      const nextAvailableBooking = await prisma.booking.findFirst({
        where: {
          room: { type },
          status: { in: ["CONFIRMED", "PENDING"] },
          endDate: { gt: end },
        },
        orderBy: { endDate: "asc" },
      });

      const nextAvailableDate = nextAvailableBooking
        ? new Date(nextAvailableBooking.endDate).toISOString().split("T")[0]
        : null;

      return res.status(400).json({
        error: `All ${type} rooms are booked for these dates.`,
        nextAvailable: nextAvailableDate
          ? `Next available from ${nextAvailableDate}`
          : "No availability soon.",
      });
    }

    // price calculation
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    let pricePerNight = parseFloat(availableRoom.price);

    if (dealId) {
      const appliedDeal = await prisma.deal.findUnique({
        where: { id: parseInt(dealId, 10) },
      });
      if (
        appliedDeal &&
        appliedDeal.status === "ONGOING" &&
        (appliedDeal.roomType === "ALL" ||
          appliedDeal.roomType === availableRoom.type)
      ) {
        pricePerNight -= (pricePerNight * appliedDeal.discount) / 100;
      }
    }

    const finalPrice = pricePerNight * nights;

    // create booking with first available room
    // Bookings are automatically CONFIRMED to immediately reflect in availability
    const newBooking = await prisma.booking.create({
      data: {
        roomId: availableRoom.id,
        userId: req.user.userId,
        startDate: start,
        endDate: end,
        customerFirstName,
        customerLastName,
        customerEmail,
        paymentType,
        paymentStatus: "PENDING",
        baseRate: availableRoom.price,
        finalPrice,
        dealId: dealId ? parseInt(dealId, 10) : null,
        status: "CONFIRMED", // Auto-confirm bookings so they immediately affect availability
      },
      include: { room: true, deal: true },
    });

    // create linked guest record
    await prisma.guest.create({
      data: {
        fullName: `${customerFirstName} ${customerLastName}`,
        email: customerEmail,
        bookingId: newBooking.id,
        roomId: availableRoom.id,
        status: "CONFIRMED", // Auto-confirm guest status to match booking
        paymentStatus: "PENDING",
        finalPrice,
        dealId: dealId ? parseInt(dealId, 10) : null,
      },
    });

    res.status(201).json({
      message: `Booking created successfully for room ${availableRoom.roomNumber}`,
      booking: localizeBookingDates([newBooking])[0],
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// booking update
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
        dealId,
      } = req.body;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { room: true },
      });
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const newRoomId = roomId ? parseInt(roomId, 10) : booking.roomId;
      const newStart = startDate ? new Date(startDate) : booking.startDate;
      const newEnd = endDate ? new Date(endDate) : booking.endDate;
      
      // Get the room for price calculation (use new room if changed, otherwise existing)
      const roomForPrice = newRoomId !== booking.roomId
        ? await prisma.room.findUnique({ where: { id: newRoomId } })
        : booking.room;
      
      if (!roomForPrice) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Normalize dates to start of day for accurate comparison
      const normalizeDate = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
      };
      
      const normalizedNewStart = normalizeDate(newStart);
      const normalizedNewEnd = normalizeDate(newEnd);

      // overlap check - find bookings that overlap with the new dates
      const overlappingBookings = await prisma.booking.findMany({
        where: {
          roomId: newRoomId,
          id: { not: bookingId },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      // Check for actual date overlap
      // Same logic as create: allow same-day transitions (check-out on day X, check-in on day X)
      const overlap = overlappingBookings.some((b) => {
        const bStart = normalizeDate(b.startDate);
        const bEnd = normalizeDate(b.endDate);
        // Overlap exists if: bEnd > normalizedNewStart AND bStart < normalizedNewEnd
        return bEnd > normalizedNewStart && bStart < normalizedNewEnd;
      });

      if (overlap)
        return res
          .status(400)
          .json({ error: "Room is already booked on these dates" });

      // Recalculate price if dates, room, or deal changed
      const datesChanged = newStart.getTime() !== booking.startDate.getTime() || 
                          newEnd.getTime() !== booking.endDate.getTime();
      const roomChanged = newRoomId !== booking.roomId;
      const dealChanged = dealId !== undefined && 
                         (dealId ? parseInt(dealId, 10) : null) !== booking.dealId;
      
      let finalPrice = booking.finalPrice;
      let newDealId = booking.dealId;
      
      if (datesChanged || roomChanged || dealChanged) {
        // Calculate nights
        const nights = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24));
        let pricePerNight = parseFloat(roomForPrice.price);
        
        // Apply deal if provided
        newDealId = dealId !== undefined 
          ? (dealId ? parseInt(dealId, 10) : null)
          : booking.dealId;
          
        if (newDealId) {
          const appliedDeal = await prisma.deal.findUnique({
            where: { id: newDealId },
          });
          if (
            appliedDeal &&
            appliedDeal.status === "ONGOING" &&
            (appliedDeal.roomType === "ALL" ||
              appliedDeal.roomType === roomForPrice.type)
          ) {
            pricePerNight -= (pricePerNight * appliedDeal.discount) / 100;
          }
        }
        
        finalPrice = pricePerNight * nights;
      }

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
          dealId: newDealId,
          finalPrice: finalPrice,
        },
        include: { room: true, deal: true },
      });

      // Update associated guest record if it exists
      const guest = await prisma.guest.findUnique({
        where: { bookingId: bookingId },
      });
      
      if (guest) {
        await prisma.guest.update({
          where: { id: guest.id },
          data: {
            dealId: newDealId,
            finalPrice: finalPrice,
            roomId: newRoomId,
          },
        });
      }

      res.json(localizeBookingDates([updated])[0]);
    } catch (err) {
      console.error("Error updating booking:", err);
      res.status(500).json({ error: "Failed to update booking" });
    }
  }
);

// delete booking
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
