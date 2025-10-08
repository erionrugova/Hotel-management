import express from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

// get all users (Admin/Manager only)
router.get("/", authorize("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// get user by ID
router.get("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // users can only view their own profile unless they're admin/manager
    if (
      req.user.id !== userId &&
      !["ADMIN", "MANAGER"].includes(req.user.role)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// update user (Admin/Manager only or own profile)
router.put(
  "/:id",
  [
    body("username")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
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

      const userId = parseInt(req.params.id);
      const { username, role } = req.body;

      // check permissions
      const canUpdateRole = ["ADMIN", "MANAGER"].includes(req.user.role);
      const isOwnProfile = req.user.id === userId;

      if (!isOwnProfile && !canUpdateRole) {
        return res.status(403).json({ error: "Access denied" });
      }

      // only admin/manager can change roles
      if (role && !canUpdateRole) {
        return res
          .status(403)
          .json({ error: "Only admins and managers can change roles" });
      }

      const updateData = {};
      if (username) updateData.username = username;
      if (role && canUpdateRole) updateData.role = role;

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          role: true,
          updatedAt: true,
        },
      });

      res.json({
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(400).json({ error: "Username already exists" });
      }
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// delete user (Admin only)
router.delete("/:id", authorize("ADMIN"), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // prevent self-deletion
    if (req.user.id === userId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
