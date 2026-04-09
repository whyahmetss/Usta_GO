import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="relative mb-6">
          <p className="text-[120px] font-black text-white/[0.03] leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center">
              <Search size={36} className="text-blue-400" />
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Sayfa Bulunamadi</h1>
        <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
          Aradaginiz sayfa mevcut degil, tasinmis veya kaldirilmis olabilir.
        </p>

        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] text-zinc-300 rounded-xl text-xs font-semibold hover:bg-white/[0.1] transition active:scale-[0.98]">
            <ArrowLeft size={14} /> Geri Don
          </button>
          <button onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition active:scale-[0.98]">
            <Home size={14} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
