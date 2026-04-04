import prisma from '../utils/prisma.js';
import { sendPushNotification } from '../utils/firebase.js';

const pushTo = async (userId, title, body, data = {}) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { fcmToken: true } });
    if (user?.fcmToken) await sendPushNotification(user.fcmToken, title, body, data);
  } catch {}
};

export const uploadCertificate = async (req, res) => {
  try {
    const { fileUrl, type: docType, label } = req.body;
    if (!fileUrl?.trim()) return res.status(400).json({ success: false, message: 'fileUrl gerekli' });
    const role = (req.user.role || '').toUpperCase();
    if (role !== 'USTA' && role !== 'CUSTOMER') return res.status(403).json({ success: false, message: 'Belge yükleme yetkisi yok' });

    const cert = await prisma.userCertificate.create({
      data: { userId: req.user.id, fileUrl: fileUrl.trim(), docType: docType || null, label: label || null, status: 'PENDING' },
    });
    res.status(201).json({ success: true, data: cert, message: 'Sertifika yüklendi, admin onayı bekleniyor' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listCertificates = async (req, res) => {
  try {
    const role = (req.user.role || '').toUpperCase()
    if (role !== 'ADMIN' && role !== 'SUPPORT') return res.status(403).json({ success: false, message: 'Yetkisiz' });
    const certs = await prisma.userCertificate.findMany({
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: certs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCertificateStatus = async (req, res) => {
  try {
    const role = (req.user.role || '').toUpperCase()
    if (role !== 'ADMIN' && role !== 'SUPPORT') return res.status(403).json({ success: false, message: 'Yetkisiz' });
    const { status, adminNote } = req.body; // status: APPROVED | REJECTED
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'status APPROVED veya REJECTED olmalı' });
    }
    const cert = await prisma.userCertificate.update({
      where: { id: req.params.id },
      data: { status, adminNote: adminNote || null, reviewedAt: new Date() },
    });

    // Push bildirim gönder
    if (status === 'APPROVED') {
      pushTo(cert.userId, '✅ Belgeniz Onaylandı!', 'Yüklediğiniz belge admin tarafından onaylandı.', { type: 'certificate', status: 'approved' });
    } else if (status === 'REJECTED') {
      pushTo(cert.userId, '❌ Belgeniz Reddedildi', adminNote ? `Sebep: ${adminNote}` : 'Yüklediğiniz belge reddedildi. Lütfen tekrar yükleyin.', { type: 'certificate', status: 'rejected' });
    }

    res.json({ success: true, data: cert });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
