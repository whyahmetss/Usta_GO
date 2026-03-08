const statusConfig = {
  pending:     { label: 'Bekliyor',    bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  accepted:    { label: 'Kabul Edildi', bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400' },
  in_progress: { label: 'Devam Ediyor', bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  completed:   { label: 'Tamamlandı',  bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  rated:       { label: 'Değerlendirildi', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  cancelled:   { label: 'İptal',       bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400' },
  rejected:    { label: 'Reddedildi',  bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400' },
  approved:    { label: 'Onaylandı',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  resolved:    { label: 'Çözüldü',     bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  urgent:      { label: 'Acil',        bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400' },
}

export default function StatusBadge({ status, label: customLabel, size = 'sm' }) {
  const config = statusConfig[status?.toLowerCase()] || {
    label: customLabel || status,
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  }

  const sizeClasses = size === 'sm'
    ? 'text-[11px] px-2.5 py-1 gap-1.5'
    : 'text-xs px-3 py-1.5 gap-2'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {customLabel || config.label}
    </span>
  )
}
