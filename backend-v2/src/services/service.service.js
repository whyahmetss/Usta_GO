import { PrismaClient } from '@prisma/client'
import { CATEGORY_WHITELIST, CATEGORY_LABELS } from '../constants/categories.js'

const prisma = new PrismaClient()

/** Tüm servisleri getir (aktif/pasif ayrımı opsiyonel) */
export const getAllServices = async (onlyActive = false) => {
  return prisma.service.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: { category: 'asc' },
  })
}

/** Kategori listesine göre servis fiyatlarını getir */
export const getServicesByCategories = async (categories) => {
  return prisma.service.findMany({
    where: {
      category: { in: categories },
      isActive: true,
    },
  })
}

/** Yeni servis oluştur */
export const createService = async ({ category, label, basePrice }) => {
  if (!CATEGORY_WHITELIST.includes(category)) {
    throw new Error(`Geçersiz kategori: ${category}`)
  }
  return prisma.service.create({
    data: {
      category,
      label: label || CATEGORY_LABELS[category] || category,
      basePrice: Number(basePrice),
    },
  })
}

/** Servis güncelle */
export const updateService = async (id, { label, basePrice, isActive }) => {
  return prisma.service.update({
    where: { id },
    data: {
      ...(label    !== undefined && { label }),
      ...(basePrice !== undefined && { basePrice: Number(basePrice) }),
      ...(isActive  !== undefined && { isActive }),
    },
  })
}

/** Servis sil */
export const deleteService = async (id) => {
  return prisma.service.delete({ where: { id } })
}
