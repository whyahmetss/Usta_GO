export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" role="status" aria-label={title || 'Veri yok'}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4" aria-hidden="true">
          {typeof Icon === 'string'
            ? <span className="text-2xl text-zinc-600">{Icon}</span>
            : <Icon size={28} className="text-zinc-600" />
          }
        </div>
      )}
      {title && <h3 className="text-base font-semibold text-white mb-1">{title}</h3>}
      {description && <p className="text-sm text-zinc-500 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
