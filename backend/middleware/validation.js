import { body, param, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Doğrulama hatası',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// Auth validations
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('İsim gereklidir')
    .isLength({ min: 2 }).withMessage('İsim en az 2 karakter olmalıdır'),
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Geçerli bir e-posta sağlayın'),
  body('password')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır'),
  body('role')
    .optional()
    .isIn(['customer', 'professional']).withMessage('Geçersiz rol'),
  handleValidationErrors,
];

export const validateLogin = [
  body('email')
    .trim()
    .toLowerCase()
    .isEmail().withMessage('Geçerli bir e-posta sağlayın'),
  body('password')
    .notEmpty().withMessage('Şifre gereklidir'),
  handleValidationErrors,
];

// Job validations
export const validateCreateJob = [
  body('title')
    .trim()
    .notEmpty().withMessage('İş başlığı gereklidir'),
  body('description')
    .trim()
    .notEmpty().withMessage('İş açıklaması gereklidir'),
  body('price')
    .isNumeric().withMessage('Fiyat sayısal olmalıdır')
    .custom(value => value > 0).withMessage('Fiyat 0'dan büyük olmalıdır'),
  body('basePrice')
    .isNumeric().withMessage('Temel fiyat sayısal olmalıdır'),
  body('location.lat')
    .isNumeric().withMessage('Enlem sayısal olmalıdır'),
  body('location.lng')
    .isNumeric().withMessage('Boyam sayısal olmalıdır'),
  handleValidationErrors,
];

// Message validation
export const validateSendMessage = [
  body('content')
    .trim()
    .notEmpty().withMessage('Mesaj içeriği gereklidir'),
  body('to')
    .trim()
    .notEmpty().withMessage('Alıcı gereklidir'),
  handleValidationErrors,
];

// Transaction validation
export const validateTransaction = [
  body('amount')
    .isNumeric().withMessage('Miktar sayısal olmalıdır')
    .custom(value => value > 0).withMessage('Miktar 0'dan büyük olmalıdır'),
  handleValidationErrors,
];
