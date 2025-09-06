// src/routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";

const router = express.Router();

// Register
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

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        message: "User created successfully",
        user,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  }
);

// Login
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

      // Find user
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  }
);

export default router;
