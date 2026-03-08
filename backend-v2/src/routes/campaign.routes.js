import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();
const prisma = new PrismaClient();

router.get("/active", async (req, res) => {
  const campaign = await prisma.campaign.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!campaign) return res.json({ data: null });

  res.json({
    data: {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description || "",
      badge_text: campaign.badgeText || "",
      button_text: campaign.buttonText || "",
      bg_color: campaign.bgColor,
      badge_color: campaign.badgeColor,
      text_color: campaign.textColor,
      active: campaign.active,
      updatedAt: campaign.updatedAt,
    },
  });
});

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { title, description, badge_text, button_text, bg_color, badge_color, text_color } = req.body;
  if (!title) return res.status(400).json({ error: "Kampanya basligi zorunludur" });

  await prisma.campaign.updateMany({ where: { active: true }, data: { active: false } });

  const campaign = await prisma.campaign.create({
    data: {
      title,
      description: description || "",
      badgeText: badge_text || "",
      buttonText: button_text || "",
      bgColor: bg_color || "#111827",
      badgeColor: badge_color || "#34d399",
      textColor: text_color || "#ffffff",
      active: true,
    },
  });

  res.json({
    data: {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      badge_text: campaign.badgeText,
      button_text: campaign.buttonText,
      bg_color: campaign.bgColor,
      badge_color: campaign.badgeColor,
      text_color: campaign.textColor,
      active: campaign.active,
      updatedAt: campaign.updatedAt,
    },
    message: "Kampanya yayinlandi",
  });
});

router.delete("/", authMiddleware, adminMiddleware, async (req, res) => {
  await prisma.campaign.updateMany({ where: { active: true }, data: { active: false } });
  res.json({ data: null, message: "Kampanya kaldirildi" });
});

export default router;
