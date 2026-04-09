import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, onBack, rightAction, className = '' }) {
  const navigate = useNavigate()

  return (
    <header className={`sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-b border-white/[0.06] ${className}`}>
      <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
        {onBack !== false ? (
          <button
            onClick={onBack || (() => navigate(-1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.06] transition-colors -ml-1"
          >
            <ArrowLeft size={20} className="text-zinc-400" />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <h1 className="text-base font-semibold text-white absolute left-1/2 -translate-x-1/2">
          {title}
        </h1>
        <div className="flex items-center">
          {rightAction || <div className="w-9" />}
        </div>
      </div>
    </header>
  )
}
