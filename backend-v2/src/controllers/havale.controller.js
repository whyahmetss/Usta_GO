import prisma from '../utils/prisma.js'

const IBAN   = process.env.HAVALE_IBAN   || ''
const AD     = process.env.HAVALE_AD     || 'UstaGo'
const BANKA  = process.env.HAVALE_BANKA  || ''

const genRef = () => `UGO-${Math.floor(1000 + Math.random() * 9000)}`

// GET /wallet/havale/bilgi — IBAN/Banka bilgilerini döner
export const havaleBilgi = (req, res) => {
  res.json({
    success: true,
    data: {
      iban:  IBAN || '—',
      ad:    AD   || '—',
      banka: BANKA || '—',
    },
  })
}

// POST /wallet/havale/talep — müşteri havale talebi oluşturur
export const havaleTalep = async (req, res) => {
  try {
    const { tutar } = req.body
    if (!tutar || Number(tutar) < 10)
      return res.status(400).json({ success: false, error: 'Minimum 10 TL yükleyebilirsiniz' })

    // Benzersiz referans kodu üret
    let referansKodu
    let attempts = 0
    do {
      referansKodu = genRef()
      const existing = await prisma.bakiyeTalebi.findUnique({ where: { referansKodu } })
      if (!existing) break
      attempts++
    } while (attempts < 10)

    const talep = await prisma.bakiyeTalebi.create({
      data: {
        userId:      req.user.id,
        tutar:       Number(tutar),
        referansKodu,
        durum:       'BEKLIYOR',
      },
    })

    res.json({
      success: true,
      data: {
        referansKodu,
        tutar:  Number(tutar),
        iban:   IBAN,
        ad:     AD,
        banka:  BANKA,
        talepId: talep.id,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /wallet/havale/taleplerim — kullanıcının kendi talepleri
export const taleplerim = async (req, res) => {
  try {
    const talepler = await prisma.bakiyeTalebi.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    })
    res.json({ success: true, data: talepler })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /wallet/havale/admin/talepler — admin tüm talepleri görür
export const adminTalepler = async (req, res) => {
  try {
    const durum = req.query.durum // BEKLIYOR | ONAYLANDI | REDDEDILDI | undefined
    const talepler = await prisma.bakiyeTalebi.findMany({
      where:   durum ? { durum } : {},
      orderBy: { createdAt: 'desc' },
      take:    200,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    })
    res.json({ success: true, data: talepler })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// PATCH /wallet/havale/admin/:id/onayla — admin onaylar, bakiye eklenir
export const adminOnayla = async (req, res) => {
  try {
    const talep = await prisma.bakiyeTalebi.findUnique({ where: { id: req.params.id } })
    if (!talep) return res.status(404).json({ success: false, error: 'Talep bulunamadı' })
    if (talep.durum !== 'BEKLIYOR')
      return res.status(400).json({ success: false, error: 'Bu talep zaten işleme alındı' })

    await prisma.$transaction([
      prisma.bakiyeTalebi.update({
        where: { id: talep.id },
        data:  { durum: 'ONAYLANDI', adminNot: req.body.not || null },
      }),
      prisma.user.update({
        where: { id: talep.userId },
        data:  { balance: { increment: talep.tutar } },
      }),
      prisma.transaction.create({
        data: {
          userId:      talep.userId,
          amount:      talep.tutar,
          type:        'TOPUP',
          status:      'COMPLETED',
          description: `Havale/EFT: ${talep.referansKodu} (${talep.tutar} TL)`,
        },
      }),
    ])

    res.json({ success: true, message: `${talep.tutar} TL bakiye eklendi` })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// PATCH /wallet/havale/admin/:id/reddet — admin reddeder
export const adminReddet = async (req, res) => {
  try {
    const talep = await prisma.bakiyeTalebi.findUnique({ where: { id: req.params.id } })
    if (!talep) return res.status(404).json({ success: false, error: 'Talep bulunamadı' })
    if (talep.durum !== 'BEKLIYOR')
      return res.status(400).json({ success: false, error: 'Bu talep zaten işleme alındı' })

    await prisma.bakiyeTalebi.update({
      where: { id: talep.id },
      data:  { durum: 'REDDEDILDI', adminNot: req.body.not || null },
    })

    res.json({ success: true, message: 'Talep reddedildi' })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
