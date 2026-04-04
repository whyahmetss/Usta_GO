import prisma from "../utils/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { getReferralBonus } from "./config.service.js";

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

  // Generic hata: e-posta/şifre ayrımı yapma (user enumeration önleme)
  if (!user) {
    const error = new Error("E-posta veya şifre hatalı");
    error.status = 401;
    throw error;
  }

  if (user.isDeleted) {
    const error = new Error("Bu hesap silinmiştir");
    error.status = 403;
    throw error;
  }

  // Social login kullanıcıları şifresiz olabilir
  if (!user.password) {
    const error = new Error("Bu hesap sosyal giriş ile oluşturulmuş. Lütfen Apple veya Google ile giriş yapın.");
    error.status = 401;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const error = new Error("E-posta veya şifre hatalı");
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

/**
 * Social Login (Apple / Google) — token doğrulama + kullanıcı oluştur/bul
 * @param {Object} data - { provider: "apple"|"google", idToken, name?, email? }
 */
export const socialLogin = async (data) => {
  const { provider, idToken, name, email: providedEmail } = data;

  if (!provider || !idToken) {
    const err = new Error("provider ve idToken gerekli");
    err.status = 400;
    throw err;
  }

  let verifiedEmail = null;
  let providerSub = null;
  let providerName = name || null;

  if (provider === "apple") {
    // Apple identityToken doğrulama (JWT decode)
    try {
      const parts = idToken.split(".");
      if (parts.length !== 3) throw new Error("Geçersiz Apple token formatı");
      const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      // Apple token'dan email ve sub al
      verifiedEmail = payload.email || providedEmail;
      providerSub = payload.sub;
      if (!verifiedEmail) throw new Error("Apple token'da email bulunamadı");
    } catch (e) {
      const err = new Error("Apple token doğrulanamadı: " + e.message);
      err.status = 401;
      throw err;
    }
  } else if (provider === "google") {
    // Google idToken doğrulama
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!res.ok) throw new Error("Google token geçersiz");
      const payload = await res.json();
      verifiedEmail = payload.email;
      providerSub = payload.sub;
      providerName = providerName || payload.name || null;
      if (!verifiedEmail) throw new Error("Google token'da email bulunamadı");
    } catch (e) {
      const err = new Error("Google token doğrulanamadı: " + e.message);
      err.status = 401;
      throw err;
    }
  } else {
    const err = new Error("Desteklenmeyen provider: " + provider);
    err.status = 400;
    throw err;
  }

  // Mevcut kullanıcıyı bul (email veya provider+sub ile)
  let user = await prisma.user.findUnique({ where: { email: verifiedEmail } });

  if (user && user.isDeleted) {
    const err = new Error("Bu hesap silinmiştir");
    err.status = 403;
    throw err;
  }

  if (user) {
    // Mevcut kullanıcı — provider bilgisini güncelle
    if (!user.authProvider) {
      await prisma.user.update({
        where: { id: user.id },
        data: { authProvider: provider, authProviderId: providerSub },
      });
    }
  } else {
    // Yeni kullanıcı oluştur
    let newReferralCode;
    let attempts = 0;
    do {
      newReferralCode = generateReferralCode();
      const exists = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    user = await prisma.user.create({
      data: {
        name: providerName || verifiedEmail.split("@")[0],
        email: verifiedEmail,
        password: null,
        role: "CUSTOMER",
        authProvider: provider,
        authProviderId: providerSub,
        referralCode: newReferralCode,
        status: "ACTIVE",
      },
    });
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, referralCode: user.referralCode, isActive: user.isActive ?? true, status: user.status },
    token,
  };
};

/**
 * Hesap Silme (Soft Delete) — KVKK uyumlu
 * Kişisel verileri (ad, telefon, bio) temizler, isDeleted=true işaretler, ID kalır
 */
export const deleteAccount = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error("Kullanıcı bulunamadı");
    err.status = 404;
    throw err;
  }
  if (user.isDeleted) {
    const err = new Error("Bu hesap zaten silinmiş");
    err.status = 400;
    throw err;
  }

  // Kişisel verileri temizle, ID ve yasal kayıtlar kalsın
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: "Silinmiş Kullanıcı",
      phone: null,
      bio: null,
      profileImage: null,
      fcmToken: null,
      password: null,
      isDeleted: true,
      deletedAt: new Date(),
      status: "DELETED",
      isActive: false,
    },
  });

  return { message: "Hesabınız başarıyla silindi. Kişisel verileriniz KVKK uyarınca temizlenmiştir." };
};

export const getUserProfile = async (userId) => {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      bio: true, profileImage: true, ratings: true, balance: true,
      isActive: true, referralCode: true, status: true, birthDate: true, createdAt: true, updatedAt: true,
      hasVergiLevhasi: true,
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
        hasVergiLevhasi: true,
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
  const allowed = ['name', 'phone', 'bio', 'profileImage', 'isActive', 'hasVergiLevhasi'];
  const sanitized = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  const user = await prisma.user.update({
    where: { id: userId },
    data: sanitized,
    select: {
      id: true, name: true, email: true, role: true, phone: true,
      bio: true, profileImage: true, isActive: true, referralCode: true,
      hasVergiLevhasi: true,
    },
  });
  return user;
};
