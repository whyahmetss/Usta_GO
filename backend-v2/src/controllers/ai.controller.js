import { GoogleGenerativeAI } from '@google/generative-ai'
import { getActiveServices } from '../services/service.service.js'
import { successResponse } from '../utils/response.js'

// ── Prompt enjeksiyon önleme ────────────────────────────────────────
const sanitizeInput = (text) => {
  if (typeof text !== 'string') return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[{}[\]]/g, '')
    .replace(/ignore|system|prompt|assistant|jailbreak/gi, '***')
    .trim()
    .slice(0, 500)
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

// ── Gemini çağrısı — DB'deki gerçek kategorilerle çalışır ──────────
const classifyWithGemini = async (description, services) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY ayarlanmamış')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  // Sadece aktif servislerin kategori kodu + Türkçe adını ver
  const serviceList = services
    .map(s => `${s.category}: ${s.label}`)
    .join('\n')

  const prompt = `Kullanıcı bir ev tamir sorunu bildirdi.
Aşağıdaki hizmet listesinden EN UYGUN birini seç.
SADECE kategori kodunu yaz, başka hiçbir şey yazma.

Hizmet listesi:
${serviceList}

Kullanıcı açıklaması: ${description}

Yanıtın (SADECE kategori kodu, örnek: ELECTRICAL_SOCKET):`

  const result = await model.generateContent(prompt)
  const raw = result.response.text().trim()

  // Sadece ilk satırı al, boşluk/özel karakter temizle
  const categoryKey = raw.split(/[\s\n]/)[0].replace(/[^A-Z0-9_]/g, '').trim()

  console.log('[AI] Gemini raw:', raw.slice(0, 100))
  console.log('[AI] Parsed key:', categoryKey)

  return categoryKey
}

// ── Müşteri mesajı oluştur ──────────────────────────────────────────
const buildCustomerMessage = (serviceLabel, finalPrice, isUrgent) => {
  const urgencyNote = isUrgent ? ' Acil servis talebi olarak önceliklendirileceğinizi belirtmek isteriz.' : ''
  return {
    giris: 'Talebinizi aldık ve teknik ekibimiz değerlendirdi.',
    gelisme: `Açıklamanız doğrultusunda "${serviceLabel}" kapsamında hizmet gerektirdiği değerlendirildi. Uzman ustamız yerinde inceleme yaparak gerekli işlemleri gerçekleştirecektir.${urgencyNote}`,
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
      return res.status(400).json({ error: 'Açıklama çok kısa (en az 5 karakter)' })
    }

    // 1. DB'den aktif servisleri çek
    const activeServices = await getActiveServices()

    if (activeServices.length === 0) {
      return res.status(503).json({ error: 'Henüz hizmet tanımlı değil. Admin panelinden ekleyin.' })
    }

    // GENERAL veya ilk servis fallback olarak kullanılacak
    const fallbackService =
      activeServices.find(s => s.category === 'GENERAL') || activeServices[0]

    // 2. Gemini ile sınıflandır
    let matchedCategory = fallbackService.category
    let isUrgent = false
    try {
      const key = await classifyWithGemini(description, activeServices)
      const found = activeServices.find(s => s.category === key)
      if (found) matchedCategory = found.category
      // Acil durum tespiti (basit keyword)
      const urgentWords = ['yangın', 'duman', 'su baskını', 'elektrik çarpma', 'gaz kokusu', 'patlama']
      isUrgent = urgentWords.some(w => description.toLowerCase().includes(w))
    } catch (geminiErr) {
      console.error('[AI] Gemini hatası:', geminiErr.message)
      // Gemini hata verirse fallback service kullanılır (zaten set)
    }

    // 3. Eşleşen servisi bul
    const matchedService =
      activeServices.find(s => s.category === matchedCategory) || fallbackService

    // 4. Fiyat hesapla
    const basePrice        = matchedService.basePrice
    const nightMultiplier  = getNightMultiplier()
    const urgencyMultiplier = isUrgent ? 1.3 : 1.0
    const regionMultiplier = getRegionMultiplier(address)
    const finalPrice = Math.round(basePrice * nightMultiplier * urgencyMultiplier * regionMultiplier)

    // 5. Müşteri mesajı
    const customerMessage = buildCustomerMessage(matchedService.label, finalPrice, isUrgent)

    successResponse(res, {
      primaryLabel: matchedService.label,
      category: matchedService.category,
      isUrgent,
      urgency: isUrgent ? 'Yüksek' : 'Normal',

      priceBreakdown: {
        basePrice,
        nightMultiplier,
        urgencyMultiplier,
        regionMultiplier: Math.round(regionMultiplier * 100) / 100,
      },
      estimatedPrice: finalPrice,
      customerMessage,
    })
  } catch (err) {
    next(err)
  }
}
