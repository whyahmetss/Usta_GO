// src/controllers/user.controller.js
export const uploadPhoto = async (req, res) => {
  try {
    // Şimdilik sadece frontend'e URL'yi geri fırlatalım
    // Not: Gerçek yükleme için ileride buraya Cloudinary/Multer ekleyeceğiz
    res.status(200).json({
      success: true,
      data: {
        url: "https://ui-avatars.com/api/?name=Usta+Go&background=0D8ABC&color=fff"
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
