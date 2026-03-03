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

// ── DeepSeek çağrısı — DB'deki gerçek kategorilerle çalışır ────────
const classifyWithDeepSeek = async (description, services) => {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY ayarlanmamış')

  const serviceList = services
    .map(s => `${s.category}: ${s.label}`)
    .join('\n')

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Kullanıcı bir ev tamir sorunu bildirdi.
Aşağıdaki hizmet listesinden EN UYGUN birini seç.
SADECE kategori kodunu yaz, başka hiçbir şey yazma.

Hizmet listesi:
${serviceList}`,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      max_tokens: 30,
      temperature: 0,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DeepSeek API hatası ${response.status}: ${err.slice(0, 100)}`)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content?.trim() || ''

  // Sadece kategori kodunu al (A-Z, 0-9, _)
  const categoryKey = raw.split(/[\s\n]/)[0].replace(/[^A-Z0-9_]/g, '').trim()

  console.log('[AI] DeepSeek raw:', raw.slice(0, 80))
  console.log('[AI] Parsed key:', categoryKey)

  return categoryKey
}

// ── Açıklamadan adet/miktar çıkar ──────────────────────────────────
const extractQuantity = (text) => {
  // "3 priz", "üç tane", "iki adet" gibi ifadeleri yakala
  const wordMap = { bir: 1, iki: 2, üç: 3, uc: 3, dört: 4, dort: 4, beş: 5, bes: 5,
                    altı: 6, alti: 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10 }
  const lower = text.toLowerCase()

  // Önce rakam + birim: "3 priz", "2 tane", "4 adet"
  const numMatch = lower.match(/(\d+)\s*(tane|adet|priz|lamba|ampul|kablo|devre|sigort[ae]|valf|musluk|batarya|radyatör|panel)?/)
  if (numMatch && parseInt(numMatch[1]) > 1 && parseInt(numMatch[1]) <= 20) {
    return parseInt(numMatch[1])
  }

  // Sonra yazıyla: "üç priz", "iki tane"
  for (const [word, val] of Object.entries(wordMap)) {
    const re = new RegExp(`\\b${word}\\b\\s*(tane|adet|priz|lamba|ampul|kablo|devre)?`)
    if (re.test(lower) && val > 1) return val
  }

  return 1
}

// ── Müşteri mesajı ──────────────────────────────────────────────────
const buildCustomerMessage = (serviceLabel, finalPrice, isUrgent) => {
  const urgencyNote = isUrgent ? ' Acil servis talebi olarak önceliklendirileceğinizi belirtmek isteriz.' : ''
  return {
    giris: 'Talebinizi aldık ve teknik ekibimiz değerlendirdi.',
    gelisme: `Açıklamanız doğrultusunda "${serviceLabel}" kapsamında hizmet gerektirdiği değerlendirildi. Uzman ustamız yerinde inceleme yaparak gerekli işlemleri gerçekleştirecektir.${urgencyNote}`,
    sonuc: `Tahmini hizmet bedeli ${finalPrice} TL'dir. Bu tutar, usta tarafından yerinde inceleme sonrası kesinleşecektir. Nihai ücret malzeme ve işçilik durumuna göre değişebilir.`,
  }
}

// ── Ana endpoint ───────────────────────────────────────────────────
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

    const fallbackService =
      activeServices.find(s => s.category === 'GENERAL') || activeServices[0]

    // 2. DeepSeek ile sınıflandır
    let matchedCategory = fallbackService.category
    let isUrgent = false
    try {
      const key = await classifyWithDeepSeek(description, activeServices)
      const found = activeServices.find(s => s.category === key)
      if (found) matchedCategory = found.category
      const urgentWords = ['yangın', 'duman', 'su baskını', 'elektrik çarpma', 'gaz kokusu', 'patlama']
      isUrgent = urgentWords.some(w => description.toLowerCase().includes(w))
    } catch (aiErr) {
      console.error('[AI] DeepSeek hatası:', aiErr.message)
    }

    // 3. Servisi bul
    const matchedService =
      activeServices.find(s => s.category === matchedCategory) || fallbackService

    // 4. Fiyat hesapla
    const basePrice         = matchedService.basePrice
    const quantity          = extractQuantity(description)
    const nightMultiplier   = getNightMultiplier()
    const urgencyMultiplier = isUrgent ? 1.3 : 1.0
    const regionMultiplier  = getRegionMultiplier(address)
    const finalPrice = Math.round(basePrice * quantity * nightMultiplier * urgencyMultiplier * regionMultiplier)

    // 5. Müşteri mesajı
    const customerMessage = buildCustomerMessage(matchedService.label, finalPrice, isUrgent)

    successResponse(res, {
      primaryLabel: matchedService.label,
      category:     matchedService.category,
      isUrgent,
      urgency: isUrgent ? 'Yüksek' : 'Normal',
      priceBreakdown: {
        basePrice,
        quantity,
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
