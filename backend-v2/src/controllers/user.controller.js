// src/controllers/user.controller.js
import { PrismaClient } from "@prisma/client"; // Prisma kullanıyorsan
const prisma = new PrismaClient();

export const uploadPhoto = async (req, res) => {
  try {
    const userId = req.user.id; // authMiddleware sayesinde kullanıcı ID'si buraya gelir
    const { photoUrl } = req.body; // Frontend'den gelen fotoğraf URL'si

    // Veritabanında kullanıcının fotoğrafını güncelle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: photoUrl }
    });

    res.status(200).json({
      success: true,
      message: "Profil fotoğrafı veritabanına kaydedildi!",
      data: { url: updatedUser.profilePhoto }
    });
  } catch (error) {
    console.error("Yükleme Hatası:", error);
    res.status(500).json({ error: "Fotoğraf kaydedilirken bir hata oluştu." });
  }
};
