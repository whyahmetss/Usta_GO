import { Router } from "express";
import multer from "multer";
import path from "path";
import { uploadPhoto, uploadPhotos } from "../controllers/upload.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Multer config - temp storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

/**
 * @route POST /api/upload/photo
 * @desc Upload a single photo to Cloudinary
 */
router.post("/photo", authMiddleware, upload.single('photo'), uploadPhoto);

/**
 * @route POST /api/upload/photos
 * @desc Upload multiple photos to Cloudinary
 */
router.post("/photos", authMiddleware, upload.array('photos', 10), uploadPhotos);

export default router;
