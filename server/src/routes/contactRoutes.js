import express from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Send a contact message (public endpoint)
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Contact'
 */
// add message (public endpoint)
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("message").trim().notEmpty().withMessage("Message is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, message } = req.body;

      const newMessage = await prisma.contact.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        },
      });

      res
        .status(201)
        .json({ message: "Message received successfully", data: newMessage });
    } catch (err) {
      console.error("Error saving contact message:", err);
      res.status(500).json({ error: "Failed to save message" });
    }
  }
);

/**
 * @swagger
 * /contact:
 *   get:
 *     summary: Get all contact messages (Admin/Manager only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contact messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 */
// get all messages (Admin/Manager only)
router.get(
  "/",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const messages = await prisma.contact.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json(messages);
    } catch (err) {
      console.error("Error fetching contact messages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

/**
 * @swagger
 * /contact/{id}/read:
 *   patch:
 *     summary: Mark contact message as read/unread (Admin/Manager only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - read
 *             properties:
 *               read:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Message status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 *       404:
 *         description: Message not found
 */
// mark as read/unread (Admin/Manager only)
router.patch(
  "/:id/read",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  [body("read").isBoolean().withMessage("read must be a boolean")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { read } = req.body;

      const updated = await prisma.contact.update({
        where: { id: parseInt(id) },
        data: { read },
      });

      res.json(updated);
    } catch (err) {
      console.error("Error updating message status:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Message not found" });
      }
      res.status(500).json({ error: "Failed to update message status" });
    }
  }
);

/**
 * @swagger
 * /contact/{id}:
 *   delete:
 *     summary: Delete contact message (Admin/Manager only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Contact message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
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
 *         description: Forbidden - Admin or Manager role required
 *       404:
 *         description: Message not found
 */
// delete message (Admin/Manager only)
router.delete(
  "/:id",
  authenticateToken,
  authorize("ADMIN", "MANAGER"),
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.contact.delete({ where: { id: parseInt(id) } });
      res.json({ message: "Message deleted successfully" });
    } catch (err) {
      console.error("Error deleting message:", err);
      if (err.code === "P2025") {
        return res.status(404).json({ error: "Message not found" });
      }
      res.status(500).json({ error: "Failed to delete message" });
    }
  }
);

export default router;
