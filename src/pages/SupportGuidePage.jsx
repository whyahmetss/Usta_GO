import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import {
  ArrowLeft, ChevronDown, ChevronUp, Search,
  CreditCard, MapPin, Shield, Clock, Star, AlertTriangle,
  UserX, MessageCircle, RefreshCw, Smartphone, Key, Ban,
} from 'lucide-react'

const GUIDES = [
  {
    category: 'Ödeme Sorunları',
    icon: CreditCard,
    color: 'from-emerald-400 to-teal-500',
    items: [
      {
        title: 'Müşteri "param gelmedi" diyor',
        steps: [
          'Cüzdan geçmişini kontrol et: Profil → Cüzdan → İşlem Geçmişi',
          'İş durumunu kontrol et: İş completed/rated mı?',
          'Ödeme beklemede ise müşteriye 1 iş günü süreceğini bildir',
          'Sorun devam ederse admin panelden manuel ödeme tetikle',
        ],
        tags: ['ödeme', 'cüzdan', 'para', 'havale'],
      },
      {
        title: 'Usta ücretini alamıyor',
        steps: [
          'İş durumunu kontrol et: Müşteri onaylamış mı?',
          'pending_approval ise müşteriye onay hatırlatması gönder',
          'Onaylıysa cüzdan bakiyesini kontrol et',
          'IBAN bilgisi doğru mu? Profil → Banka Bilgileri',
          'Sorun devam ederse admin panelden çekim talebini kontrol et',
        ],
        tags: ['usta', 'ücret', 'ödeme', 'çekim', 'IBAN'],
      },
      {
        title: 'Çift ödeme / yanlış tutar',
        steps: [
          'Admin Panel → İşlemler → İlgili işi bul',
          'Cüzdan hareketlerini karşılaştır',
          'Yanlış işlem varsa admin panelden iade başlat',
          'Müşteriyi bilgilendir: "İade 3-5 iş günü içinde hesabınıza yansıyacaktır"',
        ],
        tags: ['iade', 'çift ödeme', 'yanlış tutar'],
      },
    ],
  },
  {
    category: 'İş Takibi Sorunları',
    icon: MapPin,
    color: 'from-blue-400 to-indigo-500',
    items: [
      {
        title: 'Usta yola çıktı ama konum güncellenmiyor',
        steps: [
          'Ustanın konum izni açık mı kontrol et (telefondan)',
          'Uygulamayı kapatıp açmasını öner',
          'GPS sinyali zayıfsa Wi-Fi\'ı da açmasını öner',
          'Sorun devam ederse ustayı arayıp durumu öğren',
        ],
        tags: ['konum', 'GPS', 'harita', 'canlı takip'],
      },
      {
        title: 'İş "in_progress" ama usta gelmiyor',
        steps: [
          'Ustaya mesaj gönder: Ne zaman varacak?',
          '30+ dk geçtiyse ustayı ara',
          'Usta ulaşılamıyorsa müşteriyi bilgilendir',
          'Gerekirse işi iptal et ve yeni usta ata',
        ],
        tags: ['gecikme', 'usta gelmiyor', 'bekleme'],
      },
      {
        title: 'İş tamamlandı ama müşteri onaylamıyor',
        steps: [
          'Müşteriye bildirim gönder: "İşinizi onaylayın"',
          'İş detayında fotoğrafları kontrol et',
          'Müşteriyi ara ve durumu sor',
          '48 saat geçtiyse otomatik onay devreye girer (admin ayarı)',
        ],
        tags: ['onay', 'pending_approval', 'bekliyor'],
      },
    ],
  },
  {
    category: 'Hesap Sorunları',
    icon: Shield,
    color: 'from-purple-400 to-violet-500',
    items: [
      {
        title: 'Kullanıcı giriş yapamıyor',
        steps: [
          'E-posta/telefon doğru mu kontrol et',
          'Şifre sıfırlama linki gönder',
          'Hesap bloklu mu? Admin Panel → Kullanıcılar → Durum',
          'USTA hesabı onay bekliyor olabilir → Başvuru durumunu kontrol et',
        ],
        tags: ['giriş', 'login', 'şifre', 'blok'],
      },
      {
        title: 'Usta belgesi reddedildi, tekrar yüklemek istiyor',
        steps: [
          'Red sebebini kullanıcıya bildir',
          'Yeni belge yüklemesi için: Profil → Belgelerim → Yeniden Yükle',
          'Belge kalitesinin yeterli olduğundan emin ol (net, okunabilir)',
          'Destek panelinden belge durumunu "PENDING" yapabilirsin',
        ],
        tags: ['belge', 'sertifika', 'red', 'onay'],
      },
      {
        title: 'Kullanıcı hesabını silmek istiyor',
        steps: [
          'Aktif işi var mı kontrol et — varsa önce tamamlanmalı',
          'Cüzdan bakiyesi var mı? Varsa önce çekim yapılmalı',
          'Admin Panel → Kullanıcılar → Hesap Sil (soft delete)',
          'KVKK gereği 30 gün içinde tamamen silinecektir bilgisini ver',
        ],
        tags: ['hesap silme', 'KVKK', 'delete'],
      },
    ],
  },
  {
    category: 'Şikayet Yönetimi',
    icon: AlertTriangle,
    color: 'from-amber-400 to-orange-500',
    items: [
      {
        title: 'Müşteri ustadan şikayetçi',
        steps: [
          'Şikayet detayını oku: Ne olmuş?',
          'İş fotoğraflarını kontrol et',
          'Ustanın geçmiş şikayetlerini kontrol et (tekrar eden mi?)',
          'Haklı bulunursa: İade + Ustaya uyarı',
          'Ağır durumlarda: Usta hesabını askıya al',
        ],
        tags: ['şikayet', 'müşteri', 'usta', 'kötü iş'],
      },
      {
        title: 'Usta müşteriden şikayetçi',
        steps: [
          'Şikayet detayını oku',
          'Mesaj geçmişini kontrol et (hakaret, tehdit?)',
          'Müşteriye uyarı gönder',
          'Tekrar eden şikayetlerde müşteri hesabına kısıtlama koy',
        ],
        tags: ['usta şikayet', 'müşteri davranış'],
      },
      {
        title: 'İptal cezası itirazı',
        steps: [
          'İptal sebebini incele',
          'Ceza miktarını kontrol et: accepted=30TL, in_progress=100TL',
          'Haklı sebep varsa (acil sağlık, doğal afet) cezayı iptal et',
          'Admin Panel → Cüzdan → Manuel İade',
        ],
        tags: ['ceza', 'iptal', 'itiraz', 'iade'],
      },
    ],
  },
  {
    category: 'Teknik Sorunlar',
    icon: Smartphone,
    color: 'from-rose-400 to-pink-500',
    items: [
      {
        title: 'Uygulama açılmıyor / çöküyor',
        steps: [
          'Cihaz ve OS versiyonunu sor',
          'Uygulamayı kapatıp açmayı dene',
          'Cache temizle: Ayarlar → Uygulamalar → UstaGO → Veriyi Temizle',
          'Güncelleme var mı kontrol et (App Store / Play Store)',
          'Sorun devam ederse ekran kaydı isteyip geliştirici ekibine ilet',
        ],
        tags: ['çökme', 'bug', 'hata', 'teknik'],
      },
      {
        title: 'Bildirim gelmiyor',
        steps: [
          'Bildirim izni açık mı? Ayarlar → Bildirimler → UstaGO',
          'Pil tasarruf modu kapalı mı?',
          'Arka plan uygulama yenileme açık mı?',
          'Xiaomi/Huawei ise: Oto başlatma izni gerekli',
        ],
        tags: ['bildirim', 'notification', 'push'],
      },
      {
        title: 'Fotoğraf yüklenemiyor',
        steps: [
          'Kamera / depolama izni açık mı?',
          'İnternet bağlantısını kontrol et',
          'Dosya boyutu 10MB altında mı?',
          'Farklı fotoğraf dene (bozuk dosya olabilir)',
        ],
        tags: ['fotoğraf', 'yükleme', 'upload', 'kamera'],
      },
    ],
  },
]

