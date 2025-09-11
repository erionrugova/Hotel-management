// server/src/routes/guestRoutes.js
import express from "express";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

// Auth required
router.use(authenticateToken);

// Get all guests (Admins/Managers see all, Users see their guests only)
router.get("/", async (req, res) => {
  try {
    const where = {};
    if (req.user.role === "USER") {
      // Only show guests linked to user's bookings
      where.booking = { userId: req.user.id };
    }

    const guests = await prisma.guest.findMany({
      where,
      include: {
        booking: {
          select: {
            startDate: true,
            endDate: true,
            room: { select: { roomNumber: true, type: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(guests);
  } catch (err) {
    console.error("Failed to fetch guests:", err);
    res.status(500).json({ error: "Failed to fetch guests" });
  }
});

export default router;
