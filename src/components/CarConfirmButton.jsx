import { useState, useEffect, useRef } from 'react'
import { CheckCircle } from 'lucide-react'

/* ── Araba SVG ── */
function CarSVG({ color = '#3B82F6' }) {
  const darkColor = '#1D4ED8'
  const windowColor = '#BAE6FD'
  return (
    <svg width="64" height="32" viewBox="0 0 64 32" fill="none">
      {/* Gölge */}
      <ellipse cx="32" cy="31" rx="26" ry="3" fill="rgba(0,0,0,0.18)" />
      {/* Gövde alt */}
      <rect x="4" y="16" width="56" height="12" rx="5" fill={color} />
      {/* Çatı */}
      <path d="M16 16 L21 7 L43 7 L48 16 Z" fill={darkColor} />
      {/* Ön cam */}
      <path d="M40.5 7.5 L45.5 15.5 L36 15.5 Z" fill={windowColor} opacity="0.9" />
      {/* Arka cam */}
      <path d="M23.5 7.5 L19 15.5 L28 15.5 Z" fill={windowColor} opacity="0.9" />
      {/* Orta cam */}
      <rect x="29" y="8" width="9" height="7.5" rx="1" fill={windowColor} opacity="0.85" />
      {/* Ön far */}
      <rect x="56" y="17" width="5" height="4" rx="1.5" fill="#FDE68A" />
      <rect x="55" y="17.5" width="2" height="3" rx="1" fill="#FBBF24" />
      {/* Arka stop */}
      <rect x="3" y="17" width="4" height="4" rx="1.5" fill="#FCA5A5" />
      <rect x="3" y="17.5" width="2" height="3" rx="1" fill="#F87171" />
      {/* Arka tekerlek */}
      <circle cx="16" cy="26" r="6" fill="#111827" />
      <circle cx="16" cy="26" r="3.5" fill="#374151" />
      <circle cx="16" cy="26" r="1.5" fill="#9CA3AF" />
      {/* Ön tekerlek */}
      <circle cx="48" cy="26" r="6" fill="#111827" />
      <circle cx="48" cy="26" r="3.5" fill="#374151" />
      <circle cx="48" cy="26" r="1.5" fill="#9CA3AF" />
      {/* Kapı çizgisi */}
      <line x1="32" y1="16" x2="32" y2="26" stroke={darkColor} strokeWidth="1" opacity="0.4" />
      {/* Plaka */}
      <rect x="23" y="22" width="18" height="5" rx="1.5" fill="white" opacity="0.7" />
      <text x="32" y="26.5" textAnchor="middle" fontSize="3.5" fontWeight="bold" fill="#1F2937" fontFamily="monospace">USTA GO</text>
    </svg>
  )
}

/* ── Yol animasyon keyframe'leri ── */
const ROAD_STYLES = `
@keyframes ug-road-scroll {
  0%   { background-position: 0 0; }
  100% { background-position: -80px 0; }
}
@keyframes ug-car-wobble {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-1px); }
}
`

/**
 * CarConfirmButton
 * Props:
 *   onConfirm  - callback, animasyon bitince çağrılır
 *   label      - varsayılan "İşi Onayla"
 *   disabled
 *   className
 */
export default function CarConfirmButton({
  onConfirm,
  label = 'İşi Onayla',
  disabled = false,
  className = '',
}) {
  const [phase, setPhase] = useState('idle')   // idle | driving | done
  const [carLeft, setCarLeft] = useState('-80px')
  const timers = useRef([])

  const clearTimers = () => timers.current.forEach(clearTimeout)
  useEffect(() => () => clearTimers(), [])

  const handleClick = () => {
    if (phase !== 'idle' || disabled) return

    setPhase('driving')
    setCarLeft('-80px')

    // 2 frame sonra transition başlasın
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCarLeft('calc(100% + 80px)')
      })
    })

    const t1 = setTimeout(() => {
      setPhase('done')
      const t2 = setTimeout(() => {
        onConfirm?.()
      }, 700)
      timers.current.push(t2)
    }, 2400)
    timers.current.push(t1)
  }

  const isDriving = phase === 'driving'
  const isDone = phase === 'done'

  return (
    <>
      <style>{ROAD_STYLES}</style>
      <button
        onClick={handleClick}
        disabled={disabled || phase !== 'idle'}
        className={`relative w-full overflow-hidden rounded-2xl font-bold text-white transition-colors duration-500 select-none
          ${isDone ? 'bg-emerald-500' : 'bg-blue-600'}
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98] cursor-pointer'}
          ${className}`}
        style={{ height: '68px' }}
      >
        {/* ── Asphalt road ── */}
        {isDriving && (
          <div className="absolute bottom-0 left-0 right-0" style={{ height: '16px' }}>
            {/* Asfalt */}
            <div className="absolute inset-0 bg-gray-700" />
            {/* Yol kenar çizgisi */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-500" />
            {/* Orta kesik çizgi */}
            <div
              className="absolute left-0 right-0"
              style={{
                top: '6px',
                height: '4px',
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.8) 0, rgba(255,255,255,0.8) 24px, transparent 24px, transparent 48px)',
                backgroundSize: '80px 4px',
                animation: 'ug-road-scroll 0.5s linear infinite',
              }}
            />
          </div>
        )}

        {/* ── Araba ── */}
        {isDriving && (
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: carLeft,
              transition: 'left 2.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              animation: isDriving ? 'ug-car-wobble 0.35s ease-in-out infinite' : 'none',
            }}
          >
            <CarSVG />
          </div>
        )}

        {/* ── Efor: done checkmark ── */}
        {isDone && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 animate-[fadeIn_0.3s_ease]">
            <CheckCircle size={22} />
            <span>Onaylandı!</span>
          </div>
        )}

        {/* ── Idle / Yükleniyor etiketi ── */}
        <span
          className="relative z-10 flex items-center justify-center gap-2 transition-opacity duration-200"
          style={{ opacity: isDriving || isDone ? 0 : 1 }}
        >
          {label}
        </span>
      </button>
    </>
  )
}
