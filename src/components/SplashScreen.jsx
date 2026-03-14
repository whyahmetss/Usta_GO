import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400)
    const t2 = setTimeout(() => setPhase(2), 2200)
    const t3 = setTimeout(() => onDone?.(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 transition-opacity duration-500 ${phase === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Arka plan daireler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-[-40px] w-40 h-40 rounded-full bg-white/5" />
      </div>

      <div className={`flex flex-col items-center transition-all duration-500 ${phase >= 0 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

        {/* İkon — dönen daire YOK, sadece çekiç */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/10 backdrop-blur rounded-3xl" />
          <HammerIcon active={phase >= 1} />
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-1">Usta Go</h1>
        <p className="text-blue-200 text-sm font-medium">Profesyonel Ev Hizmetleri</p>

        {/* İlerleme çubuğu */}
        <div className="mt-8 w-40 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all ease-in-out"
            style={{
              width: phase === 0 ? '15%' : phase === 1 ? '85%' : '100%',
              transitionDuration: phase === 1 ? '1.6s' : '0.4s',
            }}
          />
        </div>
      </div>

      <p className="absolute bottom-12 text-blue-300/60 text-xs font-medium">
        Hazırlanıyor...
      </p>
    </div>
  )
}

function HammerIcon({ active }) {
  return (
    <div className={`hammer-root ${active ? 'is-active' : ''}`}>
      <span className="sp sp1" />
      <span className="sp sp2" />
      <span className="sp sp3" />
      <span className="glow" />

      <svg className="hammer" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sap */}
        <rect x="28" y="28" width="6" height="30" rx="2.5" fill="#A0622E" />
        <rect x="29.5" y="29" width="2.5" height="28" rx="1.2" fill="#C08040" opacity="0.5" />

        {/* Çekiç başı gövde */}
        <rect x="14" y="10" width="34" height="20" rx="3" fill="#4A4A4A" />

        {/* Üst yüzey parlaklık */}
        <rect x="14" y="10" width="34" height="11" rx="3" fill="#5C5C5C" />
        <rect x="16" y="12" width="30" height="3" rx="1.5" fill="#727272" opacity="0.45" />

        {/* Vurma yüzeyi (sağ) */}
        <rect x="44" y="9" width="8" height="22" rx="2" fill="#3D3D3D" />
        <rect x="49" y="11" width="2" height="18" rx="1" fill="#555" opacity="0.35" />

        {/* Çengel (sol) */}
        <path d="M16 12 L8 4 Q6 2 7 5 L11 11 Z" fill="#4A4A4A" />
        <path d="M16 28 L8 36 Q6 38 7 35 L11 29 Z" fill="#4A4A4A" />

        {/* Sap-baş bağlantısı */}
        <rect x="26" y="26" width="10" height="6" rx="2" fill="#7B4A1E" />
      </svg>

      <style>{`
        .hammer-root {
          position: relative;
          width: 56px; height: 56px;
          display: flex; align-items: center; justify-content: center;
        }
        .hammer {
          width: 56px; height: 56px;
          transform-origin: 48% 80%;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
        }

        @keyframes strike {
          0%   { transform: rotate(0deg); }
          18%  { transform: rotate(-22deg); }
          46%  { transform: rotate(18deg); }
          54%  { transform: rotate(20deg); }
          68%  { transform: rotate(-4deg); }
          82%  { transform: rotate(1deg); }
          100% { transform: rotate(0deg); }
        }
        .is-active .hammer {
          animation: strike 0.75s cubic-bezier(0.22, 0.68, 0.32, 1.15) infinite;
        }

        .glow {
          position: absolute; top: 8px; right: 2px;
          width: 14px; height: 14px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,210,80,0.95) 0%, transparent 70%);
          transform: scale(0); opacity: 0; pointer-events: none;
        }
        @keyframes flash {
          0%,42% { transform: scale(0); opacity: 0; }
          50%    { transform: scale(2.2); opacity: 1; }
          62%    { transform: scale(3); opacity: 0.5; }
          74%    { transform: scale(3.5); opacity: 0; }
          100%   { transform: scale(0); opacity: 0; }
        }
        .is-active .glow { animation: flash 0.75s ease-out infinite; }

        .sp {
          position: absolute; top: 12px; right: 4px;
          width: 3px; height: 3px; border-radius: 50%;
          background: #FFD700; opacity: 0; pointer-events: none;
        }
        @keyframes s1 { 0%,44%{transform:translate(0,0);opacity:0}50%{opacity:1}72%{transform:translate(10px,-12px);opacity:0}100%{opacity:0} }
        @keyframes s2 { 0%,44%{transform:translate(0,0);opacity:0}50%{opacity:1}72%{transform:translate(-6px,-14px);opacity:0}100%{opacity:0} }
        @keyframes s3 { 0%,44%{transform:translate(0,0);opacity:0}52%{opacity:.8}72%{transform:translate(12px,4px);opacity:0}100%{opacity:0} }

        .is-active .sp1 { animation: s1 .75s ease-out infinite; }
        .is-active .sp2 { animation: s2 .75s ease-out infinite; }
        .is-active .sp3 { animation: s3 .75s ease-out infinite; }
      `}</style>
    </div>
  )
}
