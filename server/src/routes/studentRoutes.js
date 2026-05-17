import express from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

const validateStudent = [
  body("emriNxenesit")
    .trim()
    .notEmpty()
    .withMessage("Emri i nxënësit është i detyrueshëm")
    .isLength({ min: 2, max: 191 })
    .withMessage("Emri i nxënësit duhet të ketë 2-191 karaktere"),
  body("klasa")
    .trim()
    .notEmpty()
    .withMessage("Klasa është e detyrueshme")
    .isLength({ min: 1, max: 50 })
    .withMessage("Klasa duhet të ketë 1-50 karaktere"),
  body("shkollaId")
    .notEmpty()
    .withMessage("Shkolla është e detyrueshme")
    .isInt({ min: 1 })
    .withMessage("Shkolla duhet të jetë valide"),
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
    const { schoolId } = req.query;
    const where = {};

    if (schoolId) {
      const parsedSchoolId = Number(schoolId);
      if (!Number.isInteger(parsedSchoolId)) {
        return res.status(400).json({ error: "Invalid school ID" });
      }
      where.shkollaId = parsedSchoolId;
    }

    const students = await prisma.nxenesi.findMany({
      where,
      include: {
        shkolla: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

router.post("/", authorize("ADMIN", "MANAGER"), validateStudent, async (req, res) => {
  if (!handleValidation(req, res)) return;

  try {
    const { emriNxenesit, klasa, shkollaId } = req.body;

    const school = await prisma.shkolla.findUnique({
      where: { id: Number(shkollaId) },
    });

    if (!school) return res.status(404).json({ error: "Shkolla nuk ekziston" });

    const student = await prisma.nxenesi.create({
      data: {
        emriNxenesit: emriNxenesit.trim(),
        klasa: klasa.trim(),
        shkollaId: Number(shkollaId),
      },
      include: { shkolla: true },
    });

    res.status(201).json(student);
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ error: "Failed to create student" });
  }
});

router.put("/:id", authorize("ADMIN", "MANAGER"), validateStudent, async (req, res) => {
  if (!handleValidation(req, res)) return;

  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    const { emriNxenesit, klasa, shkollaId } = req.body;

    const school = await prisma.shkolla.findUnique({
      where: { id: Number(shkollaId) },
    });

    if (!school) return res.status(404).json({ error: "Shkolla nuk ekziston" });

    const student = await prisma.nxenesi.update({
      where: { id },
      data: {
        emriNxenesit: emriNxenesit.trim(),
        klasa: klasa.trim(),
        shkollaId: Number(shkollaId),
      },
      include: { shkolla: true },
    });

    res.json(student);
  } catch (err) {
    console.error("Error updating student:", err);
    if (err.code === "P2025") return res.status(404).json({ error: "Student not found" });
    res.status(500).json({ error: "Failed to update student" });
  }
});

router.delete("/:id", authorize("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid student ID" });
    }

    await prisma.nxenesi.delete({ where: { id } });

    res.json({ message: "Nxënësi u fshi me sukses" });
  } catch (err) {
    console.error("Error deleting student:", err);
    if (err.code === "P2025") return res.status(404).json({ error: "Student not found" });
    res.status(500).json({ error: "Failed to delete student" });
  }
});

export default router;