export default function SupportGuidePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [openItems, setOpenItems] = useState({})

  const toggle = (key) => setOpenItems(prev => ({ ...prev, [key]: !prev[key] }))

  const filtered = search.trim()
    ? GUIDES.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
          item.steps.some(s => s.toLowerCase().includes(search.toLowerCase()))
        ),
      })).filter(cat => cat.items.length > 0)
    : GUIDES

  return (
    <Layout hideNav>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 pt-10 pb-6 px-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)}
              className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <ArrowLeft size={18} className="text-white" />
            </button>
            <div>
              <h1 className="text-lg font-black text-white">Destek Kılavuzu</h1>
              <p className="text-xs text-indigo-200">Sık karşılaşılan sorunlar ve çözümleri</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sorun ara... (ödeme, konum, belge...)"
              className="w-full pl-10 pr-4 py-2.5 bg-white/15 backdrop-blur border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-20">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Search size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">Sonuç bulunamadı</p>
            <p className="text-xs text-gray-400 mt-1">Farklı anahtar kelimelerle arayın</p>
          </div>
        )}

        {filtered.map((cat) => (
          <div key={cat.category}>
            {/* Category header */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                <cat.icon size={16} className="text-white" />
              </div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">{cat.category}</h2>
              <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{cat.items.length}</span>
            </div>

            {/* Items */}
            <div className="space-y-2 ml-2">
              {cat.items.map((item, idx) => {
                const key = `${cat.category}-${idx}`
                const isOpen = openItems[key]
                return (
                  <div key={key} className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-white/[0.07] overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                    >
                      <span className="text-sm font-semibold text-gray-800 dark:text-white pr-2">{item.title}</span>
                      {isOpen ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/5 pt-3">
                        <ol className="space-y-2">
                          {item.steps.map((step, si) => (
                            <li key={si} className="flex gap-2.5 text-sm">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {si + 1}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 leading-snug">{step}</span>
                            </li>
                          ))}
                        </ol>
                        {item.tags && (
                          <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-gray-50 dark:border-white/5">
                            {item.tags.map(tag => (
                              <span key={tag} className="text-[10px] bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
