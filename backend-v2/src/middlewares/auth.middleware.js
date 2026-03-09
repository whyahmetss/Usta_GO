import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

export const adminMiddleware = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  // Check DB for current role (JWT role might be stale after role change)
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } });
    const role = (dbUser?.role || req.user.role || "").toUpperCase();
    if (role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const supportMiddleware = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  // Check DB for current role (JWT role might be stale after role change)
  try {
    const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } });
    const role = (dbUser?.role || req.user.role || "").toUpperCase();
    if (role !== "ADMIN" && role !== "SUPPORT") {
      return res.status(403).json({ error: "Destek yetkisi gerekli" });
    }
    // Sync req.user.role with DB value so downstream handlers see correct role
    if (dbUser) req.user = { ...req.user, role: dbUser.role };
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
