export default function StatCard({ icon: Icon, label, value, subtitle, color = 'primary', onClick }) {
  const colorMap = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    accent: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    emerald: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    amber: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    rose: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    violet: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1f2937] rounded-2xl border border-gray-100 dark:border-[#374151] shadow-card p-4 ${onClick ? 'cursor-pointer hover:shadow-card-hover active:scale-[0.98] transition-all' : ''}`}
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
