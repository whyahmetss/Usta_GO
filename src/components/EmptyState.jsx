export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1f1f1f] flex items-center justify-center mb-4">
          {typeof Icon === 'function'
            ? <Icon size={28} className="text-gray-400" />
            : <span className="text-2xl text-gray-400">{Icon}</span>
          }
        </div>
      )}
      {title && <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>}
      {description && <p className="text-sm text-gray-500 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
