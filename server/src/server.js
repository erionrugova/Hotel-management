import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import pkg from "@prisma/client";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import compression from "compression";
import cron from "node-cron";
import cors from "cors";

const { PrismaClient } = pkg;

import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import rateRoutes from "./routes/rateRoutes.js";
import dealRoutes from "./routes/dealRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

export const prisma = new PrismaClient();

app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "development" ? 1000 : 100,
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
});
app.use(limiter);

// CORS configuration
const allowedOrigins = ["http://localhost:3001", "http://127.0.0.1:3001"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("Blocked CORS request from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "X-Requested-With",
      "Accept",
    ],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

const uploadsPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
  },
  express.static(uploadsPath)
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/contact", contactRoutes);

app.get("/api/health", (req, res) =>
  res.json({
    status: "OK",
    message: "Hotel Management API running securely",
  })
);

// daily token cleanup
cron.schedule("0 2 * * *", async () => {
  console.log("Running daily refresh token cleanup...");
  const now = new Date();
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: now } }, { revoked: true }] },
    });
    console.log(`Deleted ${result.count} expired or revoked tokens`);
  } catch (err) {
    console.error("Error during cleanup:", err);
  }
});

app.use(notFound);
app.use(errorHandler);

process.on("SIGINT", async () => {
  console.log("Gracefully shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  console.log("Gracefully shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running securely on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Uploads served from: http://localhost:${PORT}/uploads`);
  console.log(" Daily cleanup job scheduled for 2:00 AM");
});
