import express from "express";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

const VALID_STATUSES = ["ONGOING", "INACTIVE", "FULL"];
const VALID_ROOM_TYPES = ["SINGLE", "DOUBLE", "SUITE", "DELUXE", "ALL"];

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
