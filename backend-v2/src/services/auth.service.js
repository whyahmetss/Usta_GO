import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { getReferralBonus } from "./config.service.js";

const prisma = new PrismaClient();

// Generate a unique referral code like "USTA-AB12CD"
const generateReferralCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "USTA-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const isAtLeast18 = (birthDate) => {
  if (!birthDate) return true // opsiyonel alan
  const d = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age >= 18
}

export const registerUser = async (data) => {
  const { name, email, password, role, phone, referralCode, birthDate } = data;

  if (birthDate && !isAtLeast18(birthDate)) {
    const err = new Error('18 yaş altı kayıt olamaz')
    err.status = 400
    throw err
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error("User already exists");
    error.status = 409;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  // Generate unique referral code for this new user
  let newReferralCode;
  let attempts = 0;
  do {
    newReferralCode = generateReferralCode();
    const exists = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);

  const isUsta = (role || "").toUpperCase() === "USTA";
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || "CUSTOMER",
      phone,
      birthDate: birthDate ? new Date(birthDate) : null,
      referralCode: newReferralCode,
      status: isUsta ? "PENDING_APPROVAL" : "ACTIVE",
    },
  });

  // Handle referral bonus: configurable amounts from AppConfig
  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.toUpperCase() } });
    if (referrer && referrer.id !== user.id) {
      const bonusConfig = await getReferralBonus();
      const referrerAmt = bonusConfig.referrerBonus || 50;
      const newUserAmt = bonusConfig.newUserBonus || 50;
      await prisma.$transaction([
        prisma.user.update({ where: { id: referrer.id }, data: { balance: { increment: referrerAmt } } }),
        prisma.transaction.create({
          data: { userId: referrer.id, amount: referrerAmt, type: "REFERRAL", status: "COMPLETED", description: `Davet bonusu: ${user.name} kayıt oldu` },
        }),
        prisma.user.update({ where: { id: user.id }, data: { balance: { increment: newUserAmt } } }),
        prisma.transaction.create({
          data: { userId: user.id, amount: newUserAmt, type: "REFERRAL", status: "COMPLETED", description: `Hoş geldin bonusu: davet kodu kullanıldı` },
        }),
      ]);
    }
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, referralCode: user.referralCode, isActive: user.isActive ?? true, status: user.status },
    token,
  };
};

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("Invalid password");
    error.status = 401;
    throw error;
  }

  if (user.status === "BANNED") {
    const error = new Error("User is banned");
    error.status = 403;
    throw error;
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, referralCode: user.referralCode, isActive: user.isActive ?? true, status: user.status },
    token,
  };
};

export const getUserProfile = async (userId) => {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      bio: true, profileImage: true, ratings: true, balance: true,
      isActive: true, referralCode: true, status: true, birthDate: true, createdAt: true, updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (user.role === 'USTA') {
    const latestCert = await prisma.userCertificate.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    user.verificationStatus = latestCert ? (latestCert.status === 'APPROVED' ? 'verified' : latestCert.status === 'PENDING' ? 'pending' : 'rejected') : 'unverified';
  }

  // Auto-generate referral code for users who don't have one yet
  if (!user.referralCode) {
    let newReferralCode;
    let attempts = 0;
    do {
      newReferralCode = generateReferralCode();
      const exists = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    user = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: newReferralCode },
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        bio: true, profileImage: true, ratings: true, balance: true,
        isActive: true, referralCode: true, status: true, birthDate: true, createdAt: true, updatedAt: true,
      },
    });
  }

  return user;
};

export const saveFcmToken = async (userId, fcmToken) => {
  if (!fcmToken) {
    const error = new Error("fcmToken is required");
    error.status = 400;
    throw error;
  }
  await prisma.user.update({
    where: { id: userId },
    data: { fcmToken },
  });
  return { success: true };
};

export const updateUserProfile = async (userId, data) => {
  const allowed = ['name', 'phone', 'bio', 'profileImage', 'isActive'];
  const sanitized = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  const user = await prisma.user.update({
    where: { id: userId },
    data: sanitized,
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      bio: true, profileImage: true, isActive: true, referralCode: true,
    },
  });
  return user;
};
