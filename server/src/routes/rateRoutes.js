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

/**
 * @swagger
 * /rates:
 *   get:
 *     summary: Get all rates
 *     tags: [Rates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Rate'
 */
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

/**
 * @swagger
 * /rates/{id}:
 *   get:
 *     summary: Get rate by ID
 *     tags: [Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rate ID
 *     responses:
 *       200:
 *         description: Rate details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rate'
 *       400:
 *         description: Invalid rate ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Rate not found
 */
// get single rate by ID
router.get("/:id", async (req, res) => {
  try {
    const rateId = parseInt(req.params.id, 10);
    if (isNaN(rateId)) {
      return res.status(400).json({ error: "Invalid rate ID" });
    }

    const rate = await prisma.rate.findUnique({
      where: { id: rateId },
      include: { room: true, deal: true },
    });

    if (!rate) {
      return res.status(404).json({ error: "Rate not found" });
    }

    const availableRooms = await computeAvailability(rate);
    res.json({ ...rate, availableRooms });
  } catch (error) {
    console.error("Error fetching rate:", error);
    res.status(500).json({ error: "Failed to fetch rate" });
  }
});

/**
 * @swagger
 * /rates:
 *   post:
 *     summary: Create a new rate (Admin/Manager only)
 *     tags: [Rates]
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
 *               - rate
 *               - policy
 *             properties:
 *               roomId:
 *                 type: integer
 *                 example: 1
 *               rate:
 *                 type: number
 *                 description: Base rate per night
 *                 example: 100.00
 *               policy:
 *                 type: string
 *                 enum: [STRICT, FLEXIBLE, NON_REFUNDABLE]
 *                 description: Cancellation/refund policy
 *               dealId:
 *                 type: integer
 *                 nullable: true
 *                 description: Optional deal ID to apply discount
 *     responses:
 *       201:
 *         description: Rate created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rate'
 *       400:
 *         description: Validation error or room/deal not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 */
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

/**
 * @swagger
 * /rates/{id}:
 *   put:
 *     summary: Update rate (Admin/Manager only)
 *     tags: [Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rate ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: integer
 *               rate:
 *                 type: number
 *               policy:
 *                 type: string
 *                 enum: [STRICT, FLEXIBLE, NON_REFUNDABLE]
 *               dealId:
 *                 type: integer
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Rate updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Rate'
 *       400:
 *         description: Validation error or room/deal not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 *       404:
 *         description: Rate not found
 */
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

/**
 * @swagger
 * /rates/{id}:
 *   delete:
 *     summary: Delete rate (Admin only)
 *     tags: [Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rate ID
 *     responses:
 *       200:
 *         description: Rate deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Rate not found
 */
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
