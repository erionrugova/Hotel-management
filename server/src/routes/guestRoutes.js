import express from "express";
import moment from "moment-timezone";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);
moment.tz.setDefault("Europe/Belgrade");

/**
 * @swagger
 * /guests:
 *   get:
 *     summary: Get all guests
 *     tags: [Guests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of guests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Guest'
 */
// get all guests
router.get("/", async (req, res) => {
  try {
    const guests = await prisma.guest.findMany({
      include: {
        room: { select: { roomNumber: true, type: true } },
        booking: { include: { deal: true } },
        deal: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = guests.map((g) => ({
      ...g,
      currentStatus: g.booking?.status || g.status,
      finalPrice: g.finalPrice || g.booking?.finalPrice,
      paymentStatus: g.paymentStatus || g.booking?.paymentStatus,
      deal: g.deal || g.booking?.deal || null,
    }));

    res.json(enriched);
  } catch (err) {
    console.error("Error fetching guests:", err);
    res.status(500).json({ error: "Failed to fetch guests" });
  }
});

// Calculate refund based on policy and early check-out
async function calculateRefund(booking, actualEndDate) {
  const originalEndDate = moment.tz(booking.endDate, "Europe/Belgrade").startOf("day");
  const actualEnd = moment.tz(actualEndDate, "Europe/Belgrade").startOf("day");
  const startDate = moment.tz(booking.startDate, "Europe/Belgrade").startOf("day");
  
  // If not early check-out, no refund
  if (actualEnd.isSameOrAfter(originalEndDate, "day")) {
    return { refundAmount: 0, refundable: false, reason: "No early check-out" };
  }

  // Get rate policy for the room
  const rate = await prisma.rate.findFirst({
    where: { roomId: booking.roomId },
    orderBy: { createdAt: "desc" },
  });

  const policy = rate?.policy || "NON_REFUNDABLE";
  const originalPrice = parseFloat(booking.finalPrice || 0);
  const totalNights = originalEndDate.diff(startDate, "days");
  const usedNights = actualEnd.diff(startDate, "days");
  const unusedNights = totalNights - usedNights;
  const pricePerNight = totalNights > 0 ? originalPrice / totalNights : 0;

  let refundAmount = 0;
  let refundable = false;
  let reason = "";

  switch (policy) {
    case "NON_REFUNDABLE":
      refundAmount = 0;
      refundable = false;
      reason = "Non-refundable policy - no refund for early check-out";
      break;
    
    case "FLEXIBLE":
      // Full refund for unused nights
      refundAmount = unusedNights * pricePerNight;
      refundable = true;
      reason = `Flexible policy - full refund for ${unusedNights} unused night(s)`;
      break;
    
    case "STRICT":
      // 50% refund for unused nights (strict policy)
      refundAmount = (unusedNights * pricePerNight) * 0.5;
      refundable = true;
      reason = `Strict policy - 50% refund for ${unusedNights} unused night(s)`;
      break;
    
    default:
      refundAmount = 0;
      refundable = false;
      reason = "Unknown policy - no refund";
  }

  return {
    refundAmount: Math.max(0, Math.round(refundAmount * 100) / 100),
    refundable,
    reason,
    policy,
    unusedNights,
    originalPrice,
    pricePerNight: Math.round(pricePerNight * 100) / 100,
  };
}

// update guest status
router.patch("/:id/status", authorize("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, earlyCheckoutDate } = req.body;

    const guest = await prisma.guest.findUnique({
      where: { id: parseInt(id) },
      include: { 
        booking: { include: { room: true } },
        deal: true,
        room: true,
      },
    });

    if (!guest) {
      return res.status(404).json({ error: "Guest not found" });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    let bookingUpdateData = {};
    let refundInfo = null;

    // Handle early check-out (COMPLETED status)
    if (status === "COMPLETED" && guest.booking) {
      const today = moment.tz("Europe/Belgrade").startOf("day");
      const originalEndDate = moment.tz(guest.booking.endDate, "Europe/Belgrade").startOf("day");
      const actualEndDate = earlyCheckoutDate 
        ? moment.tz(earlyCheckoutDate, "Europe/Belgrade").startOf("day")
        : today;

      // Check if it's early check-out
      if (actualEndDate.isBefore(originalEndDate, "day")) {
        // Calculate refund
        refundInfo = await calculateRefund(guest.booking, actualEndDate.toDate());
        
        // Update booking endDate to actual check-out date
        bookingUpdateData.endDate = actualEndDate.toDate();
        bookingUpdateData.status = "COMPLETED";
        
        // Store refund amount (we'll add this as a note or separate field)
        // For now, we'll include it in the response
      } else {
        // Normal check-out on or after scheduled date
        bookingUpdateData.status = "COMPLETED";
        refundInfo = { refundAmount: 0, refundable: false, reason: "Normal check-out" };
      }
    } else if (status) {
      bookingUpdateData.status = status;
    }

    if (paymentStatus) {
      bookingUpdateData.paymentStatus = paymentStatus;
    }

    const updated = await prisma.guest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { booking: { include: { room: true, deal: true } }, deal: true, room: true },
    });

    let updatedBooking = null;
    if (updated.bookingId && Object.keys(bookingUpdateData).length > 0) {
      updatedBooking = await prisma.booking.update({
        where: { id: updated.bookingId },
        data: bookingUpdateData,
        include: { room: true, deal: true },
      });
    }

    // Refresh guest data with updated booking
    const finalGuest = await prisma.guest.findUnique({
      where: { id: parseInt(id) },
      include: { 
        booking: { include: { room: true, deal: true } }, 
        deal: true, 
        room: true 
      },
    });

    res.json({ 
      message: "Guest + booking updated", 
      guest: finalGuest || updated,
      booking: updatedBooking,
      refund: refundInfo,
    });
  } catch (err) {
    console.error("Error updating guest:", err);
    if (err.code === "P2025")
      return res.status(404).json({ error: "Guest not found" });
    res.status(500).json({ error: "Failed to update guest" });
  }
});

export default router;
