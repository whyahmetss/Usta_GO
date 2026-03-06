import { Router } from 'express';
import * as certificateController from '../controllers/certificate.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authMiddleware, certificateController.uploadCertificate);
router.get('/admin', authMiddleware, certificateController.listCertificates);
router.patch('/admin/:id', authMiddleware, certificateController.updateCertificateStatus);

export default router;
