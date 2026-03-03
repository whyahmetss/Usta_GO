import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaClient } from '@prisma/client'
import {
  CATEGORY_WHITELIST,
  CATEGORY_LABELS,
  FALLBACK_CATEGORY,
} from '../constants/categories.js'
import { getServicesByCategories } from '../services/service.service.js'
import { successResponse } from '../utils/response.js'

const prisma = new PrismaClient()

// ── Prompt enjeksiyon önleme ────────────────────────────────────────
const sanitizeInput = (text) => {
  if (typeof text !== 'string') return ''
  return text
    .replace(/<[^>]*>/g, '')           // HTML strip
    .replace(/[{}[\]]/g, '')           // JSON chars
    .replace(/ignore|system|prompt|assistant|jailbreak/gi, '***')
    .trim()
    .slice(0, 500)                     // max 500 karakter
}

// ── Gece/gündüz çarpanı ────────────────────────────────────────────
const getNightMultiplier = () => {
  const hour = new Date().getHours()
  return hour >= 22 || hour < 8 ? 1.5 : 1.0
}

// ── Bölge çarpanı ──────────────────────────────────────────────────
const getRegionMultiplier = (address = '') => {
  const upper = address.toUpperCase()
  if (['KADIKOY', 'BESIKTAS', 'NISANTASI', 'LEVENT', 'ETILER'].some(z => upper.includes(z))) return 1.3
  if (['ESENYURT', 'SULTANBEYLI', 'SULTANGAZI'].some(z => upper.includes(z))) return 1.0
  return 1.15
}

// ── Gemini çağrısı ─────────────────────────────────────────────────
const classifyWithGemini = async (description) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY ayarlanmamış')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const categoryList = CATEGORY_WHITELIST.join(', ')

  const prompt = `Sen bir ev tamiri servis sınıflandırma motorusun.
Görevin YALNIZCA aşağıdaki kategorilerden seçim yapıp JSON döndürmektir.
KESİNLİKLE: fiyat üretme, teşhis koyma, öneri verme, açıklama yapma.
Sadece JSON döndür, başka hiçbir şey yazma.

Geçerli kategoriler: ${categoryList}

Kullanıcı açıklaması: "${description}"

Döndüreceğin JSON formatı (kesinlikle bu formattan çıkma):
{
  "categories": [
    {"category": "ENUM_DEĞER", "confidence": 0.0-1.0, "possibleCauses": ["neden1", "neden2"]}
  ],
  "isUrgent": false
}

Kurallar:
- En fazla 3 kategori seç
- confidence 0.4 altındaki kategorileri dahil etme
- possibleCauses en fazla 3 madde, teknik olmayan dilde
- isUrgent: yangın, duman, su baskını, elektrik çarpması gibi acil durumlar için true`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // JSON bloğu varsa temizle
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Gemini geçerli JSON döndürmedi')

  const parsed = JSON.parse(jsonMatch[0])
  return parsed
}

// ── Müşteri mesajı oluştur (Backend template) ──────────────────────
const buildCustomerMessage = (matchedServices, finalPrice, isUrgent) => {
  const labels = matchedServices.map(s => s.label).join(' ve ')
  const urgencyNote = isUrgent ? ' Acil servis talebi olarak önceliklendirileceğinizi belirtmek isteriz.' : ''

  return {
    giris: 'Talebinizi aldık ve teknik ekibimiz değerlendirdi.',
    gelisme: `Açıklamanız doğrultusunda ${labels} kapsamında hizmet gerektirdiği değerlendirildi. Uzman ustamız yerinde inceleme yaparak gerekli işlemleri gerçekleştirecektir.${urgencyNote}`,
    sonuc: `Tahmini hizmet bedeli ${finalPrice} TL'dir. Bu tutar, usta tarafından yerinde inceleme sonrası kesinleşecektir. Nihai ücret malzeme ve işçilik durumuna göre değişebilir.`,
  }
}

// ── Ana endpoint handler ───────────────────────────────────────────
export const analyzeJob = async (req, res, next) => {
  try {
    const rawDescription = req.body.description
    const rawAddress     = req.body.address || ''

    if (!rawDescription) {
      return res.status(400).json({ error: 'description zorunlu' })
    }

    const description = sanitizeInput(rawDescription)
    const address     = sanitizeInput(rawAddress)

    if (description.length < 5) {
      return res.status(400).json({ error: 'Açıklama çok kısa' })
    }

    // 1. Gemini sınıflandırma
    let aiResult
    try {
      aiResult = await classifyWithGemini(description)
    } catch (geminiErr) {
      console.error('Gemini error:', geminiErr.message)
      // Gemini hata verirse GENERAL fallback
      aiResult = {
        categories: [{ category: FALLBACK_CATEGORY, confidence: 0.5, possibleCauses: [] }],
        isUrgent: false,
      }
    }

    // 2. Kategori whitelist doğrulama
    const validCategories = (aiResult.categories || [])
      .filter(c => CATEGORY_WHITELIST.includes(c.category) && c.confidence >= 0.4)
      .slice(0, 3)

    if (validCategories.length === 0) {
      validCategories.push({ category: FALLBACK_CATEGORY, confidence: 0.5, possibleCauses: [] })
    }

    // 3. DB'den fiyat çek
    const categoryKeys = validCategories.map(c => c.category)
    const services = await getServicesByCategories(categoryKeys)

    // DB'de tanımlı olmayan kategoriler için GENERAL'a bak
    let matchedServices = services
    if (matchedServices.length === 0) {
      const generalService = await prisma.service.findFirst({
        where: { category: FALLBACK_CATEGORY, isActive: true },
      })
      if (generalService) matchedServices = [generalService]
    }

    // 4. Fiyat hesapla
    const baseTotal = matchedServices.reduce((sum, s) => sum + s.basePrice, 0) || 200
    const nightMultiplier  = getNightMultiplier()
    const urgencyMultiplier = aiResult.isUrgent ? 1.3 : 1.0
    const regionMultiplier = getRegionMultiplier(address)

    const finalPrice = Math.round(baseTotal * nightMultiplier * urgencyMultiplier * regionMultiplier)

    // 5. Müşteri mesajı (backend template — AI mesaj üretmiyor)
    const customerMessage = buildCustomerMessage(
      matchedServices.length > 0 ? matchedServices : [{ label: CATEGORY_LABELS[FALLBACK_CATEGORY] }],
      finalPrice,
      aiResult.isUrgent,
    )

    // 6. Kategorinin frontend label'ını belirle (job title için)
    const primaryCategory = validCategories[0].category
    const primaryLabel    = matchedServices[0]?.label || CATEGORY_LABELS[primaryCategory] || 'Genel Tamir'

    successResponse(res, {
      // AI çıktısı (sınıflandırma)
      categories: validCategories.map(c => ({
        category: c.category,
        label: CATEGORY_LABELS[c.category] || c.category,
        confidence: c.confidence,
        possibleCauses: c.possibleCauses || [],
      })),
      isUrgent: aiResult.isUrgent || false,

      // Fiyat detayı (backend hesaplaması)
      priceBreakdown: {
        services: matchedServices.map(s => ({ label: s.label, basePrice: s.basePrice })),
        baseTotal,
        nightMultiplier,
        urgencyMultiplier,
        regionMultiplier: Math.round(regionMultiplier * 100) / 100,
      },
      estimatedPrice: finalPrice,

      // Frontend gösterimi için
      primaryLabel,
      urgency: aiResult.isUrgent ? 'Yüksek' : 'Normal',
      customerMessage,
    })
  } catch (err) {
    next(err)
  }
}
