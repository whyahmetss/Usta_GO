import { getActiveServices } from '../services/service.service.js'
import { successResponse } from '../utils/response.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

// ── DeepSeek çağrısı — kategori + fiyat bandı + detay analizi ─────
// Döndürür: { category: 'MUSLUK_DEGISIMI', band: 'MID', needsInfo: false, infoQuestion: null }
const classifyWithDeepSeek = async (description, services) => {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY ayarlanmamış')

  const serviceList = services
    .map(s => {
      const range = (s.minPrice && s.maxPrice)
        ? ` [${s.minPrice}-${s.maxPrice} TL]`
        : s.basePrice ? ` [~${s.basePrice} TL]` : ''
      return `${s.category}: ${s.label}${range}`
    })
    .join('\n')

  const systemPrompt = `Sen bir ev hizmetleri fiyatlandırma asistanısın.
Kullanıcının talebini analiz et ve JSON formatında yanıt ver.

Görevin:
1. Hizmet listesinden EN UYGUN kategoriyi seç
2. Açıklamanın detay düzeyine göre fiyat bandını belirle:
   - LOW: Basit/küçük iş (tek priz, küçük sızıntı, ufak tamir)
   - MID: Orta ölçekli iş (birkaç priz, standart tamir)
   - HIGH: Büyük/karmaşık iş (çoklu nokta, uzun kablo, büyük alan, sistem değişimi)
3. Eğer fiyatı doğru hesaplamak için kritik bilgi eksikse (kaç metre? kaç adet? hangi oda?) needsInfo=true yap ve kısa Türkçe soru yaz

ÖNEMLİ KURALLAR:
- Açıklama anlaşılabiliyorsa mutlaka bir kategori seç, INSUFFICIENT yazma
- JSON dışında HİÇBİR şey yazma
- Yanıt formatı kesinlikle şu olmalı:
{"category":"KATEGORİ_KODU","band":"LOW|MID|HIGH","needsInfo":false,"infoQuestion":null}

Hizmet listesi:
${serviceList}`

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: description },
      ],
      max_tokens: 120,
      temperature: 0,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DeepSeek API hatası ${response.status}: ${err.slice(0, 100)}`)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content?.trim() || '{}'

  console.log('[AI] DeepSeek raw:', raw.slice(0, 200))

  try {
    const parsed = JSON.parse(raw)
    const category = (parsed.category || '').replace(/[^A-Z0-9_]/g, '').trim()
    const band = ['LOW','MID','HIGH'].includes(parsed.band) ? parsed.band : 'MID'
    const needsInfo = !!parsed.needsInfo
    const infoQuestion = needsInfo ? (parsed.infoQuestion || null) : null
    console.log('[AI] Parsed:', { category, band, needsInfo, infoQuestion })
    return { category, band, needsInfo, infoQuestion }
  } catch {
    // JSON parse hatası — raw'dan category çıkarmaya çalış
    const fallbackKey = raw.split(/[\s\n"]/)[0].replace(/[^A-Z0-9_]/g, '').trim()
    return { category: fallbackKey, band: 'MID', needsInfo: false, infoQuestion: null }
  }
}

// ── Band'a göre fiyat hesapla ───────────────────────────────────────
// minPrice/maxPrice varsa kullan, yoksa basePrice'tan türet
const calcBandPrice = (service, band) => {
  const base = service.basePrice || 0
  const min  = service.minPrice  ?? Math.round(base * 0.7)
  const max  = service.maxPrice  ?? Math.round(base * 1.5)

  if (band === 'LOW')  return min
  if (band === 'HIGH') return max
  return base  // MID
}

// ── Fiyat aralığını döndür ───────────────────────────────────────────
const getPriceRange = (service) => {
  const base = service.basePrice || 0
  return {
    min:  service.minPrice  ?? Math.round(base * 0.7),
    mid:  base,
    max:  service.maxPrice  ?? Math.round(base * 1.5),
  }
}

// ── Müşteri mesajı ──────────────────────────────────────────────────
const buildCustomerMessage = (serviceLabel, priceRange, bandPrice, isUrgent, band) => {
  const urgencyNote = isUrgent ? ' Acil servis talebi olarak önceliklendirileceğinizi belirtmek isteriz.' : ''
  const bandNote = band === 'HIGH'
    ? ' Açıklamanız kapsamlı bir iş gerektirdiğini gösteriyor.'
    : band === 'LOW'
    ? ' Açıklamanız küçük çaplı bir iş olduğunu gösteriyor.'
    : ''
  const rangeText = (priceRange.min !== priceRange.max)
    ? `${priceRange.min} - ${priceRange.max} TL arasında`
    : `yaklaşık ${bandPrice} TL`
  return {
    giris: 'Talebinizi aldık ve teknik ekibimiz değerlendirdi.',
    gelisme: `Açıklamanız doğrultusunda "${serviceLabel}" kapsamında hizmet gerektirdiği değerlendirildi.${bandNote} Uzman ustamız yerinde inceleme yaparak gerekli işlemleri gerçekleştirecektir.${urgencyNote}`,
    sonuc: `Tahmini hizmet bedeli ${rangeText}'dır. Kesin tutar usta tarafından yerinde inceleme sonrası belirlenir.`,
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

    // 2. DeepSeek ile sınıflandır — kategori + band + needsInfo
    let matchedCategory = fallbackService.category
    let band = 'MID'
    let needsInfo = false
    let infoQuestion = null
    let isUrgent = false
    let aiUsed = false
    let aiError = null

    try {
      const result = await classifyWithDeepSeek(description, activeServices)

      const found = activeServices.find(s => s.category === result.category)
      if (found) matchedCategory = found.category

      band        = result.band
      needsInfo   = result.needsInfo
      infoQuestion = result.infoQuestion

      const urgentWords = ['yangın', 'duman', 'su baskını', 'elektrik çarpma', 'gaz kokusu', 'patlama']
      isUrgent = urgentWords.some(w => description.toLowerCase().includes(w))
      aiUsed = true
    } catch (aiErr) {
      console.error('[AI] DeepSeek hatası:', aiErr.message)
      aiError = aiErr.message
    }

    // 3. Servisi bul
    const matchedService =
      activeServices.find(s => s.category === matchedCategory) || fallbackService

    // 4. Fiyat hesapla (band + çarpanlar)
    const nightMultiplier   = getNightMultiplier()
    const urgencyMultiplier = isUrgent ? 1.3 : 1.0
    const regionMultiplier  = getRegionMultiplier(address)

    const priceRange   = getPriceRange(matchedService)
    const bandPrice    = calcBandPrice(matchedService, band)
    const finalPrice   = Math.round(bandPrice * nightMultiplier * urgencyMultiplier * regionMultiplier)
    const finalMin     = Math.round(priceRange.min * nightMultiplier * urgencyMultiplier * regionMultiplier)
    const finalMax     = Math.round(priceRange.max * nightMultiplier * urgencyMultiplier * regionMultiplier)

    // 5. Müşteri mesajı
    const displayRange   = { min: finalMin, max: finalMax }
    const customerMessage = buildCustomerMessage(matchedService.label, displayRange, finalPrice, isUrgent, band)

    successResponse(res, {
      primaryLabel: matchedService.label,
      category:     matchedService.category,
      isUrgent,
      urgency:      isUrgent ? 'Yüksek' : 'Normal',
      band,
      needsInfo,
      infoQuestion,
      priceBreakdown: {
        basePrice:        matchedService.basePrice,
        minPrice:         matchedService.minPrice ?? null,
        maxPrice:         matchedService.maxPrice ?? null,
        band,
        bandPrice,
        nightMultiplier,
        urgencyMultiplier,
        regionMultiplier: Math.round(regionMultiplier * 100) / 100,
      },
      estimatedPrice: finalPrice,
      priceMin:       finalMin,
      priceMax:       finalMax,
      customerMessage,
      aiUsed,
      aiError,
    })
  } catch (err) {
    next(err)
  }
}

