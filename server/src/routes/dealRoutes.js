import express from "express";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// Get all deals
router.get("/", async (req, res) => {
  const deals = await prisma.deal.findMany();
  res.json(deals);
});

// Create deal
router.post("/", authorize("ADMIN", "MANAGER"), async (req, res) => {
  const { name, discount, status, endDate, roomType } = req.body;
  const deal = await prisma.deal.create({
    data: { name, discount, status, endDate, roomType },
  });
  res.status(201).json(deal);
});

// Update deal
router.put("/:id", authorize("ADMIN", "MANAGER"), async (req, res) => {
  const deal = await prisma.deal.update({
    where: { id: parseInt(req.params.id) },
    data: req.body,
  });
  res.json(deal);
});

// Delete deal
router.delete("/:id", authorize("ADMIN"), async (req, res) => {
  await prisma.deal.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: "Deal deleted" });
});

export default router;
