import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({ title, onBack, rightAction, className = '' }) {
  const navigate = useNavigate()

  return (
    <header className={`sticky top-0 z-40 bg-white/95 dark:bg-[#0d0d0d]/95 backdrop-blur-lg border-b border-gray-200/80 dark:border-white/[0.07] ${className}`}>
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {onBack !== false ? (
          <button
            onClick={onBack || (() => navigate(-1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors -ml-1"
          >
            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 absolute left-1/2 -translate-x-1/2">
          {title}
        </h1>
        <div className="flex items-center">
          {rightAction || <div className="w-9" />}
        </div>
      </div>
    </header>
  )
}
