import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

// ------------------ ROUTES ------------------
import userRoutes from "./routes/userRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import rateRoutes from "./routes/rateRoutes.js";
import dealRoutes from "./routes/dealRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// ------------------ MIDDLEWARE ------------------
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ------------------ PRISMA ------------------
export const prisma = new PrismaClient();

// ------------------ SECURITY & CORS ------------------
app.use(helmet());

// ✅ Allow React frontend (localhost:3001) to access API + uploads
app.use(
  cors({
    origin: ["http://localhost:3001", "http://127.0.0.1:3001"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------ STATIC FILES (Uploads) ------------------
const uploadsPath = path.join(process.cwd(), "uploads");

// ✅ Ensure the uploads folder exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// ✅ Serve uploaded images with full cross-origin support
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3001");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
  },
  express.static(uploadsPath)
);

// ------------------ ROUTES ------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/contact", contactRoutes);

// ------------------ HEALTH CHECK ------------------
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", message: "Hotel Management API running" })
);

// ------------------ ERROR HANDLERS ------------------
app.use(notFound);
app.use(errorHandler);

// ------------------ GRACEFUL SHUTDOWN ------------------
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/api/health`);
  console.log(`🖼️ Uploads served from: http://localhost:${PORT}/uploads`);
});
