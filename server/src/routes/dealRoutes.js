import express from "express";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

const VALID_STATUSES = ["ONGOING", "INACTIVE", "FULL"];
const VALID_ROOM_TYPES = ["SINGLE", "DOUBLE", "SUITE", "DELUXE", "ALL"];

/**
 * @swagger
 * /deals:
 *   get:
 *     summary: Get all deals
 *     tags: [Deals]
 *     responses:
 *       200:
 *         description: List of deals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Deal'
 */
// get all deals
router.get("/", async (req, res) => {
  try {
    const deals = await prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(deals);
  } catch (error) {
    console.error("Error fetching deals:", error);
    res.status(500).json({ error: "Failed to fetch deals" });
  }
});

/**
 * @swagger
 * /deals/{id}:
 *   get:
 *     summary: Get deal by ID
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Deal ID
 *     responses:
 *       200:
 *         description: Deal details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deal'
 *       404:
 *         description: Deal not found
 */
// get single deal
router.get("/:id", async (req, res) => {
  try {
    const deal = await prisma.deal.findUnique({
      where: { id: parseInt(req.params.id, 10) },
    });

    if (!deal) return res.status(404).json({ error: "Deal not found" });
    res.json(deal);
  } catch (error) {
    console.error("Error fetching deal:", error);
    res.status(500).json({ error: "Failed to fetch deal" });
  }
});

/**
 * @swagger
 * /deals:
 *   post:
 *     summary: Create a new deal (Admin/Manager only)
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - discount
 *               - roomType
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Summer Special"
 *               discount:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Discount percentage
 *                 example: 20
 *               status:
 *                 type: string
 *                 enum: [ONGOING, INACTIVE, FULL]
 *                 default: ONGOING
 *               endDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 example: "2024-12-31"
 *               roomType:
 *                 type: string
 *                 enum: [SINGLE, DOUBLE, SUITE, DELUXE, ALL]
 *                 example: "ALL"
 *     responses:
 *       201:
 *         description: Deal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deal'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 */
// create deal
router.post(
  "/",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      let { name, discount, status, endDate, roomType } = req.body;

      if (!name || !discount || !roomType) {
        return res
          .status(400)
          .json({ error: "Name, discount and roomType are required" });
      }

      discount = parseInt(discount);
      if (isNaN(discount)) {
        return res.status(400).json({ error: "Discount must be a number" });
      }

      if (!VALID_ROOM_TYPES.includes(roomType)) {
        return res.status(400).json({
          error: `roomType must be one of ${VALID_ROOM_TYPES.join(", ")}`,
        });
      }

      if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `status must be one of ${VALID_STATUSES.join(", ")}`,
        });
      }

      const deal = await prisma.deal.create({
        data: {
          name,
          discount,
          status: status || "ONGOING",
          endDate: endDate ? new Date(endDate) : null,
          roomType,
        },
      });

      res.status(201).json(deal);
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({ error: "Failed to create deal" });
    }
  }
);

/**
 * @swagger
 * /deals/{id}:
 *   put:
 *     summary: Update deal (Admin/Manager only)
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Deal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               discount:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               status:
 *                 type: string
 *                 enum: [ONGOING, INACTIVE, FULL]
 *               endDate:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *               roomType:
 *                 type: string
 *                 enum: [SINGLE, DOUBLE, SUITE, DELUXE, ALL]
 *     responses:
 *       200:
 *         description: Deal updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deal'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 *       404:
 *         description: Deal not found
 */
// update deal
router.put(
  "/:id",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      let { name, discount, status, endDate, roomType } = req.body;

      const updateData = {};

      if (name !== undefined) updateData.name = name;

      if (discount !== undefined) {
        discount = parseInt(discount);
        if (isNaN(discount)) {
          return res.status(400).json({ error: "Discount must be a number" });
        }
        updateData.discount = discount;
      }

      if (status !== undefined) {
        if (!VALID_STATUSES.includes(status)) {
          return res.status(400).json({
            error: `status must be one of ${VALID_STATUSES.join(", ")}`,
          });
        }
        updateData.status = status;
      }

      if (endDate !== undefined) {
        updateData.endDate = endDate ? new Date(endDate) : null;
      }

      if (roomType !== undefined) {
        if (!VALID_ROOM_TYPES.includes(roomType)) {
          return res.status(400).json({
            error: `roomType must be one of ${VALID_ROOM_TYPES.join(", ")}`,
          });
        }
        updateData.roomType = roomType;
      }

      const updated = await prisma.deal.update({
        where: { id: parseInt(id, 10) },
        data: updateData,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error updating deal:", error);
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.status(500).json({ error: "Failed to update deal" });
    }
  }
);

/**
 * @swagger
 * /deals/{id}:
 *   delete:
 *     summary: Delete deal (Admin only)
 *     tags: [Deals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Deal ID
 *     responses:
 *       200:
 *         description: Deal deleted successfully
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
 *         description: Deal not found
 */
// delete deal
router.delete(
  "/:id",
  authenticateToken,
  authorize("ADMIN"),
  async (req, res) => {
    try {
      await prisma.deal.delete({ where: { id: parseInt(req.params.id, 10) } });
      res.json({ message: "Deal deleted" });
    } catch (error) {
      console.error("Error deleting deal:", error);
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.status(500).json({ error: "Failed to delete deal" });
    }
  }
);

export default router;
