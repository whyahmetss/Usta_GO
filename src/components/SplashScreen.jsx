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
      {/* Kıvılcımlar */}
      <span className="sp sp1" />
      <span className="sp sp2" />
      <span className="sp sp3" />
      <span className="sp sp4" />

      {/* Impact glow */}
      <span className="glow" />

      {/* Modern minimalist çekiç SVG */}
      <svg className="hammer" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Sap — ahşap tonları */}
        <rect x="26" y="30" width="7" height="28" rx="3" fill="#8B4513" transform="rotate(-5 29 44)" />
        <rect x="27.5" y="31" width="3" height="26" rx="1.5" fill="#A0522D" opacity="0.6" transform="rotate(-5 29 44)" />
        <rect x="28.5" y="32" width="1" height="24" rx="0.5" fill="#CD853F" opacity="0.3" transform="rotate(-5 29 44)" />

        {/* Çekiç başı gölge */}
        <rect x="10" y="16" width="40" height="16" rx="3" fill="rgba(0,0,0,0.15)" transform="translate(1,1)" />

        {/* Çekiç başı — ana gövde */}
        <rect x="10" y="16" width="40" height="16" rx="3" fill="#555555" />

        {/* Üst yüzey (hafif açık ton — derinlik hissi) */}
        <rect x="10" y="16" width="40" height="9" rx="3" fill="#666666" />

        {/* Metal parıltı şeridi */}
        <rect x="12" y="18.5" width="36" height="2.5" rx="1.2" fill="#888888" opacity="0.5" />

        {/* Vurma yüzeyi (sağ taraf — düz kesim) */}
        <rect x="45" y="15" width="7" height="18" rx="1.5" fill="#444444" />
        <rect x="46" y="17" width="1.5" height="14" rx="0.75" fill="#555555" opacity="0.5" />

        {/* Pençe tarafı (sol — V çıkıntı) */}
        <path d="M12 18 L4 9 L7.5 8 L13 16 Z" fill="#555555" />
        <path d="M12 30 L4 39 L7.5 40 L13 32 Z" fill="#555555" />
        <path d="M5 9.5 L6.5 8.5" stroke="#666666" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d="M5 38.5 L6.5 39.5" stroke="#666666" strokeWidth="1" strokeLinecap="round" opacity="0.4" />

        {/* Sap-baş bağlantı halkası */}
        <rect x="25" y="28" width="9" height="5" rx="1.5" fill="#6B4226" />
      </svg>

      <style>{`
        .hammer-root {
          position: relative;
          width: 52px; height: 52px;
          display: flex; align-items: center; justify-content: center;
        }
        .hammer {
          width: 52px; height: 52px;
          transform-origin: 35% 75%;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        /* Vuruş animasyonu */
        @keyframes strike {
          0%   { transform: rotate(0deg);    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
          15%  { transform: rotate(-18deg);  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
          45%  { transform: rotate(14deg);   filter: drop-shadow(0 0 14px rgba(255,180,50,0.9)); }
          52%  { transform: rotate(16deg);   filter: drop-shadow(0 0 20px rgba(255,150,30,1)); }
          65%  { transform: rotate(-5deg);   filter: drop-shadow(0 0 4px rgba(255,200,50,0.3)); }
          78%  { transform: rotate(2deg);    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
          100% { transform: rotate(0deg);    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
        }
        .is-active .hammer {
          animation: strike 0.7s cubic-bezier(0.22, 0.68, 0.32, 1.2) infinite;
        }

        /* Vuruş ışığı */
        .glow {
          position: absolute; bottom: 2px; right: 6px;
          width: 16px; height: 16px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,200,60,0.9) 0%, transparent 70%);
          transform: scale(0); opacity: 0; pointer-events: none;
        }
        @keyframes flash {
          0%,40% { transform: scale(0); opacity: 0; }
          50%    { transform: scale(2.5); opacity: 1; }
          65%    { transform: scale(3.5); opacity: 0.4; }
          75%    { transform: scale(4); opacity: 0; }
          100%   { transform: scale(0); opacity: 0; }
        }
        .is-active .glow { animation: flash 0.7s cubic-bezier(0.22,0.68,0.32,1.2) infinite; }

        /* Kıvılcımlar */
        .sp {
          position: absolute; bottom: 6px; right: 10px;
          width: 3px; height: 3px; border-radius: 50%;
          background: #FFD700; opacity: 0; pointer-events: none;
        }
        @keyframes s1 { 0%,44%{transform:translate(0,0);opacity:0}52%{opacity:1}75%{transform:translate(-8px,-14px);opacity:0}100%{opacity:0} }
        @keyframes s2 { 0%,44%{transform:translate(0,0);opacity:0}52%{opacity:1}75%{transform:translate(8px,-12px);opacity:0}100%{opacity:0} }
        @keyframes s3 { 0%,44%{transform:translate(0,0);opacity:0}52%{opacity:.8}75%{transform:translate(-12px,-6px);opacity:0}100%{opacity:0} }
        @keyframes s4 { 0%,44%{transform:translate(0,0);opacity:0}54%{opacity:.9;background:#FF8C00}75%{transform:translate(4px,-16px);opacity:0}100%{opacity:0} }

        .is-active .sp1 { animation: s1 .7s cubic-bezier(.22,.68,.32,1.2) infinite; }
        .is-active .sp2 { animation: s2 .7s cubic-bezier(.22,.68,.32,1.2) infinite; }
        .is-active .sp3 { animation: s3 .7s cubic-bezier(.22,.68,.32,1.2) infinite; }
        .is-active .sp4 { animation: s4 .7s cubic-bezier(.22,.68,.32,1.2) infinite; }
      `}</style>
    </div>
  )
}
