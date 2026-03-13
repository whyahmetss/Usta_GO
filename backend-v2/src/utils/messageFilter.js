/**
 * Güvenlik amaçlı mesaj içerik filtresi.
 * Telefon numarası, e-posta, sosyal medya/WhatsApp linkleri ve küfür içerenleri yakalar.
 */

// Türkçe / Türklerin kullandığı yaygın küfür kelimeleri (kısmi liste)
const PROFANITY_LIST = [
  'orospu', 'oç', 'piç', 'göt', 'amk', 'amına', 'sik', 'sikiş', 'sikik',
  'orospu çocuğu', 'yarrak', 'meme', 'memeye', 'şerefsiz', 'ibne', 'bok',
  'boktan', 'kahpe', 'fahişe', 'puşt',
]

// Telefon no pattern: 05xx xxx xx xx, +90, 00 90 vb.
const PHONE_REGEX = /(\+?90|00\s?90)?[\s\-]?(\(0\d{2,3}\)|0\d{2,3})[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g

// E-posta pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+\s*@\s*[a-zA-Z0-9.\-]+\s*\.\s*[a-zA-Z]{2,}/g

// Harici link / sosyal medya / WhatsApp
const LINK_REGEX = /(https?:\/\/|www\.|wa\.me|whatsapp|instagram\.com|t\.me|telegram|tiktok|twitter|facebook|fb\.com)/gi

/**
 * Mesajı analiz eder.
 * @returns {{ blocked: boolean, reason: string|null, sanitized: string }}
 */
export const analyzeMessage = (content = '') => {
  if (!content || typeof content !== 'string') {
    return { blocked: false, reason: null, sanitized: content }
  }

  const lower = content.toLowerCase()

  // Küfür kontrolü
  for (const word of PROFANITY_LIST) {
    if (lower.includes(word)) {
      return {
        blocked: true,
        reason: 'Mesajınız uygunsuz ifade içeriyor. Lütfen saygılı bir dil kullanın.',
        sanitized: content,
      }
    }
  }

  // Telefon numarası
  if (PHONE_REGEX.test(content)) {
    PHONE_REGEX.lastIndex = 0
    return {
      blocked: true,
      reason: 'Güvenliğiniz için iletişim bilgisi (telefon no) mesaj üzerinden paylaşılamaz.',
      sanitized: content,
    }
  }

  // E-posta
  if (EMAIL_REGEX.test(content)) {
    EMAIL_REGEX.lastIndex = 0
    return {
      blocked: true,
      reason: 'Güvenliğiniz için iletişim bilgisi (e-posta) mesaj üzerinden paylaşılamaz.',
      sanitized: content,
    }
  }

  // Harici link / WhatsApp / sosyal medya
  if (LINK_REGEX.test(content)) {
    LINK_REGEX.lastIndex = 0
    return {
      blocked: true,
      reason: 'Güvenliğiniz için harici link ve sosyal medya bilgisi mesaj üzerinden paylaşılamaz.',
      sanitized: content,
    }
  }

  return { blocked: false, reason: null, sanitized: content }
}
