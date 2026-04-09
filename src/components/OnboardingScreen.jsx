import { useState } from 'react'
import { ChevronRight, Sparkles } from 'lucide-react'

/* ══════════════════════════════════════════════
   PREMIUM 3D SVG İLLÜSTRASYONLAR
   Palette: Tok Mavi #0A66C2 + Gold #D4A843
   ══════════════════════════════════════════════ */

/* ── 1) Ev Servisleri — Anahtar + Ev ── */
function Illustration1() {
  return (
    <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <defs>
        <linearGradient id="g1bg" x1="0" y1="0" x2="280" y2="280"><stop offset="0%" stopColor="#0A66C2" stopOpacity="0.04"/><stop offset="100%" stopColor="#0A66C2" stopOpacity="0.12"/></linearGradient>
        <linearGradient id="g1wrench" x1="90" y1="40" x2="190" y2="200"><stop offset="0%" stopColor="#0A66C2"/><stop offset="100%" stopColor="#074E94"/></linearGradient>
        <linearGradient id="g1house" x1="140" y1="130" x2="140" y2="230"><stop offset="0%" stopColor="#EBF4FF"/><stop offset="100%" stopColor="#D0E4F7"/></linearGradient>
        <linearGradient id="g1gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#D4A843"/><stop offset="100%" stopColor="#B8922F"/></linearGradient>
        <filter id="f1shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0A66C2" floodOpacity="0.18"/></filter>
        <filter id="f1glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b"/></filter>
      </defs>
      {/* Background glow */}
      <ellipse cx="140" cy="155" rx="95" ry="85" fill="url(#g1bg)"/>
      {/* House — 3D look */}
      <g filter="f1shadow">
        <path d="M100 195V160L140 135L180 160V195H160V175H120V195H100Z" fill="url(#g1house)" stroke="#0A66C2" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M100 160L140 135L180 160" fill="none" stroke="#0A66C2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        {/* Roof highlight */}
        <path d="M110 163L140 141L170 163" fill="white" opacity="0.35"/>
        {/* Window */}
        <rect x="130" y="155" width="20" height="18" rx="3" fill="white" stroke="#0A66C2" strokeWidth="1.5" opacity="0.8"/>
        <line x1="140" y1="155" x2="140" y2="173" stroke="#0A66C2" strokeWidth="0.8" opacity="0.4"/>
        <line x1="130" y1="164" x2="150" y2="164" stroke="#0A66C2" strokeWidth="0.8" opacity="0.4"/>
        {/* Door */}
        <rect x="112" y="175" width="14" height="20" rx="2" fill="#0A66C2" opacity="0.15"/>
        <circle cx="123" cy="186" r="1.5" fill="#0A66C2" opacity="0.5"/>
      </g>
      {/* Wrench — 3D metallic */}
      <g filter="f1shadow" transform="translate(65,20) rotate(-30,70,85)">
        <path d="M60 30C52 30 45 37 45 46C45 52 48 57 53 60L62 130C62 134 66 137 70 137C74 137 78 134 78 130L87 60C92 57 95 52 95 46C95 37 88 30 80 30C78 30 76 30.5 74 31.5L70 40L66 31.5C64 30.5 62 30 60 30Z" fill="url(#g1wrench)"/>
        {/* Wrench highlight (3D shine) */}
        <path d="M62 35C58 37 55 41 55 46C55 49 56 51 58 53L64 130C64 132 67 134 70 134" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4"/>
        {/* Wrench jaw top */}
        <ellipse cx="70" cy="38" rx="12" ry="5" fill="white" opacity="0.15"/>
      </g>
      {/* Gold sparkles */}
      <g filter="f1glow">
        <circle cx="65" cy="85" r="4" fill="url(#g1gold)" opacity="0.7"/>
        <circle cx="215" cy="100" r="3" fill="url(#g1gold)" opacity="0.5"/>
        <circle cx="195" cy="145" r="2.5" fill="url(#g1gold)" opacity="0.4"/>
        <circle cx="80" cy="200" r="2" fill="url(#g1gold)" opacity="0.35"/>
      </g>
      {/* Floating circuit lines */}
      <path d="M55 120H70L78 112" stroke="#0A66C2" strokeWidth="1" opacity="0.15" strokeLinecap="round"/>
      <path d="M210 160H195L188 168" stroke="#0A66C2" strokeWidth="1" opacity="0.12" strokeLinecap="round"/>
      <path d="M200 110L210 110L215 105" stroke="#0A66C2" strokeWidth="0.8" opacity="0.1" strokeLinecap="round"/>
    </svg>
  )
}

