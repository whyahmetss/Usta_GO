import { Router } from 'express';
import * as certificateController from '../controllers/certificate.controller.js';
import { authMiddleware, supportMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, certificateController.uploadCertificate);
// Admin OR Support can list/update certificates
router.get('/admin', authMiddleware, supportMiddleware, certificateController.listCertificates);
router.patch('/admin/:id', authMiddleware, supportMiddleware, certificateController.updateCertificateStatus);

export default router;
