import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 2000)
    const t3 = setTimeout(() => onDone?.(), 2600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 transition-opacity duration-500 ${phase === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Arka plan daireler */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-[-40px] w-40 h-40 rounded-full bg-white/5" />
      </div>

      <div className={`flex flex-col items-center transition-all duration-500 ${phase >= 0 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

        {/* İkon container */}
        <div className="relative w-28 h-28 mb-6">
          {/* Dönen dış halka */}
          <div
            className={`absolute inset-0 rounded-full border-4 border-white/20 border-t-white/80 ${phase >= 1 ? 'animate-spin' : ''}`}
            style={{ animationDuration: '1s' }}
          />
          {/* İç kart */}
          <div className="absolute inset-3 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center overflow-visible">
            <HammerIcon active={phase >= 1} />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white tracking-tight mb-1">Usta Go</h1>
        <p className="text-blue-200 text-sm font-medium">Profesyonel Ev Hizmetleri</p>

        {/* İlerleme çubuğu */}
        <div className="mt-8 w-40 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all ease-in-out"
            style={{
              width: phase === 0 ? '20%' : phase === 1 ? '80%' : '100%',
              transitionDuration: phase === 1 ? '1.2s' : '0.4s',
            }}
          />
        </div>
      </div>

      <p className="absolute bottom-12 text-blue-300 text-xs font-medium opacity-70">
        Hazırlanıyor...
      </p>
    </div>
  )
}

function HammerIcon({ active }) {
  return (
    <div className={`hammer-wrapper ${active ? 'hammer-active' : ''}`}>

      {/* Kıvılcım parçacıkları — vuruş anında */}
      <span className="spark spark-1" />
      <span className="spark spark-2" />
      <span className="spark spark-3" />
      <span className="spark spark-4" />
      <span className="spark spark-5" />

      {/* Impact glow halkası */}
      <span className="impact-ring" />

      {/* Çekiç SVG */}
      <svg
        viewBox="0 0 48 48"
        className="hammer-svg"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Sap */}
        <path
          d="M10.5 37.5L30 18"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Baş gölge */}
        <rect
          x="28" y="6" width="14" height="14" rx="3"
          fill="rgba(255,255,255,0.15)"
          stroke="none"
        />
        {/* Baş */}
        <rect
          x="28" y="6" width="14" height="14" rx="3"
          stroke="white"
          strokeWidth="2.5"
        />
        {/* Baş üst vurgu çizgisi */}
        <line x1="30" y1="9" x2="40" y2="9" stroke="white" strokeWidth="1" opacity="0.5" />
      </svg>

      <style>{`
        /* ── Wrapper: transform-origin sol alt (vurma noktası) ── */
        .hammer-wrapper {
          position: relative;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform-origin: 30% 70%;
        }

        .hammer-svg {
          width: 56px;
          height: 56px;
          transform-origin: 30% 70%;
          filter: drop-shadow(0 0 0px rgba(255,220,50,0));
        }

        /* ── Ana vuruş animasyonu ── */
        @keyframes hammerHit {
          /* 1. Geri çekil — yukarı/sağa hafifçe kalk */
          0%   { transform: rotate(0deg) translateY(0);                 filter: drop-shadow(0 0 0px rgba(255,220,50,0)); }
          18%  { transform: rotate(-15deg) translate(3px, -5px);        filter: drop-shadow(0 0 0px rgba(255,220,50,0)); }
          /* 2. Hızlı vuruş aşağı-sola */
          48%  { transform: rotate(12deg) translate(-2px, 4px);         filter: drop-shadow(0 0 12px rgba(255,200,50,0.95)); }
          /* 3. Vuruş anı — en altta */
          55%  { transform: rotate(14deg) translate(-3px, 5px);         filter: drop-shadow(0 0 18px rgba(255,160,20,1)); }
          /* 4. Elastik zıplama */
          68%  { transform: rotate(-4deg) translate(1px, -3px);         filter: drop-shadow(0 0 5px rgba(255,200,50,0.4)); }
          80%  { transform: rotate(3deg) translateY(1px);               filter: drop-shadow(0 0 2px rgba(255,200,50,0.15)); }
          /* 5. Başlangıç */
          100% { transform: rotate(0deg) translateY(0);                 filter: drop-shadow(0 0 0px rgba(255,220,50,0)); }
        }

        .hammer-active .hammer-svg {
          animation: hammerHit 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          animation-delay: 0.1s;
        }

        /* ── Impact glow halkası ── */
        .impact-ring {
          position: absolute;
          bottom: 4px;
          left: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,200,50,0.8) 0%, transparent 70%);
          transform: scale(0);
          opacity: 0;
          pointer-events: none;
        }

        @keyframes impactGlow {
          0%   { transform: scale(0);   opacity: 0; }
          50%  { transform: scale(0);   opacity: 0; }
          55%  { transform: scale(1.8); opacity: 1; }
          70%  { transform: scale(2.8); opacity: 0.5; }
          80%  { transform: scale(3.5); opacity: 0; }
          100% { transform: scale(0);   opacity: 0; }
        }

        .hammer-active .impact-ring {
          animation: impactGlow 0.75s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
          animation-delay: 0.1s;
        }

        /* ── Kıvılcım parçacıkları ── */
        .spark {
          position: absolute;
          bottom: 6px;
          left: 8px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #FFD700;
          opacity: 0;
          pointer-events: none;
        }

        @keyframes spark1 {
          0%,48% { transform: translate(0,0) scale(1);   opacity: 0; }
          55%     { transform: translate(0,0) scale(1.2); opacity: 1; }
          80%     { transform: translate(-10px, -12px) scale(0.3); opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes spark2 {
          0%,48% { transform: translate(0,0) scale(1);   opacity: 0; }
          55%     { transform: translate(0,0) scale(1.2); opacity: 1; }
          80%     { transform: translate(10px, -14px) scale(0.3); opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes spark3 {
          0%,48% { transform: translate(0,0) scale(1);   opacity: 0; }
          55%     { transform: translate(0,0) scale(1);   opacity: 0.9; }
          80%     { transform: translate(-14px, -6px) scale(0.2); opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes spark4 {
          0%,48% { transform: translate(0,0) scale(1);   opacity: 0; }
          55%     { transform: translate(0,0) scale(1.1); opacity: 1; }
          80%     { transform: translate(14px, -8px) scale(0.2); opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes spark5 {
          0%,48% { transform: translate(0,0) scale(1);   opacity: 0; }
          56%     { transform: translate(0,0) scale(0.9); opacity: 0.8; background: #FF8C00; }
          80%     { transform: translate(2px, -16px) scale(0.1); opacity: 0; }
          100%    { opacity: 0; }
        }

        .hammer-active .spark-1 { animation: spark1 0.75s cubic-bezier(0.25,0.46,0.45,0.94) infinite; animation-delay: 0.1s; }
        .hammer-active .spark-2 { animation: spark2 0.75s cubic-bezier(0.25,0.46,0.45,0.94) infinite; animation-delay: 0.1s; }
        .hammer-active .spark-3 { animation: spark3 0.75s cubic-bezier(0.25,0.46,0.45,0.94) infinite; animation-delay: 0.1s; }
        .hammer-active .spark-4 { animation: spark4 0.75s cubic-bezier(0.25,0.46,0.45,0.94) infinite; animation-delay: 0.1s; }
        .hammer-active .spark-5 { animation: spark5 0.75s cubic-bezier(0.25,0.46,0.45,0.94) infinite; animation-delay: 0.12s; }
      `}</style>
    </div>
  )
}
