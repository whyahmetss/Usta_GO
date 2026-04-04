import { getActiveServices } from '../services/service.service.js'
import { successResponse } from '../utils/response.js'
import prisma from '../utils/prisma.js'

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

// ── DeepSeek çağrısı — çoklu sorun desteği ──────────────────────────
// Döndürür: { items: [{ category, band, needsInfo, infoQuestion }] }
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
1. Kullanıcının açıklamasında KAÇ FARKLI İŞ/SORUN varsa HER BİRİNİ ayrı ayrı belirle
2. Her sorun için hizmet listesinden EN UYGUN kategoriyi seç
3. Her sorun için işin büyüklüğüne göre fiyat bandını belirle:
   - LOW: Basit/küçük iş (tek priz, küçük sızıntı, ufak tamir)
   - MID: Orta ölçekli iş (birkaç priz, standart tamir)
   - HIGH: Büyük/karmaşık iş (çoklu nokta, uzun kablo, büyük alan, sistem değişimi)
4. Eğer fiyatı doğru hesaplamak için kritik bilgi eksikse needsInfo=true yap

ÖNEMLİ KURALLAR:
- Açıklamada birden fazla sorun varsa (örn: "musluk akıyor, priz çalışmıyor, kapı kırık") her birini AYRI item olarak döndür
- Aynı kategorideki birden fazla iş de ayrı item olsun (örn: "3 musluk tamiri" = 3 item)
- Tekrarlı adet belirtilmişse (örn: "5 priz") count alanını kullan
- JSON dışında HİÇBİR şey yazma
- Yanıt formatı:
{"items":[{"category":"KOD","band":"LOW|MID|HIGH","count":1,"needsInfo":false,"infoQuestion":null}]}

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
      max_tokens: 300,
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

  try {
    const parsed = JSON.parse(raw)
    // Çoklu items formatı
    if (Array.isArray(parsed.items) && parsed.items.length > 0) {
      return {
        items: parsed.items.map(item => ({
          category: (item.category || '').replace(/[^A-Z0-9_]/g, '').trim(),
          band: ['LOW','MID','HIGH'].includes(item.band) ? item.band : 'MID',
          count: Math.max(1, Math.min(10, parseInt(item.count) || 1)),
          needsInfo: !!item.needsInfo,
          infoQuestion: item.needsInfo ? (item.infoQuestion || null) : null,
        }))
      }
    }
    // Eski tekli format fallback
    const category = (parsed.category || '').replace(/[^A-Z0-9_]/g, '').trim()
    const band = ['LOW','MID','HIGH'].includes(parsed.band) ? parsed.band : 'MID'
    const needsInfo = !!parsed.needsInfo
    const infoQuestion = needsInfo ? (parsed.infoQuestion || null) : null
    return { items: [{ category, band, count: 1, needsInfo, infoQuestion }] }
  } catch {
    const fallbackKey = raw.split(/[\s\n"]/)[0].replace(/[^A-Z0-9_]/g, '').trim()
    return { items: [{ category: fallbackKey, band: 'MID', count: 1, needsInfo: false, infoQuestion: null }] }
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
    sonuc: `Bu ücret platformdaki ustalara gösterilecektir. Usta kabul ederse işe gider, reddederse talep bir sonraki ustaya iletilir.`,
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

    // 1. Kullanıcı bakiyesini çek
    let userBalance = 0
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { balance: true } })
      userBalance = Number(dbUser?.balance) || 0
    } catch {}

    // 2. DB'den aktif servisleri çek
    const activeServices = await getActiveServices()

    if (activeServices.length === 0) {
      return res.status(503).json({ error: 'Henüz hizmet tanımlı değil. Admin panelinden ekleyin.' })
    }

    const fallbackService =
      activeServices.find(s => s.category === 'GENERAL') || activeServices[0]

    // 2. DeepSeek ile sınıflandır — çoklu sorun desteği
    let aiItems = [{ category: fallbackService.category, band: 'MID', count: 1, needsInfo: false, infoQuestion: null }]
    let isUrgent = false
    let aiUsed = false
    let aiError = null

    try {
      const result = await classifyWithDeepSeek(description, activeServices)
      if (result.items && result.items.length > 0) aiItems = result.items

      const urgentWords = ['yangın', 'duman', 'su baskını', 'elektrik çarpma', 'gaz kokusu', 'patlama']
      isUrgent = urgentWords.some(w => description.toLowerCase().includes(w))
      aiUsed = true
    } catch (aiErr) {
      console.error('[AI] DeepSeek hatası:', aiErr.message)
      aiError = aiErr.message
    }

    // 3. Çarpanlar
    const nightMultiplier   = getNightMultiplier()
    const urgencyMultiplier = isUrgent ? 1.3 : 1.0
    const regionMultiplier  = getRegionMultiplier(address)
    const multiplier = nightMultiplier * urgencyMultiplier * regionMultiplier

    // 4. Her item için fiyat hesapla
    let totalPrice = 0
    let totalMin = 0
    let totalMax = 0
    let anyNeedsInfo = false
    let firstInfoQuestion = null

    const itemDetails = aiItems.map(item => {
      const svc = activeServices.find(s => s.category === item.category) || fallbackService
      const bandPrice = calcBandPrice(svc, item.band)
      const range = getPriceRange(svc)
      const count = item.count || 1
      const itemPrice = Math.round(bandPrice * multiplier * count)
      const itemMin = Math.round(range.min * multiplier * count)
      const itemMax = Math.round(range.max * multiplier * count)

      totalPrice += itemPrice
      totalMin += itemMin
      totalMax += itemMax

      if (item.needsInfo) {
        anyNeedsInfo = true
        if (!firstInfoQuestion) firstInfoQuestion = item.infoQuestion
      }

      return {
        label: svc.label,
        category: svc.category,
        band: item.band,
        count,
        bandPrice,
        itemPrice,
        itemMin,
        itemMax,
      }
    })

    // 5. Birincil hizmet (en pahalı item)
    const primaryItem = itemDetails.reduce((a, b) => a.itemPrice >= b.itemPrice ? a : b, itemDetails[0])

    // 6. Müşteri mesajı
    const itemCount = itemDetails.length
    const displayRange = { min: totalMin, max: totalMax }

    let gelisme = ''
    if (itemCount === 1) {
      const bandNote = primaryItem.band === 'HIGH' ? ' Açıklamanız kapsamlı bir iş gerektirdiğini gösteriyor.' :
                       primaryItem.band === 'LOW' ? ' Açıklamanız küçük çaplı bir iş olduğunu gösteriyor.' : ''
      gelisme = `Açıklamanız doğrultusunda "${primaryItem.label}" kapsamında hizmet gerektirdiği değerlendirildi.${bandNote}`
    } else {
      const labels = itemDetails.map(i => `${i.label}${i.count > 1 ? ` (×${i.count})` : ''}`).join(', ')
      gelisme = `Açıklamanızda ${itemCount} farklı hizmet tespit edildi: ${labels}. Her biri ayrı fiyatlandırılmıştır.`
    }
    if (isUrgent) gelisme += ' Acil servis talebi olarak önceliklendirileceğinizi belirtmek isteriz.'
    gelisme += ' Uzman ustamız yerinde inceleme yaparak gerekli işlemleri gerçekleştirecektir.'

    const customerMessage = {
      giris: 'Talebinizi aldık ve teknik ekibimiz değerlendirdi.',
      gelisme,
      sonuc: 'Bu ücret platformdaki ustalara gösterilecektir. Usta kabul ederse işe gider, reddederse talep bir sonraki ustaya iletilir.',
    }

    successResponse(res, {
      primaryLabel: primaryItem.label,
      category:     primaryItem.category,
      isUrgent,
      urgency:      isUrgent ? 'Yüksek' : 'Normal',
      band:         primaryItem.band,
      needsInfo:    anyNeedsInfo,
      infoQuestion: firstInfoQuestion,
      items:        itemDetails,
      priceBreakdown: {
        basePrice:        primaryItem.bandPrice,
        band:             primaryItem.band,
        nightMultiplier,
        urgencyMultiplier,
        regionMultiplier: Math.round(regionMultiplier * 100) / 100,
        itemCount,
      },
      estimatedPrice: totalPrice,
      priceMin:       totalMin,
      priceMax:       totalMax,
      customerMessage,
      userBalance,
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
- Canlı destek, mesajlaşma, hizmet hesabı, iş takibi gibi özellikler var

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
