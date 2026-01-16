import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const router = express.Router();
// Initialize Google OAuth client only if credentials are provided
const client =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      )
    : null;

// helper: log session
async function logSession(userId, action, req) {
  try {
    const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const agent = req.headers["user-agent"] || "unknown";
    await prisma.sessionLog.create({
      data: {
        userId,
        action,
        ipAddress: Array.isArray(ip) ? ip[0] : ip,
        userAgent: agent,
      },
    });
    console.log(`🧾 Logged session: ${action} for user ${userId}`);
  } catch (err) {
    console.error("Failed to log session:", err);
  }
}

// helper: create refresh token
async function createRefreshToken(userId, res) {
  const token = crypto.randomUUID();
  const expires = new Date();
  expires.setDate(expires.getDate() + 7); // 7 days validity

  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt: expires,
    },
  });

  // store securely as HTTP-only cookie
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    expires, // 7 days
  });

  return token;
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [USER, MANAGER, ADMIN]
 *                 default: USER
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// register
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
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { username, password, role = "USER" } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser)
        return res.status(400).json({ error: "Username already exists" });

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: { username, password: hashedPassword, role },
        select: { id: true, username: true, role: true, createdAt: true },
      });

      res.status(201).json({ message: "User created successfully", user });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and get access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful. Refresh token is stored in HTTP-only cookie (not in response body for security).
 *         headers:
 *           Set-Cookie:
 *             description: Refresh token stored in HTTP-only cookie (refreshToken). Valid for 7 days. Used automatically by /auth/refresh endpoint.
 *             schema:
 *               type: string
 *               example: refreshToken=abc123...; HttpOnly; Path=/; SameSite=Lax; Expires=...
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token (store in localStorage/client memory). Expires based on JWT_EXPIRES_IN.
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// login
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });

      const { username, password } = req.body;
      const user = await prisma.user.findUnique({ where: { username } });

      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword)
        return res.status(401).json({ error: "Invalid credentials" });

      const accessToken = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      await createRefreshToken(user.id, res);
      await logSession(user.id, "LOGIN", req);

      res.json({
        message: "Login successful",
        accessToken,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (error) {
      console.error("Login error:", error);
      console.error("Error stack:", error.stack);
      // In development, provide more error details
      const errorMessage =
        process.env.NODE_ENV === "development"
          ? `Login failed: ${error.message}`
          : "Login failed";
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token cookie
 *     tags: [Authentication]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT access token
 *       401:
 *         description: No refresh token provided
 *       403:
 *         description: Invalid or expired refresh token
 */
// refresh access token
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }

    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.revoked ||
      new Date() > tokenRecord.expiresAt
    ) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
      });
      return res
        .status(403)
        .json({ error: "Invalid or expired refresh token" });
    }

    const newAccessToken = jwt.sign(
      {
        userId: tokenRecord.user.id,
        username: tokenRecord.user.username,
        role: tokenRecord.user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await logSession(tokenRecord.userId, "REFRESH", req);
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Failed to refresh access token" });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and revoke refresh token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
// logout
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
      });
    }

    if (req.user?.userId) {
      await logSession(req.user.userId, "LOGOUT", req);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// google login (one tap) - Swagger documentation removed
router.post("/google", async (req, res) => {
  try {
    if (!client || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        error: "Google OAuth not configured",
        message:
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required",
      });
    }

    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ error: "Google credential missing" });

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const username = email.split("@")[0];

    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.create({
        data: { username, password: "", role: "USER" },
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await createRefreshToken(user.id, res);
    await logSession(user.id, "LOGIN (GOOGLE)", req);

    res.json({
      message: "Google login successful",
      accessToken,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Google login failed" });
  }
});

// Google OAuth initiation - Swagger documentation removed
router.get("/google", (req, res) => {
  if (!client || !process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      error: "Google OAuth not configured",
      message:
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required",
    });
  }

  const redirectUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["profile", "email"],
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  });
  res.redirect(redirectUrl);
});

// Google OAuth callback - Swagger documentation removed
router.get("/google/callback", async (req, res) => {
  try {
    if (!client || !process.env.GOOGLE_CLIENT_ID) {
      return res.redirect(
        "http://localhost:3001/login?error=google_oauth_not_configured"
      );
    }

    const { code } = req.query;

    // exchange google code for tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    });
    client.setCredentials(tokens);

    // verify google ID token and extract email
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const username = email.split("@")[0];

    // find or create user in DB
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.create({
        data: { username, password: "", role: "USER" },
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    await createRefreshToken(user.id, res);

    await logSession(user.id, "LOGIN (GOOGLE-OAUTH)", req);

    const userPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    const userBase64 = Buffer.from(JSON.stringify(userPayload)).toString(
      "base64"
    );

    // redirect frontend with backend JWT
    const redirectFrontend = `http://localhost:3001/login-success?token=${encodeURIComponent(
      accessToken
    )}&user=${encodeURIComponent(userBase64)}`;

    res.redirect(redirectFrontend);
  } catch (error) {
    console.error("Google OAuth callback error:", error.message);
    res.redirect("http://localhost:3001/login?error=google_auth_failed");
  }
});

export default router;
