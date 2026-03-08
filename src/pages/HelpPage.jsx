import { useNavigate } from 'react-router-dom'
import { Search, MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

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
    <div className="bg-gray-50">
      <PageHeader title="Yardım & Destek" onBack={() => navigate(-1)} />

      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="mb-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cevap ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
            />
          </div>
        </div>

        <div className="space-y-3 mb-8">
          {filtered.map((faq, idx) => (
            <details key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden group">
              <summary className="px-4 py-4 cursor-pointer hover:bg-gray-50 font-bold text-gray-900 flex items-center gap-2 list-none [&::-webkit-details-marker]:hidden">
                <HelpCircle size={18} className="text-primary-500" />
                <span className="flex-1">{faq.q}</span>
              </summary>
              <div className="px-4 pb-4 pt-0 text-gray-600 bg-gray-50 border-t border-gray-100">
                <p className="pt-3">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>

        <Card padding="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Yine de Yardıma mı İhtiyacınız Var?</h3>
          <p className="text-gray-600 mb-4">Doğrudan bizimle iletişime geçin</p>

          <div className="space-y-3">
            <a
              href="mailto:support@ustagochannel.com"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition border border-gray-100"
            >
              <Mail size={20} className="text-primary-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">E-posta Gönder</p>
                <p className="text-xs text-gray-500">support@ustagochannel.com</p>
              </div>
            </a>
            <a
              href="tel:+905324445566"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition border border-gray-100"
            >
              <Phone size={20} className="text-primary-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Ara</p>
                <p className="text-xs text-gray-500">+90 535 273 7638</p>
              </div>
            </a>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <MessageCircle size={20} className="text-primary-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Canlı Sohbet</p>
                <p className="text-xs text-gray-500">Pazartesi-Pazar, 09:00-23:00</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default HelpPage
