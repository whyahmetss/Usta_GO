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

        {/* Çekiç ikonu — kutu yok */}
        <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
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

      <svg className="hammer" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="handle" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#B8783D" />
            <stop offset="30%" stopColor="#D4A05A" />
            <stop offset="55%" stopColor="#E8C080" />
            <stop offset="75%" stopColor="#D4A05A" />
            <stop offset="100%" stopColor="#9A6830" />
          </linearGradient>
          <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E0E0E0" />
            <stop offset="25%" stopColor="#C8C8C8" />
            <stop offset="50%" stopColor="#A8A8A8" />
            <stop offset="75%" stopColor="#B8B8B8" />
            <stop offset="100%" stopColor="#909090" />
          </linearGradient>
          <linearGradient id="metalFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D0D0D0" />
            <stop offset="50%" stopColor="#A0A0A0" />
            <stop offset="100%" stopColor="#888888" />
          </linearGradient>
          <linearGradient id="neck" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#B0B0B0" />
            <stop offset="50%" stopColor="#D0D0D0" />
            <stop offset="100%" stopColor="#999" />
          </linearGradient>
        </defs>

        <g transform="rotate(45, 50, 50)">
          {/* Sap */}
          <rect x="44" y="38" width="12" height="58" rx="5.5" fill="url(#handle)" />
          <rect x="47" y="40" width="3" height="54" rx="1.5" fill="#E8C888" opacity="0.35" />
          <rect x="44.5" y="92" width="11" height="4" rx="2" fill="#8B6530" />

          {/* Sap-baş metal bağlantı */}
          <rect x="43" y="34" width="14" height="8" rx="2" fill="url(#neck)" />
          <rect x="44" y="35" width="12" height="1.5" rx="0.7" fill="#E8E8E8" opacity="0.4" />

          {/* Çekiç başı ana gövde */}
          <rect x="18" y="12" width="64" height="24" rx="4" fill="url(#metal)" />

          {/* Üst kenar parlaklık */}
          <rect x="20" y="13" width="60" height="8" rx="3" fill="#D8D8D8" opacity="0.5" />
          <rect x="24" y="15" width="52" height="2.5" rx="1.2" fill="#F0F0F0" opacity="0.3" />

          {/* Vurma yüzeyi (sağ) - düz kesim */}
          <rect x="76" y="10" width="10" height="28" rx="2.5" fill="url(#metalFace)" />
          <rect x="82" y="13" width="2.5" height="22" rx="1.2" fill="#C8C8C8" opacity="0.4" />
          <rect x="76" y="10" width="2" height="28" rx="1" fill="#808080" opacity="0.3" />

          {/* Sol taraf yuvarlak bitim */}
          <rect x="14" y="12" width="10" height="24" rx="4" fill="url(#metalFace)" />

          {/* Alt kenar gölge */}
          <rect x="18" y="32" width="64" height="3" rx="1.5" fill="#808080" opacity="0.3" />
        </g>
      </svg>

      <style>{`
        .hammer-root {
          position: relative;
          width: 80px; height: 80px;
          display: flex; align-items: center; justify-content: center;
        }
        .hammer {
          width: 80px; height: 80px;
          transform-origin: 50% 72%;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.35));
        }

        @keyframes strike {
          0%   { transform: rotate(0deg); }
          18%  { transform: rotate(-20deg); }
          46%  { transform: rotate(16deg); }
          54%  { transform: rotate(18deg); }
          68%  { transform: rotate(-3deg); }
          84%  { transform: rotate(1deg); }
          100% { transform: rotate(0deg); }
        }
        .is-active .hammer {
          animation: strike 0.8s cubic-bezier(0.22, 0.68, 0.32, 1.12) infinite;
        }

        .glow {
          position: absolute; bottom: 6px; right: 4px;
          width: 16px; height: 16px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,220,100,0.9) 0%, transparent 70%);
          transform: scale(0); opacity: 0; pointer-events: none;
        }
        @keyframes flash {
          0%,42% { transform: scale(0); opacity: 0; }
          50%    { transform: scale(2); opacity: 1; }
          62%    { transform: scale(3); opacity: 0.5; }
          76%    { transform: scale(3.5); opacity: 0; }
          100%   { transform: scale(0); opacity: 0; }
        }
        .is-active .glow { animation: flash 0.8s ease-out infinite; }

        .sp {
          position: absolute; bottom: 10px; right: 8px;
          width: 3px; height: 3px; border-radius: 50%;
          background: #FFE070; opacity: 0; pointer-events: none;
        }
        @keyframes s1 { 0%,44%{transform:translate(0,0);opacity:0}50%{opacity:1}74%{transform:translate(10px,12px);opacity:0}100%{opacity:0} }
        @keyframes s2 { 0%,44%{transform:translate(0,0);opacity:0}50%{opacity:1}74%{transform:translate(-6px,14px);opacity:0}100%{opacity:0} }
        @keyframes s3 { 0%,44%{transform:translate(0,0);opacity:0}52%{opacity:.8}74%{transform:translate(14px,6px);opacity:0}100%{opacity:0} }

        .is-active .sp1 { animation: s1 .8s ease-out infinite; }
        .is-active .sp2 { animation: s2 .8s ease-out infinite; }
        .is-active .sp3 { animation: s3 .8s ease-out infinite; }
      `}</style>
    </div>
  )
}
