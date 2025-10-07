// src/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { OAuth2Client } from "google-auth-library";

const router = express.Router();
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// -------------------- Register --------------------
router.post(
  "/register",
  [
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["USER", "MANAGER", "ADMIN"])
      .withMessage("Invalid role"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password, role = "USER" } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: { username, password: hashedPassword, role },
        select: { id: true, username: true, role: true, createdAt: true },
      });

      res.status(201).json({
        message: "User created successfully",
        user,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  }
);

// -------------------- Login --------------------
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: "Login successful",
        token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// -------------------- Google Login (One Tap / Credential) --------------------
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "Google credential missing" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const username = email.split("@")[0];

    // check if user exists
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.create({
        data: { username, password: "", role: "USER" },
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: "Google login successful",
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Google login failed" });
  }
});

// -------------------- Google Login (OAuth Redirect Flow) --------------------
router.get("/google", (req, res) => {
  const redirectUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["profile", "email"],
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });
  res.redirect(redirectUrl);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    console.log("⚡ Google callback hit with query:", req.query);

    console.log("🔑 Exchanging code for tokens...");
    const { tokens } = await client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });
    console.log("✅ Got tokens:", tokens);

    client.setCredentials(tokens);

    console.log("🔎 Verifying ID token...");
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log("✅ Payload:", payload);

    const email = payload.email;
    const username = email.split("@")[0];

    // find or create user
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.log("🆕 Creating new user:", username);
      user = await prisma.user.create({
        data: { username, password: "", role: "USER" },
      });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // ✅ Encode user JSON as Base64 for safe transport
    const userPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    const userBase64 = Buffer.from(JSON.stringify(userPayload)).toString(
      "base64"
    );

    // redirect back to frontend
    const redirectFrontend = `http://localhost:3001/login-success?token=${encodeURIComponent(
      token
    )}&user=${encodeURIComponent(userBase64)}`;

    console.log("🚀 Redirecting to frontend:", redirectFrontend);

    res.redirect(redirectFrontend);
  } catch (error) {
    console.error("Google OAuth callback error:", error.message);
    console.error(error.stack);
    res.redirect("http://localhost:3001/login?error=google_auth_failed");
  }
});

export default router;
