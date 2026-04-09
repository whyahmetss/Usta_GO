import { useEffect, useState } from 'react'

const MESSAGES = [
  'Ustanız Hazırlanıyor...',
  'AI Fiyat Analizi Saniyeler İçinde...',
  'En İyi Usta Eşleştiriliyor...',
  'Hizmet Altyapısı Kuruluyor...',
  'Akıllı Sistem Devrede...',
]

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  const [msgIdx, setMsgIdx] = useState(() => Math.floor(Math.random() * MESSAGES.length))

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setMsgIdx(i => (i + 1) % MESSAGES.length), 1200)
    const t3 = setTimeout(() => setPhase(2), 2400)
    const t4 = setTimeout(() => onDone?.(), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-600 ${phase === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

      {/* Subtle network background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="splash-net" viewBox="0 0 400 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="glow1" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#0A66C2" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#0A66C2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="800" fill="url(#glow1)" />
          <line x1="40" y1="120" x2="180" y2="200" stroke="#0A66C2" strokeOpacity="0.06" strokeWidth="0.5" />
          <line x1="220" y1="100" x2="360" y2="260" stroke="#C5930C" strokeOpacity="0.06" strokeWidth="0.5" />
          <line x1="80" y1="500" x2="300" y2="620" stroke="#0A66C2" strokeOpacity="0.05" strokeWidth="0.5" />
          <line x1="320" y1="400" x2="150" y2="550" stroke="#C5930C" strokeOpacity="0.05" strokeWidth="0.5" />
          <circle cx="40" cy="120" r="2" fill="#0A66C2" opacity="0.1" />
          <circle cx="180" cy="200" r="2" fill="#0A66C2" opacity="0.08" />
          <circle cx="360" cy="260" r="1.5" fill="#C5930C" opacity="0.1" />
          <circle cx="300" cy="620" r="2" fill="#0A66C2" opacity="0.06" />
          <circle cx="150" cy="550" r="1.5" fill="#C5930C" opacity="0.08" />
        </svg>
      </div>

      <div className={`flex flex-col items-center transition-all duration-700 ${phase >= 1 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'}`}>

        {/* Central Gear + Orbiting Icons */}
        <div className="splash-gear-wrap">
          {/* Outer ring glow */}
          <div className="splash-ring" />

          {/* Main rotating gear */}
          <svg className="splash-gear" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gearGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D4A843" />
                <stop offset="30%" stopColor="#E8C86A" />
                <stop offset="60%" stopColor="#C49530" />
                <stop offset="100%" stopColor="#A67C20" />
              </linearGradient>
              <linearGradient id="gearInner" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E8D8A8" />
                <stop offset="100%" stopColor="#C8A848" />
              </linearGradient>
              <filter id="gearShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#C5930C" floodOpacity="0.2" />
              </filter>
            </defs>
            <g filter="url(#gearShadow)">
              {/* Gear teeth */}
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30) * Math.PI / 180
                const x = 100 + 78 * Math.cos(angle)
                const y = 100 + 78 * Math.sin(angle)
                return <rect key={i} x={x - 8} y={y - 12} width="16" height="24" rx="3" fill="url(#gearGold)" transform={`rotate(${i * 30}, ${x}, ${y})`} />
              })}
              {/* Gear body */}
              <circle cx="100" cy="100" r="65" fill="url(#gearGold)" />
              <circle cx="100" cy="100" r="55" fill="url(#gearInner)" />
              <circle cx="100" cy="100" r="52" fill="white" />
              {/* Inner detail circle */}
              <circle cx="100" cy="100" r="30" stroke="#C5930C" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
              <circle cx="100" cy="100" r="18" stroke="#0A66C2" strokeWidth="1" strokeOpacity="0.2" fill="none" strokeDasharray="3 3" />
              {/* Center bolt */}
              <circle cx="100" cy="100" r="8" fill="url(#gearGold)" />
              <circle cx="100" cy="100" r="4" fill="#B8892A" />
            </g>
          </svg>

          {/* Orbiting tool icons */}
          <div className="splash-orbit">
            <div className="splash-orbit-icon" style={{ '--orbit-delay': '0s', '--orbit-start': '0deg' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#0A66C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div className="splash-orbit-icon" style={{ '--orbit-delay': '-2.67s', '--orbit-start': '120deg' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#C5930C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
            </div>
            <div className="splash-orbit-icon" style={{ '--orbit-delay': '-5.34s', '--orbit-start': '240deg' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#0A66C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6" /><path d="M10 22h4" />
                <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
              </svg>
            </div>
          </div>

          {/* Data flow particles */}
          <div className="splash-particles">
            {[...Array(8)].map((_, i) => (
              <span key={i} className="splash-particle" style={{ '--p-delay': `${i * 0.3}s`, '--p-angle': `${i * 45}deg` }} />
            ))}
          </div>
        </div>

        {/* Logo text */}
        <div className="mt-6 flex flex-col items-center">
          <h1 className="text-3xl font-black tracking-tight" style={{ color: '#0A66C2' }}>
            <span style={{ color: '#C5930C' }}>U</span>sta<span style={{ color: '#C5930C' }}>G</span>o
          </h1>
          <p className="text-[13px] font-medium text-gray-400 mt-0.5 tracking-wide">Ev İşleri Artık Daha Kolay</p>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-52 h-[5px] bg-gray-100 rounded-full overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all ease-in-out"
            style={{
              background: 'linear-gradient(90deg, #0A66C2, #C5930C)',
              width: phase === 0 ? '10%' : phase === 1 ? '88%' : '100%',
              transitionDuration: phase === 1 ? '2s' : '0.4s',
            }}
          />
          {/* Gear end cap */}
          <svg className="splash-bar-gear" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ left: phase === 0 ? '10%' : phase === 1 ? '88%' : '100%', transitionDuration: phase === 1 ? '2s' : '0.4s' }}>
            <circle cx="12" cy="12" r="10" fill="#C5930C" />
            {[...Array(6)].map((_, i) => {
              const a = (i * 60) * Math.PI / 180
              return <rect key={i} x={12 + 8 * Math.cos(a) - 2} y={12 + 8 * Math.sin(a) - 3} width="4" height="6" rx="1" fill="#C5930C" transform={`rotate(${i * 60}, ${12 + 8 * Math.cos(a)}, ${12 + 8 * Math.sin(a)})`} />
            })}
            <circle cx="12" cy="12" r="5" fill="white" />
          </svg>
        </div>
      </div>

      {/* Rotating message */}
      <p className="absolute bottom-14 text-sm font-semibold tracking-wide transition-opacity duration-300" style={{ color: '#6B7280' }}>
        {MESSAGES[msgIdx]}
      </p>

      <style>{`
        .splash-net {
          position: absolute; inset: 0; width: 100%; height: 100%;
        }

        .splash-gear-wrap {
          position: relative; width: 180px; height: 180px;
          display: flex; align-items: center; justify-content: center;
        }

        .splash-ring {
          position: absolute; inset: -14px;
          border-radius: 50%;
          border: 1.5px solid rgba(10,102,194,0.08);
          animation: splash-ring-pulse 2.5s ease-in-out infinite;
        }
        @keyframes splash-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.06); opacity: 1; }
        }

        .splash-gear {
          width: 140px; height: 140px;
          animation: splash-gear-spin 8s linear infinite;
        }
        @keyframes splash-gear-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .splash-orbit {
          position: absolute; inset: -20px;
          animation: splash-orbit-spin 8s linear infinite reverse;
        }
        @keyframes splash-orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .splash-orbit-icon {
          position: absolute;
          width: 28px; height: 28px;
          background: white;
          border-radius: 10px;
          padding: 5px;
          box-shadow: 0 2px 12px rgba(10,102,194,0.15);
          animation: splash-icon-float 3s ease-in-out infinite;
          animation-delay: var(--orbit-delay);
        }
        .splash-orbit-icon:nth-child(1) { top: -14px; left: 50%; transform: translateX(-50%); }
        .splash-orbit-icon:nth-child(2) { bottom: 10px; left: -10px; }
        .splash-orbit-icon:nth-child(3) { bottom: 10px; right: -10px; }

        @keyframes splash-icon-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.05); }
        }

        .splash-orbit-icon svg {
          width: 100%; height: 100%;
        }

        .splash-particles {
          position: absolute; inset: 0;
          animation: splash-gear-spin 12s linear infinite;
        }
        .splash-particle {
          position: absolute;
          top: 50%; left: 50%;
          width: 3px; height: 3px;
          border-radius: 50%;
          background: #0A66C2;
          opacity: 0;
          animation: splash-p 2.5s ease-out infinite;
          animation-delay: var(--p-delay);
          transform: rotate(var(--p-angle)) translateX(70px);
        }
        .splash-particle:nth-child(even) { background: #C5930C; }

        @keyframes splash-p {
          0% { opacity: 0; transform: rotate(var(--p-angle)) translateX(50px) scale(0.5); }
          30% { opacity: 0.6; }
          100% { opacity: 0; transform: rotate(var(--p-angle)) translateX(100px) scale(0); }
        }

        .splash-bar-gear {
          position: absolute;
          top: 50%; width: 18px; height: 18px;
          transform: translate(-50%, -50%);
          transition: left ease-in-out;
          animation: splash-mini-spin 2s linear infinite;
        }
        @keyframes splash-mini-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
