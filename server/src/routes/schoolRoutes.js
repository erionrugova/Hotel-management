import express from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

const validateSchool = [
  body("emri")
    .trim()
    .notEmpty()
    .withMessage("Emri i shkollës është i detyrueshëm")
    .isLength({ min: 2, max: 191 })
    .withMessage("Emri i shkollës duhet të ketë 2-191 karaktere"),
  body("qyteti")
    .trim()
    .notEmpty()
    .withMessage("Qyteti është i detyrueshëm")
    .isLength({ min: 2, max: 191 })
    .withMessage("Qyteti duhet të ketë 2-191 karaktere"),
];

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

router.get("/", async (req, res) => {
  try {
    const schools = await prisma.shkolla.findMany({
      include: {
        _count: { select: { nxenesit: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    res.json(schools);
  } catch (err) {
    console.error("Error fetching schools:", err);
    res.status(500).json({ error: "Failed to fetch schools" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }

    const school = await prisma.shkolla.findUnique({
      where: { id },
      include: {
        nxenesit: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!school) return res.status(404).json({ error: "School not found" });

    res.json(school);
  } catch (err) {
    console.error("Error fetching school:", err);
    res.status(500).json({ error: "Failed to fetch school" });
  }
});

router.post("/", authorize("ADMIN", "MANAGER"), validateSchool, async (req, res) => {
  if (!handleValidation(req, res)) return;

  try {
    const { emri, qyteti } = req.body;

    const school = await prisma.shkolla.create({
      data: {
        emri: emri.trim(),
        qyteti: qyteti.trim(),
      },
    });

    res.status(201).json(school);
  } catch (err) {
    console.error("Error creating school:", err);
    res.status(500).json({ error: "Failed to create school" });
  }
});

router.put("/:id", authorize("ADMIN", "MANAGER"), validateSchool, async (req, res) => {
  if (!handleValidation(req, res)) return;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }

    const { emri, qyteti } = req.body;

    const school = await prisma.shkolla.update({
      where: { id },
      data: {
        emri: emri.trim(),
        qyteti: qyteti.trim(),
      },
    });

    res.json(school);
  } catch (err) {
    console.error("Error updating school:", err);
    if (err.code === "P2025") return res.status(404).json({ error: "School not found" });
    res.status(500).json({ error: "Failed to update school" });
  }
});

router.delete("/:id", authorize("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid school ID" });
    }

    await prisma.shkolla.delete({ where: { id } });

    res.json({ message: "Shkolla u fshi me sukses" });
  } catch (err) {
    console.error("Error deleting school:", err);
    if (err.code === "P2025") return res.status(404).json({ error: "School not found" });
    res.status(500).json({ error: "Failed to delete school" });
  }
});

export default router;
