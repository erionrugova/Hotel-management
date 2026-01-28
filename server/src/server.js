import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { fileURLToPath } from "url";

// Load environment variables immediately
dotenv.config();

// FORCE load .env from server root to ensure it's picked up regardless of CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

console.log(`🔧 Loading .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Failed to load .env file:", result.error.message);
} else {
  console.log("✅ .env loaded successfully");
}

console.log("🔍 Google Config Status:");
console.log(
  `  GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "Set (Ends with " + process.env.GOOGLE_CLIENT_ID.slice(-5) + ")" : "MISSING"}`,
);
console.log(
  `  GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? "Set" : "MISSING"}`,
);
console.log(
  `  GOOGLE_REDIRECT_URI: ${process.env.GOOGLE_REDIRECT_URI || "MISSING"}`,
);

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
import settingsRoutes from "./routes/settingsRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

// Ensure dotenv is loaded (redundant check but safe)
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

export const prisma = new PrismaClient();

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS configuration - MUST come before rate limiting to handle preflight requests
const allowedOrigins = [
  "http://localhost:3000", // Allow Swagger UI on same port
  "http://127.0.0.1:3000", // Allow Swagger UI on same port (IP variant)
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3004",
  "http://127.0.0.1:3004",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("⚠️  Blocked CORS request from:", origin);
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
      "X-Requested-With",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours - cache preflight requests
  }),
);

// Log CORS requests in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
      console.log(
        "🔄 CORS preflight request:",
        req.method,
        req.path,
        "Origin:",
        req.headers.origin,
      );
    }
    next();
  });
}

// Rate limiting - DISABLED in development by default
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "development" ? 10000 : 5000, // Very high limit for development, increased for production too
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
  // Skip rate limiting for OPTIONS requests (CORS preflight) and health checks
  skip: (req) => {
    if (req.method === "OPTIONS") return true;
    if (req.path === "/api/health") return true;
    return false;
  },
  // Standard headers for rate limit info
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from counting (only count errors)
  skipSuccessfulRequests: false,
  // Skip failed requests from counting
  skipFailedRequests: false,
});

// Only apply rate limiting if explicitly enabled (via ENABLE_RATE_LIMIT=true)
// This allows disabling rate limiting even in production if needed
if (process.env.ENABLE_RATE_LIMIT === "true") {
  app.use(limiter);
  console.log("✅ Rate limiting enabled");
} else {
  console.log(
    "⚠️  Rate limiting DISABLED (set ENABLE_RATE_LIMIT=true to enable)",
  );
}

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
  express.static(uploadsPath),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/settings", settingsRoutes);

app.get("/api/health", (req, res) =>
  res.json({
    status: "OK",
    message: "Hotel Management API running securely",
  }),
);

// Swagger API Documentation
try {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Hotel Management API Documentation",
    }),
  );
  console.log("✅ Swagger UI configured successfully");
} catch (error) {
  console.error("❌ Swagger configuration error:", error);
  app.use("/api-docs", (req, res) => {
    res.status(500).json({
      error: "Swagger documentation unavailable",
      message: error.message,
    });
  });
}

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
  console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`Uploads served from: http://localhost:${PORT}/uploads`);
  console.log(" Daily cleanup job scheduled for 2:00 AM");
});
