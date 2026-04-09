import { useState } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'

const slides = [
  {
    image: '/onboarding/1-ev.png',
    title: 'UstaGo ile Tüm Ev İşleri\nKontrol Altında',
    subtitle: 'Tüm ustalar burada',
    desc: 'Boyacıdan, elektrikçiye, tesisatçıdan temizlikçiye… Aradığınız tüm ustalar burada.',
  },
  {
    image: '/onboarding/2-usta.png',
    title: 'Sadece En İyi Ustalar',
    subtitle: 'Performans garantili',
    desc: 'Her usta, titizlikle seçilir ve onaylanır. Sizin için en iyi performansı garanti ediyoruz.',
  },
  {
    image: '/onboarding/3-guvenli.png',
    title: 'Güvenli İşlem Garantisi',
    subtitle: 'Paranız güvende',
    desc: 'İş tamamlanana kadar paranız güvende. UstaGo ile sorunsuz ve güvenli hizmetin tadını çıkarın.',
  },
  {
    image: '/onboarding/4-cozum.png',
    title: 'Size Özel Çözümler',
    subtitle: 'Kişiselleştirilmiş deneyim',
    desc: 'Profilinizi oluşturun, ihtiyaçlarınızı belirtin ve size en uygun ustaları hemen bulun.',
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
      }, 280)
    } else {
      handleDone()
    }
  }

  const handleDone = () => {
    localStorage.setItem('ug_onboarding_done', '1')
    onDone?.()
  }

  const slide = slides[current]
  const isLast = current === slides.length - 1

  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center select-none overflow-hidden"
      style={{ fontFamily: "'Inter', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif", backgroundColor: '#ffffff', colorScheme: 'light' }}>

      {/* Top bar */}
      <div className="w-full flex items-center justify-between px-6 pt-[max(env(safe-area-inset-top),12px)] pb-2 mt-2">
        <div className="flex items-center gap-2 opacity-40">
          <span className="text-[11px] font-medium tracking-widest text-gray-400 uppercase">{current + 1} / {slides.length}</span>
        </div>
        {!isLast && (
          <button
            onClick={handleDone}
            className="text-[13px] text-gray-400 hover:text-gray-600 font-medium py-1.5 px-4 rounded-full hover:bg-gray-50 transition-all"
          >
            Atla
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full px-6 mt-1">
        <div className="h-[3px] bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0A66C2] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((current + 1) / slides.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 w-full max-w-md">
        <div className={`transition-all duration-280 ease-out ${exiting ? 'opacity-0 scale-[0.96] translate-y-6' : 'opacity-100 scale-100 translate-y-0'}`}>

          {/* Illustration */}
          <div className="w-64 h-64 mx-auto mb-6 flex items-center justify-center rounded-3xl" style={{ backgroundColor: '#ffffff' }}>
            <img src={slide.image} alt={slide.title} className="w-full h-full object-contain drop-shadow-xl" draggable={false} />
          </div>

          {/* Subtitle badge */}
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-[#0A66C2] bg-[#0A66C2]/[0.06] px-3.5 py-1.5 rounded-full">
              {slide.subtitle}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-[26px] font-extrabold text-gray-900 text-center mb-3 leading-[1.2] tracking-tight whitespace-pre-line">
            {slide.title}
          </h2>

          {/* Description */}
          <p className="text-[15px] text-gray-400 text-center leading-relaxed font-normal max-w-[300px] mx-auto">
            {slide.desc}
          </p>
        </div>
      </div>

      {/* Bottom: dots + button */}
      <div className="w-full px-6 pb-[max(env(safe-area-inset-bottom),24px)] flex flex-col items-center gap-5">
        {/* Dot indicators */}
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (i <= current) setCurrent(i) }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-7 h-2 bg-[#0A66C2]'
                  : i < current
                    ? 'w-2 h-2 bg-[#0A66C2]/30'
                    : 'w-2 h-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* CTA Button — always #0A66C2 */}
        <button
          onClick={goNext}
          className="w-full py-[15px] rounded-2xl font-semibold text-white text-[15px] flex items-center justify-center gap-2 active:scale-[0.97] transition-all duration-150 shadow-lg shadow-[#0A66C2]/20 hover:shadow-[#0A66C2]/30 hover:-translate-y-0.5"
          style={{ backgroundColor: '#0A66C2' }}
        >
          {isLast ? (
            <>Başla <Sparkles size={18} /></>
          ) : (
            <>İleri <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  )
}
