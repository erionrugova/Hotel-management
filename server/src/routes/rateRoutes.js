import express from "express";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";
import { body, validationResult } from "express-validator";

const router = express.Router();
router.use(authenticateToken);

async function computeAvailability(rate) {
  const activeBookings = await prisma.booking.count({
    where: {
      roomId: rate.roomId,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  const totalRooms = await prisma.room.count({
    where: { id: rate.roomId },
  });

  return Math.max(totalRooms - activeBookings, 0);
}

// get all rates
router.get("/", async (req, res) => {
  try {
    const rates = await prisma.rate.findMany({
      include: { room: true, deal: true },
      orderBy: { createdAt: "desc" },
    });

    const withAvailability = await Promise.all(
      rates.map(async (r) => ({
        ...r,
        availableRooms: await computeAvailability(r),
      }))
    );

    res.json(withAvailability);
  } catch (error) {
    console.error("Error fetching rates:", error);
    res.status(500).json({ error: "Failed to fetch rates" });
  }
});

// create rate
router.post(
  "/",
  authorize("ADMIN", "MANAGER"),
  [
    body("roomId").isInt().withMessage("roomId must be an integer"),
    body("rate").isNumeric().withMessage("rate must be numeric"),
    body("policy")
      .isIn(["STRICT", "FLEXIBLE", "NON_REFUNDABLE"])
      .withMessage("Invalid policy"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { roomId, policy, rate, dealId } = req.body;

      const room = await prisma.room.findUnique({
        where: { id: parseInt(roomId, 10) },
      });
      if (!room) {
        return res
          .status(400)
          .json({ error: `Room with ID ${roomId} not found.` });
      }

      let dealPrice = null;
      if (dealId) {
        const deal = await prisma.deal.findUnique({
          where: { id: parseInt(dealId, 10) },
        });

        if (deal && deal.status === "ONGOING") {
          if (deal.roomType === "ALL" || deal.roomType === room.type) {
            const baseRate = parseFloat(rate);
            dealPrice = baseRate - (baseRate * deal.discount) / 100;
          } else {
            return res.status(400).json({
              error: `Deal "${deal.name}" does not apply to ${room.type} rooms.`,
            });
          }
        }
      }

      const newRate = await prisma.rate.create({
        data: {
          roomId: parseInt(roomId, 10),
          policy: policy.toUpperCase(),
          rate: parseFloat(rate),
          dealId: dealId ? parseInt(dealId, 10) : null,
          dealPrice,
        },
        include: { room: true, deal: true },
      });

      const availableRooms = await computeAvailability(newRate);
      res.status(201).json({ ...newRate, availableRooms });
    } catch (error) {
      console.error("Error creating rate:", error);
      res.status(500).json({ error: "Failed to create rate" });
    }
  }
);

// update rate
router.put(
  "/:id",
  authorize("ADMIN", "MANAGER"),
  [
    body("policy")
      .optional()
      .isIn(["STRICT", "FLEXIBLE", "NON_REFUNDABLE"])
      .withMessage("Invalid policy"),
    body("rate").optional().isNumeric().withMessage("rate must be numeric"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { roomId, policy, rate, dealId } = req.body;

      const updateData = {};
      let room;

      if (roomId !== undefined) {
        room = await prisma.room.findUnique({
          where: { id: parseInt(roomId, 10) },
        });
        if (!room) {
          return res
            .status(400)
            .json({ error: `Room with ID ${roomId} not found.` });
        }
        updateData.roomId = parseInt(roomId, 10);
      }

      if (policy !== undefined) updateData.policy = policy.toUpperCase();
      if (rate !== undefined) updateData.rate = parseFloat(rate);

      if (dealId !== undefined) {
        updateData.dealId = dealId ? parseInt(dealId, 10) : null;

        if (dealId) {
          const deal = await prisma.deal.findUnique({
            where: { id: parseInt(dealId, 10) },
          });

          if (deal && deal.status === "ONGOING") {
            if (!room) {
              const existing = await prisma.rate.findUnique({
                where: { id: parseInt(id, 10) },
                include: { room: true },
              });
              room = existing?.room;
            }

            if (
              room &&
              (deal.roomType === "ALL" || deal.roomType === room.type)
            ) {
              const baseRate =
                updateData.rate ??
                (
                  await prisma.rate.findUnique({
                    where: { id: parseInt(id, 10) },
                  })
                ).rate;

              updateData.dealPrice =
                baseRate - (baseRate * deal.discount) / 100;
            } else {
              return res.status(400).json({
                error: `Deal "${deal.name}" does not apply to ${
                  room?.type || "this"
                } room.`,
              });
            }
          }
        } else {
          updateData.dealPrice = null;
        }
      }

      const updated = await prisma.rate.update({
        where: { id: parseInt(id, 10) },
        data: updateData,
        include: { room: true, deal: true },
      });

      const availableRooms = await computeAvailability(updated);
      res.json({ ...updated, availableRooms });
    } catch (error) {
      console.error("Error updating rate:", error);
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.status(500).json({ error: "Failed to update rate" });
    }
  }
);

// delete rate
router.delete("/:id", authorize("ADMIN"), async (req, res) => {
  try {
    await prisma.rate.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.json({ message: "Rate deleted" });
  } catch (error) {
    console.error("Error deleting rate:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Rate not found" });
    }
    res.status(500).json({ error: "Failed to delete rate" });
  }
});

export default router;
