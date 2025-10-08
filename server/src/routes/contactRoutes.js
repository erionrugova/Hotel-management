import express from "express";
import { prisma } from "../server.js";

const router = express.Router();

// add message
router.post("/", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const newMessage = await prisma.contact.create({
      data: { name, email, message },
    });

    res
      .status(201)
      .json({ message: "Message received successfully", data: newMessage });
  } catch (err) {
    console.error("Error saving contact message:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// get all messages
router.get("/", async (req, res) => {
  try {
    const messages = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching contact messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// mark as read/unread
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;

    const updated = await prisma.contact.update({
      where: { id: parseInt(id) },
      data: { read },
    });

    res.json(updated);
  } catch (err) {
    console.error("Error updating message status:", err);
    res.status(500).json({ error: "Failed to update message status" });
  }
});

// delete message
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contact.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
});

export default router;
