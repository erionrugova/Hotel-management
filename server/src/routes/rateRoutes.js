import express from "express";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// Get all rates
router.get("/", async (req, res) => {
  const rates = await prisma.rate.findMany({ include: { room: true } });
  res.json(rates);
});

// Add rate (Admin/Manager)
router.post("/", authorize("ADMIN", "MANAGER"), async (req, res) => {
  const { roomId, policy, rate, dealPrice, availability } = req.body;
  const newRate = await prisma.rate.create({
    data: { roomId, policy, rate, dealPrice, availability },
  });
  res.status(201).json(newRate);
});

// Update rate
router.put("/:id", authorize("ADMIN", "MANAGER"), async (req, res) => {
  const { id } = req.params;
  const updated = await prisma.rate.update({
    where: { id: parseInt(id) },
    data: req.body,
  });
  res.json(updated);
});

// Delete rate
router.delete("/:id", authorize("ADMIN"), async (req, res) => {
  await prisma.rate.delete({ where: { id: parseInt(req.params.id) } });
  res.json({ message: "Rate deleted" });
});

export default router;
