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

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     description: Retrieves a single booking by ID with all related information (room, user, deal, guests).
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Booking'
 *                 - type: object
 *                   properties:
 *                     room:
 *                       $ref: '#/components/schemas/Room'
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: integer }
 *                         username: { type: string }
 *                     deal:
 *                       $ref: '#/components/schemas/Deal'
 *                     guests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Guest'
 *       404:
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Booking not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (Admin/Manager only)
 *     description: Retrieves all bookings with related room, user, deal, and guest information. Returns bookings ordered by start date (newest first).
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Booking'
 *                   - type: object
 *                     properties:
 *                       room:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           roomNumber: { type: string }
 *                           type: { type: string }
 *                           capacity: { type: integer }
 *                           price: { type: string }
 *                       user:
 *                         type: object
 *                         properties:
 *                           id: { type: integer }
 *                           username: { type: string }
 *                           role: { type: string }
 *                       deal:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id: { type: integer }
 *                           name: { type: string }
 *                           discount: { type: integer }
 *                           status: { type: string }
 *                       guests:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id: { type: integer }
 *                             fullName: { type: string }
 *                             email: { type: string }
 *                             status: { type: string }
 *                             paymentStatus: { type: string }
 *             examples:
 *               bookings:
 *                 value:
 *                   - id: 1
 *                     roomId: 1
 *                     userId: 1
 *                     startDate: "2025-02-15T14:00:00.000Z"
 *                     endDate: "2025-02-20T11:00:00.000Z"
 *                     status: "CONFIRMED"
 *                     customerFirstName: "John"
 *                     customerLastName: "Doe"
 *                     customerEmail: "john.doe@example.com"
 *                     paymentType: "CARD"
 *                     paymentStatus: "PENDING"
 *                     baseRate: "100.00"
 *                     finalPrice: "500.00"
 *                     dealId: null
 *                     room:
 *                       id: 1
 *                       roomNumber: "101"
 *                       type: "SINGLE"
 *                       capacity: 2
 *                       price: "100.00"
 *                     user:
 *                       id: 1
 *                       username: "admin"
 *                       role: "ADMIN"
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
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

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Creates a booking for the specified room type. The system automatically assigns an available room of the same type if the requested room is occupied. Bookings are automatically confirmed.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - startDate
 *               - endDate
 *             properties:
 *               roomId:
 *                 type: integer
 *                 description: Preferred room ID (system will assign available room of same type if this one is occupied)
 *                 example: 1
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Check-in date and time (ISO 8601 format)
 *                 example: "2025-02-15T14:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Check-out date and time (must be after startDate)
 *                 example: "2025-02-20T11:00:00Z"
 *               customerFirstName:
 *                 type: string
 *                 description: Customer's first name
 *                 example: "John"
 *               customerLastName:
 *                 type: string
 *                 description: Customer's last name
 *                 example: "Doe"
 *               customerEmail:
 *                 type: string
 *                 format: email
 *                 description: Customer's email address
 *                 example: "john.doe@example.com"
 *               paymentType:
 *                 type: string
 *                 enum: [CARD, CASH, PAYPAL]
 *                 description: Payment method
 *                 example: "CARD"
 *               dealId:
 *                 type: integer
 *                 nullable: true
 *                 description: Optional deal ID to apply discount. Must exist and be ONGOING status.
 *                 example: null
 *           examples:
 *             basic:
 *               summary: Basic booking
 *               value:
 *                 roomId: 1
 *                 startDate: "2025-02-15T14:00:00Z"
 *                 endDate: "2025-02-20T11:00:00Z"
 *                 customerFirstName: "John"
 *                 customerLastName: "Doe"
 *                 customerEmail: "john.doe@example.com"
 *                 paymentType: "CARD"
 *             withDeal:
 *               summary: Booking with deal
 *               value:
 *                 roomId: 1
 *                 startDate: "2025-02-15T14:00:00Z"
 *                 endDate: "2025-02-20T11:00:00Z"
 *                 customerFirstName: "Jane"
 *                 customerLastName: "Smith"
 *                 customerEmail: "jane.smith@example.com"
 *                 paymentType: "PAYPAL"
 *                 dealId: 1
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking created successfully for room 101"
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *             examples:
 *               success:
 *                 value:
 *                   message: "Booking created successfully for room 101"
 *                   booking:
 *                     id: 1
 *                     roomId: 1
 *                     userId: 1
 *                     startDate: "2025-02-15T14:00:00.000Z"
 *                     endDate: "2025-02-20T11:00:00.000Z"
 *                     status: "CONFIRMED"
 *                     customerFirstName: "John"
 *                     customerLastName: "Doe"
 *                     customerEmail: "john.doe@example.com"
 *                     paymentType: "CARD"
 *                     paymentStatus: "PENDING"
 *                     baseRate: "100.00"
 *                     finalPrice: "500.00"
 *                     dealId: null
 *       400:
 *         description: Validation error, dates conflict, or all rooms booked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               validation:
 *                 value:
 *                   error: "roomId, startDate, and endDate are required"
 *               dateError:
 *                 value:
 *                   error: "End date must be after start date"
 *               allBooked:
 *                 value:
 *                   error: "All SINGLE rooms are booked for these dates."
 *                   nextAvailable: "Next available from 2025-02-25"
 *               invalidDeal:
 *                 value:
 *                   error: "Deal \"Summer Special\" is not active (status: INACTIVE)"
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Room or Deal not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               roomNotFound:
 *                 value:
 *                   error: "Room not found"
 *               dealNotFound:
 *                 value:
 *                   error: "Deal with ID 999 not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

    // Validate dealId if provided
    let validatedDealId = null;
    if (dealId) {
      const parsedDealId = parseInt(dealId, 10);
      if (isNaN(parsedDealId)) {
        return res.status(400).json({ error: "Invalid dealId format" });
      }

      const appliedDeal = await prisma.deal.findUnique({
        where: { id: parsedDealId },
      });

      if (!appliedDeal) {
        return res
          .status(404)
          .json({ error: `Deal with ID ${parsedDealId} not found` });
      }

      // Only use deal if it's ONGOING and applies to this room type
      if (
        appliedDeal.status === "ONGOING" &&
        (appliedDeal.roomType === "ALL" ||
          appliedDeal.roomType === availableRoom.type)
      ) {
        validatedDealId = parsedDealId;
      } else if (appliedDeal.status !== "ONGOING") {
        return res.status(400).json({
          error: `Deal "${appliedDeal.name}" is not active (status: ${appliedDeal.status})`,
        });
      } else {
        return res.status(400).json({
          error: `Deal "${appliedDeal.name}" does not apply to ${availableRoom.type} rooms`,
        });
      }
    }

    // price calculation
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    let pricePerNight = parseFloat(availableRoom.price);

    if (validatedDealId) {
      const appliedDeal = await prisma.deal.findUnique({
        where: { id: validatedDealId },
      });
      if (appliedDeal) {
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
        dealId: validatedDealId,
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

/**
 * @swagger
 * /bookings/{id}:
 *   patch:
 *     summary: Update booking (Admin/Manager only)
 *     description: Updates booking details. Price is automatically recalculated if dates, room, or deal changes. All fields are optional - only provided fields will be updated.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: integer
 *                 description: New room ID (must be available for the dates)
 *                 example: 2
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: New check-in date
 *                 example: "2025-02-16T14:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: New check-out date
 *                 example: "2025-02-21T11:00:00Z"
 *               customerFirstName:
 *                 type: string
 *                 example: "John"
 *               customerLastName:
 *                 type: string
 *                 example: "Doe"
 *               customerEmail:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               paymentType:
 *                 type: string
 *                 enum: [CARD, CASH, PAYPAL]
 *                 example: "CARD"
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED, COMPLETED]
 *                 example: "CONFIRMED"
 *               dealId:
 *                 type: integer
 *                 nullable: true
 *                 description: Deal ID (must exist and be ONGOING)
 *                 example: null
 *           examples:
 *             updateDates:
 *               summary: Update dates only
 *               value:
 *                 startDate: "2025-02-16T14:00:00Z"
 *                 endDate: "2025-02-21T11:00:00Z"
 *             updateStatus:
 *               summary: Update status only
 *               value:
 *                 status: "COMPLETED"
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Validation error or room already booked on these dates
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               dateConflict:
 *                 value:
 *                   error: "Room is already booked on these dates"
 *               invalidDeal:
 *                 value:
 *                   error: "Deal \"Summer Special\" does not apply to SINGLE rooms"
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
 *         description: Booking or room not found
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
      const roomForPrice =
        newRoomId !== booking.roomId
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
      const datesChanged =
        newStart.getTime() !== booking.startDate.getTime() ||
        newEnd.getTime() !== booking.endDate.getTime();
      const roomChanged = newRoomId !== booking.roomId;
      const dealChanged =
        dealId !== undefined &&
        (dealId ? parseInt(dealId, 10) : null) !== booking.dealId;

      let finalPrice = booking.finalPrice;
      let newDealId = booking.dealId;

      if (datesChanged || roomChanged || dealChanged) {
        // Calculate nights
        const nights = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24));
        let pricePerNight = parseFloat(roomForPrice.price);

        // Apply deal if provided
        newDealId =
          dealId !== undefined
            ? dealId
              ? parseInt(dealId, 10)
              : null
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

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete booking (Admin/Manager only)
 *     description: Permanently deletes a booking and its associated guest records. This action cannot be undone.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Booking deleted successfully"
 *       401:
 *         description: Unauthorized - Missing or invalid JWT token
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
 *         description: Booking not found
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
