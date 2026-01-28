import express from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin/Manager only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 */
// get all users (Admin/Manager only)
router.get("/", authorize("ADMIN", "MANAGER"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        notificationPrefs: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - users can only view their own profile unless Admin/Manager
 *       404:
 *         description: User not found
 */
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
        email: true,
        role: true,
        notificationPrefs: true,
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

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user (Admin/Manager only or own profile)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: new_username
 *               role:
 *                 type: string
 *                 enum: [USER, MANAGER, ADMIN]
 *                 description: Only Admin/Manager can change roles
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *         description: Validation error or username already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: User not found
 */
// update user (Admin/Manager only or own profile)
router.put(
  "/:id",
  [
    body("username")
      .optional()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format"),
    body("role")
      .optional()
      .isIn(["USER", "MANAGER", "ADMIN"])
      .withMessage("Invalid role"),
    body("notificationPrefs")
      .optional()
      .isObject()
      .withMessage("Notification preferences must be an object"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = parseInt(req.params.id);
      const { username, email, role } = req.body;

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
      if (email !== undefined) updateData.email = email || null;
      if (role && canUpdateRole) updateData.role = role;
      if (req.body.notificationPrefs !== undefined) {
        updateData.notificationPrefs = req.body.notificationPrefs;
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          notificationPrefs: true,
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

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete your own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: User not found
 */
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

/**
 * @swagger
 * /users/{id}/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 minLength: 6
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or incorrect current password
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - users can only change their own password unless Admin/Manager
 *       404:
 *         description: User not found
 */
router.put(
  "/:id/password",
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = parseInt(req.params.id);
      const { currentPassword, newPassword } = req.body;

      // Check permissions - users can only change their own password unless Admin/Manager
      const canChangePassword =
        req.user.id === userId ||
        ["ADMIN", "MANAGER"].includes(req.user.role);

      if (!canChangePassword) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  }
);

export default router;
