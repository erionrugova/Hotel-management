import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

const router = express.Router();
const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

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
      res.status(500).json({ error: "Login failed" });
    }
  }
);

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

// google login (one tap)
router.post("/google", async (req, res) => {
  try {
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
