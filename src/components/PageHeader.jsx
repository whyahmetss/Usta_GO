import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, onBack, rightAction, className = '' }) {
  const navigate = useNavigate()

  return (
    <header className={`sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 ${className}`}>
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {onBack !== false ? (
          <button
            onClick={onBack || (() => navigate(-1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors -ml-1"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <h1 className="text-base font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2">
          {title}
        </h1>
        <div className="flex items-center">
          {rightAction || <div className="w-9" />}
        </div>
      </div>
    </header>
  )
}