/* ── 2) Güvenilir Ustalar — Kalkan + Profil + Defne ── */
function Illustration2() {
  return (
    <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <defs>
        <linearGradient id="g2bg" x1="0" y1="0" x2="280" y2="280"><stop offset="0%" stopColor="#0A66C2" stopOpacity="0.04"/><stop offset="100%" stopColor="#0A66C2" stopOpacity="0.12"/></linearGradient>
        <linearGradient id="g2shield" x1="100" y1="50" x2="180" y2="220"><stop offset="0%" stopColor="#0D7AE8"/><stop offset="50%" stopColor="#0A66C2"/><stop offset="100%" stopColor="#074E94"/></linearGradient>
        <linearGradient id="g2gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#D4A843"/><stop offset="100%" stopColor="#B8922F"/></linearGradient>
        <linearGradient id="g2face" x1="130" y1="100" x2="150" y2="145"><stop offset="0%" stopColor="#FDDCB5"/><stop offset="100%" stopColor="#F5C99A"/></linearGradient>
        <filter id="f2shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0A66C2" floodOpacity="0.22"/></filter>
        <filter id="f2glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
        <clipPath id="shieldClip"><path d="M140 48L200 72V130C200 168 174 190 140 202C106 190 80 168 80 130V72L140 48Z"/></clipPath>
      </defs>
      <ellipse cx="140" cy="155" rx="95" ry="85" fill="url(#g2bg)"/>
      {/* Shield — 3D metallic */}
      <g filter="f2shadow">
        <path d="M140 48L200 72V130C200 168 174 190 140 202C106 190 80 168 80 130V72L140 48Z" fill="url(#g2shield)"/>
        {/* Shield inner bevel */}
        <path d="M140 58L190 78V130C190 162 168 182 140 192C112 182 90 162 90 130V78L140 58Z" fill="white" opacity="0.08"/>
        {/* Shield highlight left edge */}
        <path d="M85 75L140 52L142 54L88 77V130C88 160 106 180 134 192L140 194" stroke="white" strokeWidth="1.5" fill="none" opacity="0.2"/>
      </g>
      {/* Laurel wreath — gold */}
      <g opacity="0.8">
        {/* Left branch */}
        <path d="M100 165C95 155 93 142 95 130C97 138 102 146 108 152" stroke="url(#g2gold)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <ellipse cx="96" cy="138" rx="5" ry="9" transform="rotate(-15,96,138)" fill="url(#g2gold)" opacity="0.3"/>
        <ellipse cx="99" cy="150" rx="4.5" ry="8" transform="rotate(-5,99,150)" fill="url(#g2gold)" opacity="0.25"/>
        <ellipse cx="94" cy="126" rx="5" ry="8.5" transform="rotate(-25,94,126)" fill="url(#g2gold)" opacity="0.35"/>
        {/* Right branch */}
        <path d="M180 165C185 155 187 142 185 130C183 138 178 146 172 152" stroke="url(#g2gold)" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <ellipse cx="184" cy="138" rx="5" ry="9" transform="rotate(15,184,138)" fill="url(#g2gold)" opacity="0.3"/>
        <ellipse cx="181" cy="150" rx="4.5" ry="8" transform="rotate(5,181,150)" fill="url(#g2gold)" opacity="0.25"/>
        <ellipse cx="186" cy="126" rx="5" ry="8.5" transform="rotate(25,186,126)" fill="url(#g2gold)" opacity="0.35"/>
      </g>
      {/* Person avatar inside shield */}
      <g clipPath="url(#shieldClip)">
        {/* Head */}
        <circle cx="140" cy="108" r="22" fill="url(#g2face)"/>
        {/* Hair */}
        <path d="M118 100C118 88 128 80 140 80C152 80 162 88 162 100C162 95 155 88 140 88C125 88 118 95 118 100Z" fill="#3A2714"/>
        {/* Eyes */}
        <ellipse cx="132" cy="108" rx="2.5" ry="3" fill="#2C3E50"/>
        <ellipse cx="148" cy="108" rx="2.5" ry="3" fill="#2C3E50"/>
        {/* Smile */}
        <path d="M133 116Q140 122 147 116" stroke="#C0846A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        {/* Body/shoulders */}
        <path d="M108 155C108 140 122 132 140 132C158 132 172 140 172 155V200H108V155Z" fill="#0A66C2" opacity="0.3"/>
      </g>
      {/* Gold check badge */}
      <g filter="f2shadow">
        <circle cx="185" cy="185" r="18" fill="url(#g2gold)"/>
        <circle cx="185" cy="185" r="15" fill="none" stroke="white" strokeWidth="1" opacity="0.4"/>
        <path d="M176 185L182 191L195 178" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      {/* Gold sparkles */}
      <circle cx="70" cy="75" r="3.5" fill="url(#g2gold)" opacity="0.5"/>
      <circle cx="215" cy="68" r="2.5" fill="url(#g2gold)" opacity="0.4"/>
      <circle cx="60" cy="180" r="2" fill="url(#g2gold)" opacity="0.3"/>
    </svg>
  )
}

/* ── 3) Güvenli İşlem Garantisi — Kalkan + Kilit + Mühür ── */
function Illustration3() {
  return (
    <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <defs>
        <linearGradient id="g3bg" x1="0" y1="0" x2="280" y2="280"><stop offset="0%" stopColor="#0A66C2" stopOpacity="0.04"/><stop offset="100%" stopColor="#0A66C2" stopOpacity="0.1"/></linearGradient>
        <linearGradient id="g3shield" x1="90" y1="40" x2="190" y2="220"><stop offset="0%" stopColor="#0D7AE8"/><stop offset="40%" stopColor="#0A66C2"/><stop offset="100%" stopColor="#063F7A"/></linearGradient>
        <linearGradient id="g3gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E8C352"/><stop offset="50%" stopColor="#D4A843"/><stop offset="100%" stopColor="#B8922F"/></linearGradient>
        <linearGradient id="g3lock" x1="125" y1="100" x2="155" y2="160"><stop offset="0%" stopColor="white"/><stop offset="100%" stopColor="#E8F0FE"/></linearGradient>
        <filter id="f3shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0A66C2" floodOpacity="0.25"/></filter>
        <filter id="f3glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feComposite in="SourceGraphic" in2="b"/></filter>
      </defs>
      <ellipse cx="140" cy="155" rx="100" ry="88" fill="url(#g3bg)"/>
      {/* Shield — deep 3D */}
      <g filter="f3shadow">
        <path d="M140 42L206 70V135C206 178 176 200 140 214C104 200 74 178 74 135V70L140 42Z" fill="url(#g3shield)"/>
        {/* Inner shield bevel */}
        <path d="M140 55L196 78V135C196 172 170 192 140 204C110 192 84 172 84 135V78L140 55Z" fill="white" opacity="0.06"/>
        {/* Left edge shine */}
        <path d="M80 73L140 47L143 49L83 75V135C83 168 105 188 138 200" stroke="white" strokeWidth="2" fill="none" opacity="0.15"/>
      </g>
      {/* Lock body — 3D */}
      <g filter="f3shadow">
        <rect x="118" y="118" width="44" height="36" rx="8" fill="url(#g3lock)" stroke="#0A66C2" strokeWidth="2"/>
        {/* Lock shade */}
        <rect x="118" y="140" width="44" height="14" rx="0" fill="#0A66C2" opacity="0.06"/>
        {/* Lock shackle */}
        <path d="M126 118V108C126 99.163 132.163 93 140 93C147.837 93 154 99.163 154 108V118" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M128 118V109C128 101 133 96 140 96C147 96 152 101 152 109V118" stroke="#0A66C2" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.3"/>
        {/* Keyhole */}
        <circle cx="140" cy="131" r="5" fill="#0A66C2" opacity="0.6"/>
        <rect x="138" y="133" width="4" height="8" rx="2" fill="#0A66C2" opacity="0.4"/>
      </g>
      {/* Gold seal / certificate stamp */}
      <g filter="f3glow" transform="translate(178,160)">
        <circle cx="0" cy="0" r="22" fill="url(#g3gold)"/>
        <circle cx="0" cy="0" r="18" fill="none" stroke="white" strokeWidth="1" opacity="0.5"/>
        {/* Star in seal */}
        <path d="M0 -10L2.9 -3.8L9.5 -3.1L4.8 1.5L6 8.1L0 5L-6 8.1L-4.8 1.5L-9.5 -3.1L-2.9 -3.8Z" fill="white" opacity="0.85"/>
        {/* Seal ribbons */}
        <path d="M-8 20L-12 35L-4 30L0 38L4 30L12 35L8 20" stroke="url(#g3gold)" strokeWidth="2" fill="url(#g3gold)" opacity="0.6"/>
      </g>
      {/* Floating circuit / tech lines */}
      <path d="M55 100H75L82 93" stroke="#0A66C2" strokeWidth="1" opacity="0.12" strokeLinecap="round"/>
      <path d="M225 130H205L198 137" stroke="#0A66C2" strokeWidth="1" opacity="0.1" strokeLinecap="round"/>
      <circle cx="70" cy="100" r="2" fill="#0A66C2" opacity="0.15"/>
      <circle cx="218" cy="130" r="2" fill="#0A66C2" opacity="0.12"/>
      {/* Gold sparkles */}
      <circle cx="65" cy="65" r="3.5" fill="url(#g3gold)" opacity="0.5"/>
      <circle cx="225" cy="80" r="3" fill="url(#g3gold)" opacity="0.4"/>
      <circle cx="55" cy="190" r="2.5" fill="url(#g3gold)" opacity="0.3"/>
      <circle cx="230" cy="200" r="2" fill="url(#g3gold)" opacity="0.25"/>
    </svg>
  )
}

/* ── 4) Size Özel Çözümler — Yapboz + Dişli + Veri Noktaları ── */
function Illustration4() {
  return (
    <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
      <defs>
        <linearGradient id="g4bg" x1="0" y1="0" x2="280" y2="280"><stop offset="0%" stopColor="#0A66C2" stopOpacity="0.04"/><stop offset="100%" stopColor="#0A66C2" stopOpacity="0.1"/></linearGradient>
        <linearGradient id="g4blue" x1="80" y1="80" x2="200" y2="200"><stop offset="0%" stopColor="#0D7AE8"/><stop offset="100%" stopColor="#074E94"/></linearGradient>
        <linearGradient id="g4gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E8C352"/><stop offset="50%" stopColor="#D4A843"/><stop offset="100%" stopColor="#B8922F"/></linearGradient>
        <linearGradient id="g4gear" x1="170" y1="80" x2="220" y2="160"><stop offset="0%" stopColor="#D4A843"/><stop offset="100%" stopColor="#B8922F"/></linearGradient>
        <filter id="f4shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0A66C2" floodOpacity="0.2"/></filter>
        <filter id="f4glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b"/></filter>
      </defs>
      <ellipse cx="140" cy="155" rx="100" ry="88" fill="url(#g4bg)"/>
      {/* Puzzle piece — main blue */}
      <g filter="f4shadow">
        <path d="M90 100H120C120 100 120 90 130 90C140 90 140 100 140 100H150V130C150 130 160 130 160 140C160 150 150 150 150 150V170H120C120 170 120 160 110 160C100 160 100 170 100 170H90V100Z" fill="url(#g4blue)"/>
        {/* Puzzle highlight */}
        <path d="M93 103H118C118 103 119 92 130 92C138 92 139 100 139 100" stroke="white" strokeWidth="1.5" fill="none" opacity="0.25"/>
        {/* Inner subtle pattern */}
        <rect x="105" y="120" width="25" height="3" rx="1.5" fill="white" opacity="0.15"/>
        <rect x="105" y="128" width="18" height="3" rx="1.5" fill="white" opacity="0.1"/>
      </g>
      {/* Second puzzle piece — lighter */}
      <g filter="f4shadow" opacity="0.5">
        <path d="M150 100H170V130C170 130 180 130 180 140C180 150 170 150 170 150V170H150V150C150 150 160 150 160 140C160 130 150 130 150 130V100Z" fill="#0A66C2"/>
        <path d="M153 103H167V128" stroke="white" strokeWidth="1" fill="none" opacity="0.2"/>
      </g>
      {/* Gear — 3D gold */}
      <g filter="f4shadow" transform="translate(185,85)">
        <path d="M0 -30L6 -26L8 -32L14 -28L12 -22L18 -18L22 -24L26 -18L20 -14L22 -8L28 -6L26 0L20 -2L18 4L24 8L20 14L14 10L10 16L14 22L8 24L6 18L0 20L-6 18L-8 24L-14 22L-10 16L-14 10L-20 14L-24 8L-18 4L-20 -2L-26 0L-28 -6L-22 -8L-20 -14L-26 -18L-22 -24L-18 -18L-12 -22L-14 -28L-8 -32L-6 -26Z" fill="url(#g4gear)"/>
        <circle cx="0" cy="0" r="14" fill="white" opacity="0.15"/>
        <circle cx="0" cy="0" r="10" fill="url(#g4gear)" opacity="0.5"/>
        <circle cx="0" cy="0" r="6" fill="white" opacity="0.2"/>
        {/* Gear highlight */}
        <ellipse cx="-4" cy="-8" rx="8" ry="5" fill="white" opacity="0.15" transform="rotate(-20)"/>
      </g>
      {/* Floating data points */}
      <g filter="f4glow">
        {/* Data bars */}
        <rect x="60" y="80" width="6" height="20" rx="3" fill="#0A66C2" opacity="0.25"/>
        <rect x="70" y="70" width="6" height="30" rx="3" fill="#0A66C2" opacity="0.35"/>
        <rect x="80" y="75" width="6" height="25" rx="3" fill="url(#g4gold)" opacity="0.4"/>
        {/* Floating dots — "data in motion" */}
        <circle cx="65" cy="60" r="3" fill="url(#g4gold)" opacity="0.6"/>
        <circle cx="230" cy="160" r="3.5" fill="url(#g4gold)" opacity="0.5"/>
        <circle cx="55" cy="200" r="2.5" fill="#0A66C2" opacity="0.2"/>
        <circle cx="225" cy="210" r="2" fill="url(#g4gold)" opacity="0.35"/>
        {/* Connection lines */}
        <path d="M65 63L80 55L95 60" stroke="#0A66C2" strokeWidth="1" opacity="0.15" strokeLinecap="round" strokeDasharray="3 3"/>
        <path d="M210 170L225 165L240 172" stroke="url(#g4gold)" strokeWidth="1" opacity="0.2" strokeLinecap="round" strokeDasharray="3 3"/>
      </g>
      {/* Profile indicator */}
      <g filter="f4shadow" transform="translate(85,190)">
        <rect x="0" y="0" width="110" height="28" rx="14" fill="white" stroke="#0A66C2" strokeWidth="1.5"/>
        <circle cx="18" cy="14" r="8" fill="#0A66C2" opacity="0.15"/>
        <circle cx="18" cy="12" r="3.5" fill="#0A66C2" opacity="0.4"/>
        <path d="M12 19C12 16 14.686 14 18 14C21.314 14 24 16 24 19" stroke="#0A66C2" strokeWidth="1" fill="none" opacity="0.3"/>
        <rect x="34" y="8" width="45" height="4" rx="2" fill="#0A66C2" opacity="0.2"/>
        <rect x="34" y="16" width="30" height="3" rx="1.5" fill="url(#g4gold)" opacity="0.35"/>
        <circle cx="95" cy="14" r="5" fill="#0A66C2" opacity="0.12"/>
        <path d="M92.5 14L94.5 16L98 12.5" stroke="#0A66C2" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
      </g>
    </svg>
  )
}

const slides = [
  {
    illustration: Illustration1,
    title: 'UstaGo ile Tüm Ev İşleri\nKontrol Altında',
    subtitle: 'Tüm ustalar burada',
    desc: 'Boyacıdan, elektrikçiye, tesisatçıdan temizlikçiye… Aradığınız tüm ustalar burada.',
  },
  {
    illustration: Illustration2,
    title: 'Sadece En İyi Ustalar',
    subtitle: 'Performans garantili',
    desc: 'Her usta, titizlikle seçilir ve onaylanır. Sizin için en iyi performansı garanti ediyoruz.',
  },
  {
    illustration: Illustration3,
    title: 'Güvenli İşlem Garantisi',
    subtitle: 'Paranız güvende',
    desc: 'İş tamamlanana kadar paranız güvende. UstaGo ile sorunsuz ve güvenli hizmetin tadını çıkarın.',
  },
  {
    illustration: Illustration4,
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
          <div className="w-64 h-64 mx-auto mb-6">
            <Illustration />
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
