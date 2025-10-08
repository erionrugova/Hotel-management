import jwt from "jsonwebtoken";
import { prisma } from "../server.js";

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
      console.warn("⚠️ Invalid token — user not found");
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ error: "Malformed token" });
    }
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};
