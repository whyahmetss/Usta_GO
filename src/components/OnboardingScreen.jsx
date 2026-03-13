import { useState } from 'react'
import { Wrench, Star, Shield, ChevronRight, CheckCircle } from 'lucide-react'

const slides = [
  {
    icon: Wrench,
    color: 'from-blue-500 to-blue-700',
    badge: 'bg-blue-100 text-blue-600',
    title: 'Ustanı Kolayca Bul',
    desc: 'Elektrik, su tesisatı, boya, tadilat… Aklına gelen her iş için yakınındaki profesyonel ustayı saniyeler içinde bul.',
  },
  {
    icon: Star,
    color: 'from-amber-400 to-orange-500',
    badge: 'bg-amber-100 text-amber-600',
    title: 'Güvenilir & Değerlendirilmiş',
    desc: 'Her usta; kimlik doğrulaması ve müşteri puanlamasından geçer. En kaliteli hizmeti güvenle al.',
  },
  {
    icon: Shield,
    color: 'from-emerald-500 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-600',
    title: 'Güvenli Ödeme',
    desc: 'İş tamamlandıktan sonra öde. Ödemen kilitli tutulur, ustaya ancak sen onayladıktan sonra aktarılır.',
  },
  {
    icon: CheckCircle,
    color: 'from-purple-500 to-indigo-600',
    badge: 'bg-purple-100 text-purple-600',
    title: 'Hazırsın!',
    desc: 'Hemen başla, ilk işini oluştur veya usta olarak kayıt ol. Usta Go seninle!',
  },
]

export default function OnboardingScreen({ onDone }) {
  const [current, setCurrent] = useState(0)
  const [exiting, setExiting] = useState(false)

  const goNext = () => {
    if (current < slides.length - 1) {
      setExiting(true)
      setTimeout(() => {
        setCurrent((c) => c + 1)
        setExiting(false)
      }, 220)
    } else {
      handleDone()
    }
  }

  const handleDone = () => {
    localStorage.setItem('ug_onboarding_done', '1')
    onDone?.()
  }

  const slide = slides[current]
  const Icon = slide.icon

  return (
    <div className="fixed inset-0 z-[9998] bg-white dark:bg-[#0a1628] flex flex-col items-center justify-between px-6 py-10 select-none">

      {/* Atla butonu */}
      <div className="w-full flex justify-end">
        <button
          onClick={handleDone}
          className="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 font-medium py-1 px-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          Atla
        </button>
      </div>

      {/* İkon kartı */}
      <div className={`transition-all duration-220 ${exiting ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}
        style={{ transitionDuration: '220ms' }}>

        <div className={`w-40 h-40 rounded-[40px] bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-2xl mx-auto mb-8`}>
          <Icon size={72} color="white" strokeWidth={1.5} />
        </div>

        {/* Sayfa numarası rozeti */}
        <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${slide.badge} mx-auto mb-4`}
          style={{ display: 'flex', width: 'fit-content' }}>
          <span>{current + 1} / {slides.length}</span>
        </div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-3 leading-tight">
          {slide.title}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm leading-relaxed max-w-xs mx-auto">
          {slide.desc}
        </p>
      </div>

      {/* Alt alan: noktalar + buton */}
      <div className="w-full flex flex-col items-center gap-6">
        {/* Nokta indikatör */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (i < current + 1) setCurrent(i) }}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-white/20'}`}
            />
          ))}
        </div>

        {/* İleri / Başla butonu */}
        <button
          onClick={goNext}
          className={`w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all duration-150 bg-gradient-to-r ${slide.color}`}
        >
          {current < slides.length - 1 ? (
            <>İleri <ChevronRight size={20} /></>
          ) : (
            <>Başla <CheckCircle size={20} /></>
          )}
        </button>
      </div>
    </div>
  )
}
