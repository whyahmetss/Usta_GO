export default function StatCard({ icon: Icon, label, value, subtitle, color = 'primary', onClick }) {
  const colorMap = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2A2A2A] shadow-card p-4 ${onClick ? 'cursor-pointer hover:shadow-card-hover active:scale-[0.98] transition-all' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color] || colorMap.primary}`}>
        {Icon && <Icon size={20} />}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}
