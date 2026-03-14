import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/** Kategori key'ini validate et: sadece BÜYÜK harf, rakam, alt çizgi */
const isValidCategoryKey = (key) =>
  typeof key === 'string' && /^[A-Z0-9_]{1,40}$/.test(key)

/** Tüm servisleri getir */
export const getAllServices = async () => {
  return prisma.service.findMany({ orderBy: { createdAt: 'asc' } })
}

/** Aktif servisleri getir (AI için) */
export const getActiveServices = async () => {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })
}

/** Kategori listesine göre servis fiyatlarını getir */
export const getServicesByCategories = async (categories) => {
  return prisma.service.findMany({
    where: { category: { in: categories }, isActive: true },
  })
}

const VALID_HOME_CATS = ['electric','plumbing','renovation','cleaning','painting','carpentry']

/** Yeni servis oluştur — whitelist yok, admin istediği hizmeti ekleyebilir */
export const createService = async ({ category, label, basePrice, homeCategory }) => {
  if (!isValidCategoryKey(category)) {
    throw new Error('Kategori kodu geçersiz (sadece büyük harf, rakam ve alt çizgi)')
  }
  return prisma.service.create({
    data: {
      category,
      label: label || category,
      basePrice: Number(basePrice),
      homeCategory: VALID_HOME_CATS.includes(homeCategory) ? homeCategory : null,
    },
  })
}

/** Servis güncelle */
export const updateService = async (id, { label, basePrice, isActive, homeCategory }) => {
  return prisma.service.update({
    where: { id },
    data: {
      ...(label        !== undefined && { label }),
      ...(basePrice    !== undefined && { basePrice: Number(basePrice) }),
      ...(isActive     !== undefined && { isActive }),
      ...(homeCategory !== undefined && { homeCategory: VALID_HOME_CATS.includes(homeCategory) ? homeCategory : null }),
    },
  })
}

/** Servis sil */
export const deleteService = async (id) => {
  return prisma.service.delete({ where: { id } })
}
