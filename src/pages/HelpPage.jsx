import { useNavigate } from 'react-router-dom'
import { Search, MessageCircle, Mail, Phone, HelpCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

const ALL_FAQS = [
  // ── Genel ──
  { cat: 'Genel', q: 'UstaGo Nedir?', a: 'UstaGo, hizmet almak isteyen kullanıcılar ile güvenilir ve doğrulanmış ustaları yapay zeka destekli teklif sistemi üzerinden buluşturan güvenilir bir platformdur.' },
  { cat: 'Genel', q: 'UstaGo hangi şehirlerde hizmet veriyor?', a: 'Şu an yalnızca İstanbul\'da hizmet veriyoruz. Yakında diğer büyükşehirlere de açılmayı planlıyoruz.' },
  { cat: 'Genel', q: 'UstaGo güvenli midir?', a: 'Evet. Tüm ustalar kimlik ve belge doğrulamasından geçer. Yapay zeka destekli yorum analizi, puanlama sistemi ve işlem kayıtları ile güvenli bir deneyim sunuyoruz.' },
  { cat: 'Genel', q: 'UstaGo\'yu kullanmak için ücret ödenir mi?', a: 'Kayıt olmak ve talep oluşturmak tamamen ücretsizdir. Sadece kabul edilen iş için ödeme yaparsınız.' },
  { cat: 'Genel', q: 'Hangi hizmet kategorileri var?', a: 'Elektrik, tesisat, tadilat, temizlik, boyacı, marangoz ve daha fazlası. Yeni kategoriler sürekli eklenmektedir.' },

  // ── Müşteri ──
  { cat: 'Müşteri', q: 'Nasıl iş talebi oluştururum?', a: 'Ana sayfada "+" butonuna basın, sorununuzu yazın, adresinizi girin. AI analiz edip fiyat belirler. Onaylayınca iş açılır ve uygun ustalara gönderilir.' },
  { cat: 'Müşteri', q: 'Talep oluşturmak ücretli mi?', a: 'Hayır, talep oluşturmak tamamen ücretsizdir. Ödeme sadece iş kabul edildiğinde gerçekleşir.' },
  { cat: 'Müşteri', q: 'Teklifleri kabul etmek zorunda mıyım?', a: 'Hayır. Gelen teklifleri inceleyip dilediğinizi kabul edebilir veya reddedebilirsiniz. Hiçbir zorunluluk yoktur.' },
  { cat: 'Müşteri', q: 'İşi iptal edebilir miyim?', a: 'İş başlamadan önce ücretsiz iptal hakkınız vardır. İş başladıktan sonra iptal politikamız uygulanır ve kısmi ücret yansıyabilir.' },
  { cat: 'Müşteri', q: 'Ustayı nasıl değerlendiririm?', a: 'İş tamamlandıktan sonra 1-5 yıldız puanlama ve yorum bırakabilirsiniz. Bu değerlendirmeler diğer kullanıcılara yardımcı olur.' },
  { cat: 'Müşteri', q: 'Şikayet nasıl yapabilirim?', a: 'İş detay sayfasında "Şikayet Et" butonuna basarak şikayetinizi iletebilirsiniz. Destek ekibimiz en kısa sürede inceleyecektir.' },
  { cat: 'Müşteri', q: 'Ustanın gerçek adresimi görmesini istemiyorum.', a: 'Usta işi kabul etmeden önce adresiniz sadece mahalle/semt seviyesinde gösterilir. Tam adres yalnızca iş kabul edildikten sonra paylaşılır.' },
  { cat: 'Müşteri', q: 'AI fiyat analizi nasıl çalışır?', a: 'Sorununuzu açıkladığınızda yapay zeka, hizmet türünü, kapsamını ve bölgenizi analiz ederek piyasa fiyatlarına uygun bir tahmini fiyat belirler.' },
  { cat: 'Müşteri', q: 'Fotoğraf yüklemek zorunlu mu?', a: 'Hayır, zorunlu değil ama fotoğraf eklemek ustanın sorunu daha iyi anlamasını sağlar ve daha doğru fiyat teklifi almanıza yardımcı olur.' },

  // ── Usta ──
  { cat: 'Usta', q: 'UstaGo\'da usta olmak ücretli mi?', a: 'Usta olarak kayıt olmak tamamen ücretsizdir. İş almak için herhangi bir abonelik veya kayıt ücreti ödemeniz gerekmez.' },
  { cat: 'Usta', q: 'Usta olarak nasıl kayıt olurum?', a: 'Kayıt formunu doldurun, uzmanlık alanınızı seçin, kimlik belgesi ve varsa mesleki sertifikanızı yükleyin. Admin onayından sonra iş almaya başlayabilirsiniz.' },
  { cat: 'Usta', q: 'Usta doğrulamayı nasıl sağlarım?', a: 'Ayarlar > Doğrulama kısmından kimlik, adli sicil kaydı ve mesleki sertifikanızı yükleyin. Admin onayı sonrası "Doğrulanmış" rozeti alırsınız.' },
  { cat: 'Usta', q: 'Eksik belge yüklersem ne olur?', a: 'Kritik belgeler (kimlik, adli sicil) onaylanmadan hesabınız iş almaya açılmaz. Eksik belgeleri sonradan Ayarlar sayfasından yükleyebilirsiniz.' },
  { cat: 'Usta', q: 'İş haritası nasıl çalışır?', a: 'Harita sayfasında yakınınızdaki bekleyen işleri görebilirsiniz. İşe tıklayıp detaylarını görüntüleyebilir ve kabul edebilirsiniz.' },
  { cat: 'Usta', q: 'Komisyon oranı nedir?', a: 'Platform, her iş için brüt kazançtan %12 komisyon keser. Bu oran şeffaf şekilde çekim dökümünde gösterilir.' },
  { cat: 'Usta', q: 'Vergi stopajı nedir?', a: 'Vergi levhası olmayan bireysel ustalara %20 gelir vergisi stopajı kesilir. Vergi levhanız varsa Ayarlar > Vergi Durumu\'ndan belirtebilirsiniz, stopaj %0 olur.' },
  { cat: 'Usta', q: 'Vergi levhası toggle\'ını nasıl açarım?', a: 'Kayıt sırasında veya sonradan vergi levhanızı yükleyin. Admin onayladıktan sonra Ayarlar > Vergi Durumu\'ndaki switch aktif hale gelir.' },
  { cat: 'Usta', q: 'Para çekme nasıl yapılır?', a: 'Profil > Cüzdan > Para Çek kısmından IBAN\'ınıza transfer talep edebilirsiniz. Minimum çekim tutarı 100 TL\'dir. İşlem süresi 1-3 iş günüdür.' },
  { cat: 'Usta', q: 'İş Alma Durumu (aktif/pasif) ne işe yarar?', a: 'Aktif olduğunuzda yeni iş teklifleri alırsınız. Pasife alırsanız yeni iş gönderilmez ama mevcut işlerinize devam edebilirsiniz.' },

  // ── Ödeme & Cüzdan ──
  { cat: 'Ödeme', q: 'Hangi ödeme yöntemleri kabul ediliyor?', a: 'Kredi kartı, banka kartı ve havale/EFT ile ödeme yapabilirsiniz. Tüm ödemeler iyzico güvenli altyapısı üzerinden gerçekleşir.' },
  { cat: 'Ödeme', q: 'Hizmet kredisi nedir?', a: 'Hizmet kredisi, hesabınıza yüklediğiniz ön ödemeli bakiyedir. İş talebi oluşturduğunuzda bu bakiyeden düşülür.' },
  { cat: 'Ödeme', q: 'İade alabilir miyim?', a: 'İş başlamadan iptal ederseniz ödemeniz bakiyenize iade edilir. Diğer iade talepleri destek ekibimiz tarafından 1-3 iş günü içinde değerlendirilir.' },
  { cat: 'Ödeme', q: 'Kupon nasıl kullanırım?', a: 'İş oluşturma sırasında aktif kuponlarınız otomatik gösterilir. Kullanmak istediğiniz kuponu seçerek fiyattan düşebilirsiniz.' },

  // ── Referans & Kupon ──
  { cat: 'Referans', q: 'Referans sisteminde ne kazanırım?', a: 'Arkadaşınızı davet edin, kaydolunca her biriniz ₺50 kupon kazanırsınız. Kupon bir sonraki işinizde geçerlidir.' },
  { cat: 'Referans', q: 'Referans kodumu nerede bulurum?', a: 'Profil sayfanızda referans kodunuz ve paylaşım linkiniz bulunur. Kopyalayıp arkadaşlarınızla paylaşabilirsiniz.' },

  // ── Hesap & Güvenlik ──
  { cat: 'Hesap', q: 'Şifremi unuttum, ne yapmalıyım?', a: 'Giriş ekranında "Şifremi Unuttum" bağlantısına tıklayın. E-posta adresinize şifre sıfırlama bağlantısı gönderilecektir.' },
  { cat: 'Hesap', q: 'Hesabımı nasıl silebilirim?', a: 'Ayarlar > Hesabı Sil kısmından hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.' },
  { cat: 'Hesap', q: 'Profil bilgilerimi nasıl güncellerim?', a: 'Profil sayfanızdan adınızı, telefon numaranızı, biyografinizi ve profil fotoğrafınızı güncelleyebilirsiniz.' },
  { cat: 'Hesap', q: 'Bildirimler neden gelmiyor?', a: 'Telefon ayarlarından UstaGo bildirimlerinin açık olduğundan emin olun. Ayrıca uygulama içi Ayarlar\'dan bildirim tercihlerinizi kontrol edin.' },
  { cat: 'Hesap', q: 'Karanlık mod nasıl açılır?', a: 'Ayarlar sayfasında tema seçeneğinden karanlık modu aktif edebilirsiniz. Sistem temasını takip etme seçeneği de mevcuttur.' },

  // ── Destek ──
  { cat: 'Destek', q: 'Canlı destek saatleri nedir?', a: 'Canlı destek hattımız Pazartesi-Pazar 09:00-23:00 saatleri arasında aktiftir. Bu saatler dışında mesaj bırakabilirsiniz.' },
  { cat: 'Destek', q: 'Destek talebi ne kadar sürede cevaplanır?', a: 'Canlı destek anlık, e-posta talepleri ise en geç 24 saat içinde yanıtlanır.' },
  { cat: 'Destek', q: 'Uygulama çöktü/hata alıyorum, ne yapmalıyım?', a: 'Uygulamayı kapatıp tekrar açmayı deneyin. Sorun devam ederse Yardım > Canlı Sohbet\'ten destek ekibimize ulaşın ve hatanın ekran görüntüsünü paylaşın.' },
]

const INITIAL_COUNT = 5

function HelpPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const isSearching = search.trim().length > 0
  const filtered = ALL_FAQS.filter(faq =>
    faq.q.toLowerCase().includes(search.toLowerCase()) ||
    faq.a.toLowerCase().includes(search.toLowerCase()) ||
    faq.cat.toLowerCase().includes(search.toLowerCase())
  )
  const displayed = isSearching || showAll ? filtered : filtered.slice(0, INITIAL_COUNT)

  return (
    <div className="bg-gray-50 dark:bg-[#0F172A]">
      <PageHeader title="Yardım & Destek" onBack={() => navigate(-1)} />

      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Sorununuzu yazın... (ör: ödeme, iptal, usta, şifre)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </div>
          {isSearching && (
            <p className="text-xs text-gray-400 mt-2 ml-1">
              {filtered.length} sonuç bulundu
            </p>
          )}
        </div>

        {/* FAQ List */}
        <div className="space-y-3 mb-4">
          {displayed.length === 0 && (
            <div className="text-center py-8">
              <HelpCircle size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Sonuç bulunamadı</p>
              <p className="text-xs text-gray-400 mt-1">Farklı kelimelerle aramayı deneyin veya canlı destekle iletişime geçin.</p>
            </div>
          )}
          {displayed.map((faq, idx) => (
            <details key={idx} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-card overflow-hidden group">
              <summary className="px-4 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#273548] font-bold text-gray-900 dark:text-white flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                <HelpCircle size={18} className="text-primary-500 flex-shrink-0" />
                <span className="flex-1 text-[14px]">{faq.q}</span>
                <ChevronDown size={16} className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <div className="px-4 pb-4 pt-0 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#0F172A]/50 border-t border-gray-200 dark:border-gray-700">
                <p className="pt-3 text-sm leading-relaxed">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Show All / Show Less */}
        {!isSearching && filtered.length > INITIAL_COUNT && (
          <button
            onClick={() => setShowAll(prev => !prev)}
            className="w-full py-3 text-center text-sm font-semibold text-primary-500 hover:text-primary-600 transition mb-6"
          >
            {showAll ? 'Daha az göster' : `Tüm ${ALL_FAQS.length} soruyu göster ↓`}
          </button>
        )}

        {/* Contact */}
        <Card padding="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Yine de Yardıma mı İhtiyacınız Var?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Doğrudan bizimle iletişime geçin</p>

          <div className="space-y-3">
            <a
              href="mailto:mail@usta-go.com"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#0F172A] rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a2540] transition border border-gray-200 dark:border-gray-700"
            >
              <Mail size={20} className="text-primary-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">E-posta Gönder</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">mail@usta-go.com</p>
              </div>
            </a>
            <a
              href="tel:+905352737638"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-[#0F172A] rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a2540] transition border border-gray-200 dark:border-gray-700"
            >
              <Phone size={20} className="text-primary-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Ara</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">+90 535 273 7638</p>
              </div>
            </a>
            <button
              onClick={() => navigate('/live-support')}
              className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition w-full text-left active:scale-[0.99]"
            >
              <MessageCircle size={20} className="text-blue-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Canlı Sohbet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pazartesi-Pazar, 09:00-23:00</p>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default HelpPage
