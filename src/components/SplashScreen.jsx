import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0)
  // phase 0: logo giriş, 1: tamir efekti, 2: çıkış

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
      {/* Arka plan efekt daireleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-[-40px] w-40 h-40 rounded-full bg-white/5" />
      </div>

      {/* Logo + tamir animasyonu */}
      <div className={`flex flex-col items-center transition-all duration-500 ${phase >= 0 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>

        {/* İkon container */}
        <div className="relative w-28 h-28 mb-6">
          {/* Dış halka döner */}
          <div className={`absolute inset-0 rounded-full border-4 border-white/20 border-t-white/80 ${phase >= 1 ? 'animate-spin' : ''}`}
            style={{ animationDuration: '1s' }}
          />
          {/* İç beyaz kare */}
          <div className="absolute inset-3 bg-white/15 backdrop-blur rounded-3xl flex items-center justify-center">
            <WrenchSvg phase={phase} />
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

      {/* Alt yazı */}
      <p className="absolute bottom-12 text-blue-300 text-xs font-medium opacity-70">
        Hazırlanıyor...
      </p>
    </div>
  )
}

function WrenchSvg({ phase }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`w-14 h-14 text-white transition-transform duration-300 ${phase >= 1 ? 'rotate-[20deg]' : 'rotate-0'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Anahtar (wrench) */}
      <path d="M34 6a8 8 0 0 1 0 12l-4 4L14 38a4 4 0 1 1-4-4l16-16 4-4a8 8 0 0 1 4-8z" fill="white" stroke="none" opacity="0.2" />
      <path d="M36 4c-3.3 0-6 2.7-6 6 0 1.2.4 2.4 1 3.3L10.3 33.7a5 5 0 1 0 4 4L34.7 17c.9.6 2.1 1 3.3 1 3.3 0 6-2.7 6-6 0-1-.3-2-.7-2.8L39 13a2 2 0 0 1-4 0V9.6L33.7 8.3A6 6 0 0 1 36 4z" />
      <circle cx="11" cy="37" r="2" fill="white" stroke="none" />
    </svg>
  )
}
