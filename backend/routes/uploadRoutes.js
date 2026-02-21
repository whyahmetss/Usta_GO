import express from 'express';
import { upload, getFileUrl } from '../utils/multer.js';
import { protect } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/sendResponse.js';

const router = express.Router();

// Upload a single photo
router.post('/photo', protect, upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'Dosya yüklenemedi', 400);
    }

    const fileUrl = getFileUrl(req.file.filename);

    return sendSuccess(res, 'Dosya yüklendi', {
      filename: req.file.filename,
      url: fileUrl,
      size: req.file.size,
    }, 201);
  } catch (error) {
    console.error('Upload photo error:', error);
    return sendError(res, error.message, 500);
  }
});

// Upload multiple photos
router.post('/photos', protect, upload.array('photos', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 'Dosyalar yüklenemedi', 400);
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      url: getFileUrl(file.filename),
      size: file.size,
    }));

    return sendSuccess(res, 'Dosyalar yüklendi', files, 201);
  } catch (error) {
    console.error('Upload photos error:', error);
    return sendError(res, error.message, 500);
  }
});

export default router;
