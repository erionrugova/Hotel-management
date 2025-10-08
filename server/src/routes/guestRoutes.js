import express from "express";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

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

// update guest status
router.patch("/:id/status", authorize("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updated = await prisma.guest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { booking: true, deal: true },
    });

    if (updated.bookingId) {
      await prisma.booking.update({
        where: { id: updated.bookingId },
        data: {
          status: status || updated.booking.status,
          paymentStatus: paymentStatus || updated.booking.paymentStatus,
        },
      });
    }

    res.json({ message: "Guest + booking updated", guest: updated });
  } catch (err) {
    console.error("Error updating guest:", err);
    if (err.code === "P2025")
      return res.status(404).json({ error: "Guest not found" });
    res.status(500).json({ error: "Failed to update guest" });
  }
});

export default router;
