import crypto from 'crypto'

const SHOPIER_API_BASE = 'https://api.shopier.com/v1'

const getPAT = () => process.env.SHOPIER_PAT || ''

const shopierFetch = async (path, method = 'GET', body = null) => {
  const pat = getPAT()
  if (!pat) throw Object.assign(new Error('Shopier PAT yapılandırılmamış.'), { status: 503 })

  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${SHOPIER_API_BASE}${path}`, opts)
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = data?.message || data?.error || `Shopier API hata: ${res.status}`
    throw Object.assign(new Error(msg), { status: res.status })
  }
  return data
}

/**
 * Shopier'de dijital ürün oluşturur.
 * customNote alanı ile userId'yi ürün açıklamasına gömer.
 * Dönen url → kullanıcıyı bu URL'ye yönlendiriyoruz.
 */
export const createProduct = async ({ amount, userId, orderId }) => {
  const product = await shopierFetch('/products', 'POST', {
    title: `Bakiye Yükleme ${amount} TL`,
    description: `UstaGo bakiye yükleme. Sipariş: ${orderId}`,
    type: 'digital',
    priceData: {
      currency: 'TRY',
      price: String(amount),
      shippingPrice: '0',
    },
    stockStatus: 'inStock',
    stockQuantity: 1,
    shippingPayer: 'sellerPays',
    customListing: false,
    customNote: `USTAGO|${userId}|${orderId}`,
    placementScore: 0,
  })
  return product
}

/**
 * Ürünü siler (ödeme sonrası temizlik).
 */
export const deleteProduct = async (productId) => {
  try {
    await shopierFetch(`/products/${productId}`, 'DELETE')
  } catch { /* silme hatası önemsiz */ }
}

/**
 * Webhook aboneliği oluşturur (order.created event'i).
 */
export const createWebhook = async (notificationUrl, event = 'order.created') => {
  return shopierFetch('/webhooks', 'POST', {
    event,
    url: notificationUrl,
  })
}

/**
 * Mevcut webhook aboneliklerini listeler.
 */
export const listWebhooks = async () => {
  return shopierFetch('/webhooks', 'GET')
}

/**
 * Shopier webhook imzasını doğrular.
 * Shopier-Signature header: HMAC-SHA256(body, webhook_token)
 * PAT kullanıcıları için webhook token = PAT kendisi.
 */
export const verifyWebhook = (rawBody, signatureHeader) => {
  const pat = getPAT()
  if (!pat || !signatureHeader || !rawBody) return false

  try {
    const expected = crypto
      .createHmac('sha256', pat)
      .update(rawBody)
      .digest('hex')
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signatureHeader, 'hex'),
    )
  } catch {
    return false
  }
}

/**
 * Order verisinden userId ve orderId çıkarır.
 * customNote format: USTAGO|{userId}|{orderId}
 * Eğer customNote yoksa buyer note'a bakar.
 */
export const parseOrderMeta = (order) => {
  const note = order?.buyerNote || ''
  // customNote ürün seviyesinde, lineItems üzerinden gelebilir
  const items = order?.lineItems || []
  for (const item of items) {
    const title = item?.title || ''
    // Ürün başlığından parse et
    const m = title.match(/Bakiye Yükleme (\d+(?:\.\d+)?) TL/)
    if (m) {
      return { amount: parseFloat(m[1]) }
    }
  }

  // note'tan parse
  const noteMatch = note.match(/USTAGO\|(.+?)\|(.+)/)
  if (noteMatch) {
    return { userId: noteMatch[1], orderId: noteMatch[2] }
  }

  return {}
}

/**
 * Sipariş detayını getirir.
 */
export const getOrder = async (orderId) => {
  return shopierFetch(`/orders/${orderId}`, 'GET')
}
