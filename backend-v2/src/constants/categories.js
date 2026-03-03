/**
 * Hizmet kategorileri — AI sınıflandırma için whitelist.
 * AI yalnızca bu enum değerlerini döndürebilir; bilinmeyenler GENERAL'a düşer.
 */
export const CATEGORY_WHITELIST = [
  'ELECTRICAL_SOCKET',
  'ELECTRICAL_CIRCUIT_BREAKER',
  'ELECTRICAL_LIGHTING',
  'ELECTRICAL_PANEL',
  'ELECTRICAL_WIRING',
  'PLUMBING_LEAK',
  'PLUMBING_DRAIN',
  'PLUMBING_INSTALLATION',
  'HVAC_AC',
  'PAINTING',
  'CARPENTRY',
  'GENERAL',
]

export const CATEGORY_LABELS = {
  ELECTRICAL_SOCKET:           'Priz Tamiri',
  ELECTRICAL_CIRCUIT_BREAKER:  'Sigorta / Kaçak Akım',
  ELECTRICAL_LIGHTING:         'Aydınlatma Montajı',
  ELECTRICAL_PANEL:            'Elektrik Panosu',
  ELECTRICAL_WIRING:           'Kablolama',
  PLUMBING_LEAK:               'Su Sızıntısı',
  PLUMBING_DRAIN:              'Tıkanıklık Açma',
  PLUMBING_INSTALLATION:       'Tesisat Montajı',
  HVAC_AC:                     'Klima Servis',
  PAINTING:                    'Boya / Badana',
  CARPENTRY:                   'Marangoz',
  GENERAL:                     'Genel Tamir',
}

/** Bilinmeyen kategori için güvenli fallback */
export const FALLBACK_CATEGORY = 'GENERAL'
