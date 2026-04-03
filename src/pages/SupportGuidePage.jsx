import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import {
  MessageCircle, UserCheck, AlertCircle, FileText, Shield,
  Clock, CheckCircle2, XCircle, Headphones, Star, Zap,
} from 'lucide-react'

const sections = [
  {
    icon: Headphones,
    title: 'Canlı Destek Akışı',
    color: 'blue',
    items: [
      'Müşteri "Canlı Destek" butonuna bastığında otomatik olarak uygun bir destek ajanına yönlendirilir.',
      'Destek çevrimdışıysa AI Asistan devreye girer ve müşteriye yardımcı olur.',
      'Mesajlar gerçek zamanlı (Socket.IO) iletilir. Sayfayı yenilemeden mesaj alırsınız.',
      'Sohbet bittiğinde müşteri "Kapat" butonuyla sohbeti sonlandırır ve puan verir.',
    ],
  },
  {
    icon: UserCheck,
    title: 'Usta Onay Süreci',
    color: 'emerald',
    items: [
      'Yeni kaydolan ustalar "Bekleyen Başvurular" sekmesinde görünür.',
      'Usta belgelerini (kimlik, sertifika, adli sicil vb.) kontrol edin.',
      'Onaylanan usta hemen iş alabilir hale gelir.',
      'Reddedilen ustaya red bildirimi gönderilir.',
    ],
  },
  {
    icon: AlertCircle,
    title: 'Şikayet Yönetimi',
    color: 'amber',
    items: [
      'Şikayetler "Şikayetler" sekmesinde listelenir.',
      '"Şikayet Eden" etiketi kimin şikayet açtığını gösterir.',
      '"Çözüldü" veya "Reddet" butonlarıyla şikayeti sonuçlandırın.',
      'Ciddi durumlarda admin panelinden kullanıcıyı banlayabilirsiniz.',
    ],
  },
  {
    icon: FileText,
    title: 'Belge Kontrolü',
    color: 'purple',
    items: [
      'Belgeler sekmesinden usta belgelerini görüntüleyebilirsiniz.',
      'Kimlik ön/arka, mesleki sertifika, ikametgah, adli sicil belgelerini kontrol edin.',
      'Belge üzerine tıklayarak tam boyutlu görüntüleyebilirsiniz.',
    ],
  },
  {
    icon: MessageCircle,
    title: 'Mesajlaşma',
    color: 'cyan',
    items: [
      'Mesajlar sekmesinden tüm destek konuşmalarını görebilirsiniz.',
      'Konuşmaya tıklayarak sohbet sayfasına geçersiniz.',
      'Fotoğraf ve dosya gönderebilirsiniz (📎 butonu).',
      'AI mesajları mor arka planla, sistem mesajları kırmızı bannerla gösterilir.',
    ],
  },
  {
    icon: Shield,
    title: 'Önemli Kurallar',
    color: 'rose',
    items: [
      'Müşteri bilgilerini asla üçüncü kişilerle paylaşmayın.',
      'Kaba veya uygunsuz mesajlar gönderen kullanıcıları raporlayın.',
      'Teknik sorunlarda admin ekibine yönlendirin.',
      'Çevrimdışı olduğunuzda AI Asistan devreye girer.',
    ],
  },
]

const colorMap = {
  blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
  cyan: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

export default function SupportGuidePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0d0d]">
      <PageHeader title="Destek Kılavuzu" onBack={() => navigate(-1)} />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {sections.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="bg-white dark:bg-[#141414] rounded-2xl border border-slate-200 dark:border-white/[0.07] shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-white/5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[s.color]}`}>
                  <Icon size={20} />
                </div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">{s.title}</h2>
              </div>
              <ul className="p-4 space-y-2.5">
                {s.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-slate-300 dark:text-slate-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
