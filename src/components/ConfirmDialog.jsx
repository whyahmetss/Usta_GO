import { useEffect, useRef } from 'react'
import { AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react'

const VARIANTS = {
  danger: { icon: AlertTriangle, iconBg: 'bg-rose-500/10', iconColor: 'text-rose-400', confirmBg: 'bg-rose-500 hover:bg-rose-600', confirmText: 'text-white' },
  warning: { icon: AlertTriangle, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400', confirmBg: 'bg-amber-500 hover:bg-amber-600', confirmText: 'text-white' },
  success: { icon: CheckCircle, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400', confirmBg: 'bg-emerald-500 hover:bg-emerald-600', confirmText: 'text-white' },
  info: { icon: CheckCircle, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400', confirmBg: 'bg-blue-600 hover:bg-blue-700', confirmText: 'text-white' },
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Emin misiniz?',
  description = '',
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgec',
  variant = 'danger',
  loading = false,
  children,
}) {
  const confirmRef = useRef(null)
  const v = VARIANTS[variant] || VARIANTS.danger
  const Icon = v.icon

  useEffect(() => {
    if (open) {
      const handler = (e) => { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', handler)
      setTimeout(() => confirmRef.current?.focus(), 100)
      return () => window.removeEventListener('keydown', handler)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-zinc-900 border border-white/[0.1] rounded-2xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-white/[0.06] transition" aria-label="Kapat">
          <X size={14} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-2xl ${v.iconBg} flex items-center justify-center mb-3`}>
            <Icon size={22} className={v.iconColor} />
          </div>
          <h3 id="confirm-title" className="text-sm font-bold text-white mb-1">{title}</h3>
          {description && <p className="text-[11px] text-zinc-400 mb-1 max-w-xs">{description}</p>}
          {children && <div className="w-full mt-2 mb-1">{children}</div>}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 bg-white/[0.06] text-zinc-300 rounded-xl text-xs font-semibold hover:bg-white/[0.1] transition disabled:opacity-50"
            aria-label={cancelLabel}>
            {cancelLabel}
          </button>
          <button ref={confirmRef} onClick={onConfirm} disabled={loading}
            className={`flex-1 py-2.5 ${v.confirmBg} ${v.confirmText} rounded-xl text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5`}
            aria-label={confirmLabel}>
            {loading ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