// ── Canlı Destek AI Yanıtı ─────────────────────────────────────────────
export const supportChatAI = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ success: false, error: 'Mesaj boş olamaz' })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        error: 'AI servisi yapılandırılmamış',
        reply: 'Yardım talebiniz alınmıştır, en kısa sürede ilgili destek ekibi sizinle iletişime geçecektir. Lütfen sohbeti sonlandırmayınız.',
      })
    }

    const systemPrompt = `Sen Usta Go uygulamasının müşteri destek asistanısın.
Görevin: Kullanıcıların sorularını yanıtlamak, sorunlarını çözmek, uygulama hakkında bilgi vermek.

Uygulama hakkında:
- Usta Go: Elektrik, su tesisatı, klima, beyaz eşya tamiri gibi ev hizmetleri sunan bir platform
- Müşteriler iş talebi oluşturur, ustalar kabul eder, iş tamamlanınca ödeme yapılır
- Canlı destek, mesajlaşma, cüzdan, iş takibi gibi özellikler var

Kurallar:
- Kısa, net, Türkçe cevap ver (max 2-3 cümle)
- Samimi ve profesyonel ol
- Teknik sorunlarda "destek ekibimiz inceleyecek" de
- Ödeme/para iadesi konularında "yetkili ekip 1 iş günü içinde dönüş yapacak" de
- Kullanıcı kızgınsa özür dile ve anlayışlı ol
- Emoji kullanma`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map(m => ({
        role: m.isUser ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: sanitizeInput(message) },
    ]

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: 200,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`DeepSeek API hatası: ${err.slice(0, 100)}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || 'Anlayamadım, lütfen tekrar açıklar mısınız?'

    res.json({ success: true, reply })
  } catch (err) {
    console.error('[AI Support] Error:', err)
    res.status(500).json({
      success: false,
      error: err.message,
      reply: 'Yardım talebiniz alınmıştır, en kısa sürede ilgili destek ekibi sizinle iletişime geçecektir.',
    })
  }
}
