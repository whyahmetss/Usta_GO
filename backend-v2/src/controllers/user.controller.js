// src/controllers/user.controller.js
export const uploadPhoto = async (req, res) => {
  try {
    // Kanka burası normalde Multer veya Cloudinary ile dolar.
    // Şimdilik frontend'e "yükledim" diyip bir resim URL'si dönelim:
    
    res.status(200).json({
      success: true,
      message: "Fotoğraf başarıyla yüklendi!",
      data: { 
        // Test için gerçek bir resim URL'si koyalım:
        url: "https://ui-avatars.com/api/?name=Musteri&background=random&size=128" 
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
