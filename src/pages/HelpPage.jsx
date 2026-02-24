import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, MessageCircle, Mail, Phone } from 'lucide-react'
import { useState } from 'react'

function HelpPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const faqs = [
    {
      q: 'Usta bulma nasıl çalışıyor?',
      a: 'Yeni bir iş talebinde sorunuzu açıklayın, AI fiyat tahmin eder, ustalara gönderilir ve teklif verirler.'
    },
    {
      q: 'İş ücretim nasıl ödenir?',
      a: 'İş kabul edilince paranız escrow\'da tutulur, tamamlandığında ustaya gönderilir, müşteri puanladığında.'
    },
    {
      q: 'İş iptal edebilir miyim?',
      a: 'Evet, işin statüsüne göre iptal etme seçeneği vardır. Tamamlanmışsa para iade edilmez.'
    },
    {
      q: 'Referans sisteminde ne kazanırım?',
      a: 'Arkadaşınızı davet edin, kaydolunca her biriniz ₺50 kupon alırsınız.'
    },
    {
      q: 'Kuponlar ne kadar geçerli?',
      a: 'Kuponlar 1 yıl boyunca geçerlidir. Profil→Cüzdan\'da aktif kuponlarınız görebilirsiniz.'
    },
    {
      q: 'Şikayet nasıl yapabilirim?',
      a: 'İş detayında "Şikayet Et" butonuyla hızlı şikayet yapabilirsiniz. Admin tarafından incelenecektir.'
    },
    {
      q: 'Bölgesel fiyat farklılığı nedir?',
      a: 'Premium bölgeler (Kadıköy, Beşiktaş) +30%, diğer bölgeler standart fiyatla hizmet verir.'
    },
    {
      q: 'Usta doğrulamayı nasıl sağlarım?',
      a: 'Ayarlar→Doğrulama\'da ehliyet/sertifika yükleyin, admin onayı sonrası "Doğrulanmış" rozeti alırsınız.'
    }
  ]

  const filtered = faqs.filter(faq =>
    faq.q.toLowerCase().includes(search.toLowerCase()) ||
    faq.a.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="blue-gradient-bg pb-6 pt-4 px-4">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">Yardım & Destek</h1>
            <p className="text-white/80 text-sm">Sorularınız, Cevaplarımız</p>
          </div>
        </div>

        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
          <input
            type="text"
            placeholder="Cevap ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-3 mb-8">
          {filtered.map((faq, idx) => (
            <details key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <summary className="px-4 py-4 cursor-pointer hover:bg-gray-50 font-bold text-gray-900 flex items-center gap-2">
                <span className="text-lg">❓</span>
                <span className="flex-1">{faq.q}</span>
              </summary>
              <div className="px-4 pb-4 text-gray-600 bg-gray-50 border-t border-gray-200">
                <p>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Yine de Yardıma mı İhtiyacınız Var?</h3>
          <p className="text-white/90 mb-4">Doğrudan bizimle iletişime geçin</p>

          <div className="space-y-3">
            <a href="mailto:support@ustagochannel.com" className="flex items-center gap-3 p-4 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition">
              <Mail size={20} />
              <div>
                <p className="text-sm font-semibold">E-posta Gönder</p>
                <p className="text-xs text-white/80">support@ustagochannel.com</p>
              </div>
            </a>
            <a href="tel:+905324445566" className="flex items-center gap-3 p-4 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition">
              <Phone size={20} />
              <div>
                <p className="text-sm font-semibold">Ara</p>
                <p className="text-xs text-white/80">+90 535 273 7638</p>
              </div>
            </a>
            <div className="flex items-center gap-3 p-4 bg-white/20 backdrop-blur rounded-xl">
              <MessageCircle size={20} />
              <div>
                <p className="text-sm font-semibold">Canlı Sohbet</p>
                <p className="text-xs text-white/80">Pazartesi-Pazar, 09:00-23:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpPage
