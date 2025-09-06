// src/server.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Import routes
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Prisma client
export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Hotel Management API is running" });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
