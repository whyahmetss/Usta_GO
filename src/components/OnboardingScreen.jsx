import { useState } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'

/* ── Premium SVG İllüstrasyonlar ── */
function IllustrationSearch() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Soft shadow circle */}
      <circle cx="120" cy="130" rx="70" fill="#0A66C2" opacity="0.06" />
      {/* Main circle */}
      <circle cx="120" cy="120" rx="60" fill="white" stroke="#0A66C2" strokeWidth="2" />
      {/* House outline */}
      <path d="M95 130V105L120 88L145 105V130H132V115H108V130H95Z" stroke="#0A66C2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#EBF4FF" />
      {/* Magnifying glass */}
      <circle cx="155" cy="155" r="18" stroke="#0A66C2" strokeWidth="2.5" fill="white" />
      <line x1="168" y1="168" x2="182" y2="182" stroke="#0A66C2" strokeWidth="3" strokeLinecap="round" />
      {/* Sparkle dots */}
      <circle cx="85" cy="80" r="3" fill="#0A66C2" opacity="0.3" />
      <circle cx="165" cy="78" r="2" fill="#0A66C2" opacity="0.2" />
      <circle cx="70" cy="140" r="2.5" fill="#0A66C2" opacity="0.15" />
      {/* Person pin */}
      <circle cx="120" cy="108" r="5" fill="#0A66C2" opacity="0.5" />
      <path d="M113 120C113 116 116.134 113 120 113C123.866 113 127 116 127 120" stroke="#0A66C2" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

function IllustrationTrust() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="120" cy="130" rx="70" fill="#0A66C2" opacity="0.06" />
      {/* Shield */}
      <path d="M120 72L158 90V120C158 147 141 162 120 170C99 162 82 147 82 120V90L120 72Z" fill="#EBF4FF" stroke="#0A66C2" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Star inside shield */}
      <path d="M120 100L125.5 111.2L138 113L129 121.7L131.1 134L120 128L108.9 134L111 121.7L102 113L114.5 111.2L120 100Z" fill="#0A66C2" opacity="0.25" stroke="#0A66C2" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Check badge */}
      <circle cx="152" cy="152" r="16" fill="#0A66C2" />
      <path d="M144 152L150 158L161 147" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Sparkle dots */}
      <circle cx="78" cy="88" r="3" fill="#0A66C2" opacity="0.2" />
      <circle cx="168" cy="82" r="2" fill="#0A66C2" opacity="0.15" />
    </svg>
  )
}

function IllustrationPayment() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="120" cy="130" rx="70" fill="#0A66C2" opacity="0.06" />
      {/* Card body */}
      <rect x="70" y="92" rx="12" width="100" height="64" fill="white" stroke="#0A66C2" strokeWidth="2.5" />
      {/* Card stripe */}
      <rect x="70" y="106" width="100" height="12" fill="#0A66C2" opacity="0.12" />
      {/* Card chip */}
      <rect x="82" y="118" rx="3" width="18" height="13" fill="#EBF4FF" stroke="#0A66C2" strokeWidth="1.5" />
      {/* Lock */}
      <circle cx="158" cy="148" r="18" fill="#0A66C2" />
      <rect x="150" y="147" rx="2" width="16" height="12" fill="white" opacity="0.9" />
      <path d="M153 147V143C153 140.239 155.239 138 158 138C160.761 138 163 140.239 163 143V147" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Floating coins */}
      <circle cx="82" cy="80" r="8" fill="#EBF4FF" stroke="#0A66C2" strokeWidth="1.5" />
      <text x="82" y="84" textAnchor="middle" fill="#0A66C2" fontSize="9" fontWeight="bold">₺</text>
      <circle cx="168" cy="76" r="6" fill="#EBF4FF" stroke="#0A66C2" strokeWidth="1.2" />
      <text x="168" y="79.5" textAnchor="middle" fill="#0A66C2" fontSize="7" fontWeight="bold">₺</text>
    </svg>
  )
}

function IllustrationReady() {
  return (
    <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="120" cy="130" rx="70" fill="#0A66C2" opacity="0.06" />
      {/* Rocket body */}
      <path d="M120 70C120 70 100 100 100 130C100 145 108.954 155 120 155C131.046 155 140 145 140 130C140 100 120 70 120 70Z" fill="#EBF4FF" stroke="#0A66C2" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Rocket window */}
      <circle cx="120" cy="115" r="10" fill="white" stroke="#0A66C2" strokeWidth="2" />
      <circle cx="120" cy="115" r="5" fill="#0A66C2" opacity="0.2" />
      {/* Rocket fins */}
      <path d="M100 138L86 150L100 148" fill="#0A66C2" opacity="0.2" stroke="#0A66C2" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M140 138L154 150L140 148" fill="#0A66C2" opacity="0.2" stroke="#0A66C2" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Flame */}
      <path d="M112 155Q116 170 120 175Q124 170 128 155" fill="#0A66C2" opacity="0.3" />
      {/* Stars */}
      <circle cx="80" cy="85" r="3" fill="#0A66C2" opacity="0.25" />
      <circle cx="165" cy="90" r="2.5" fill="#0A66C2" opacity="0.2" />
      <circle cx="75" cy="130" r="2" fill="#0A66C2" opacity="0.15" />
      <circle cx="170" cy="125" r="2" fill="#0A66C2" opacity="0.12" />
      {/* Sparkle lines */}
      <path d="M88 100L84 96M84 100L88 96" stroke="#0A66C2" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
      <path d="M156 105L152 101M152 105L156 101" stroke="#0A66C2" strokeWidth="1.2" strokeLinecap="round" opacity="0.25" />
    </svg>
  )
}

const slides = [
  {
    illustration: IllustrationSearch,
    title: 'Ustanı Kolayca Bul',
    subtitle: 'Saniyeler içinde eşleş',
    desc: 'Elektrik, su tesisatı, boya, tadilat… Aklına gelen her iş için yakınındaki profesyonel ustayı anında bul.',
  },
  {
    illustration: IllustrationTrust,
    title: 'Güvenilir Ustalar',
    subtitle: 'Kimlik doğrulamalı',
    desc: 'Her usta kimlik doğrulaması ve müşteri puanlamasından geçer. En kaliteli hizmeti güvenle al.',
  },
  {
    illustration: IllustrationPayment,
    title: 'Güvenli Ödeme',
    subtitle: 'Paranız güvende',
    desc: 'Ödemen kilitli tutulur, ustaya ancak sen onayladıktan sonra aktarılır. iyzico güvencesi.',
  },
  {
    illustration: IllustrationReady,
    title: 'Hazırsın!',
    subtitle: 'Hadi başlayalım',
    desc: 'İlk işini oluştur veya usta olarak kayıt ol. UstaGO seninle!',
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
  const Illustration = slide.illustration
  const isLast = current === slides.length - 1

  return (
    <div className="fixed inset-0 z-[9998] bg-white flex flex-col items-center select-none overflow-hidden"
      style={{ fontFamily: "'Inter', 'Geist', -apple-system, BlinkMacSystemFont, sans-serif" }}>

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
          <div className="w-56 h-56 mx-auto mb-8">
            <Illustration />
          </div>

          {/* Subtitle badge */}
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-[#0A66C2] bg-[#0A66C2]/[0.06] px-3.5 py-1.5 rounded-full">
              {slide.subtitle}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-[26px] font-extrabold text-gray-900 text-center mb-3 leading-[1.2] tracking-tight">
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
