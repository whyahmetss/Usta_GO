const statusConfig = {
  pending:     { label: 'Bekliyor',    bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400' },
  accepted:    { label: 'Kabul Edildi', bg: 'bg-blue-500/10',    text: 'text-blue-400',    dot: 'bg-blue-400' },
  in_progress:      { label: 'Devam Ediyor',    bg: 'bg-violet-500/10',  text: 'text-violet-400',  dot: 'bg-violet-400' },
  pending_approval: { label: 'Onay Bekliyor',   bg: 'bg-orange-500/10',  text: 'text-orange-400',  dot: 'bg-orange-400' },
  completed:        { label: 'Tamamlandı',      bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  rated:       { label: 'Değerlendirildi', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  cancelled:   { label: 'İptal',       bg: 'bg-rose-500/10',    text: 'text-rose-400',    dot: 'bg-rose-400' },
  rejected:    { label: 'Reddedildi',  bg: 'bg-rose-500/10',    text: 'text-rose-400',    dot: 'bg-rose-400' },
  approved:    { label: 'Onaylandı',   bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  resolved:    { label: 'Çözüldü',     bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  urgent:      { label: 'Acil',        bg: 'bg-rose-500/10',    text: 'text-rose-400',    dot: 'bg-rose-400' },
}

export default function StatusBadge({ status, label: customLabel, size = 'sm' }) {
  const config = statusConfig[status?.toLowerCase()] || {
    label: customLabel || status,
    bg: 'bg-white/[0.06]',
    text: 'text-zinc-400',
    dot: 'bg-zinc-500',
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
