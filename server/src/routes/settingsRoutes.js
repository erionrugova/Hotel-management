import express from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../server.js";
import { authenticateToken, authorize } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /settings/hotel/public:
 *   get:
 *     summary: Get hotel settings (public endpoint)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Hotel settings
 */
router.get("/hotel/public", async (req, res) => {
  try {
    let settings = await prisma.hotelSettings.findFirst();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.hotelSettings.create({
        data: {},
      });
    }
    
    // Only return public fields
    res.json({
      name: settings.name,
      address: settings.address,
      contactEmail: settings.contactEmail,
      phone: settings.phone,
    });
  } catch (error) {
    console.error("Error fetching hotel settings:", error);
    res.status(500).json({ error: "Failed to fetch hotel settings" });
  }
});

router.use(authenticateToken);

/**
 * @swagger
 * /settings/hotel:
 *   get:
 *     summary: Get hotel settings (Admin/Manager only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hotel settings
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 */
router.get("/hotel", authorize("ADMIN", "MANAGER"), async (req, res) => {
  try {
    let settings = await prisma.hotelSettings.findFirst();
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.hotelSettings.create({
        data: {},
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error("Error fetching hotel settings:", error);
    res.status(500).json({ error: "Failed to fetch hotel settings" });
  }
});

/**
 * @swagger
 * /settings/hotel:
 *   put:
 *     summary: Update hotel settings (Admin/Manager only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               phone:
 *                 type: string
 *               currency:
 *                 type: string
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Hotel settings updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin or Manager role required
 */
router.put(
  "/hotel",
  authorize("ADMIN", "MANAGER"),
  [
    body("name").optional().isString().trim(),
    body("address").optional().isString().trim(),
    body("contactEmail").optional().isEmail().withMessage("Invalid email"),
    body("phone").optional().isString().trim(),
    body("currency").optional().isString().trim(),
    body("timezone").optional().isString().trim(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, address, contactEmail, phone, currency, timezone } = req.body;
      
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
      if (phone !== undefined) updateData.phone = phone;
      if (currency !== undefined) updateData.currency = currency;
      if (timezone !== undefined) updateData.timezone = timezone;

      // Get or create settings
      let settings = await prisma.hotelSettings.findFirst();
      
      if (settings) {
        settings = await prisma.hotelSettings.update({
          where: { id: settings.id },
          data: updateData,
        });
      } else {
        settings = await prisma.hotelSettings.create({
          data: updateData,
        });
      }

      res.json({
        message: "Hotel settings updated successfully",
        settings,
      });
    } catch (error) {
      console.error("Error updating hotel settings:", error);
      res.status(500).json({ error: "Failed to update hotel settings" });
    }
  }
);

export default router;
