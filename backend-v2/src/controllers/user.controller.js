export const uploadPhoto = async (req, res) => {
  try {
    // Fotoğraf yükleme mantığı buraya gelecek
    res.status(200).json({
      success: true,
      message: "Fotoğraf başarıyla alındı",
      data: { url: "https://via.placeholder.com/150" } // Şimdilik geçici URL
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
