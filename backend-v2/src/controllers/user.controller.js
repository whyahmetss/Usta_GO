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

export const uploadPhotos = async (req, res) => {
  try {
    // Handle multiple photo uploads
    // For now, return placeholder URLs
    // In production, integrate with Cloudinary/S3/etc

    const files = req.body.photos || [];
    const urls = files.map((file, index) => {
      // Convert data URLs or use placeholder
      if (file && file.startsWith('data:')) {
        // For now, just return a placeholder
        // In production, save to cloud storage and return real URL
        return `https://via.placeholder.com/400?text=Photo${index + 1}`;
      }
      return `https://via.placeholder.com/400?text=Photo${index + 1}`;
    });

    res.status(200).json({
      success: true,
      data: {
        urls
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
