export default function StatCard({ icon: Icon, label, value, subtitle, color = 'primary', onClick }) {
  const colorMap = {
    primary:  'bg-blue-50   text-[#2563EB]  dark:bg-blue-900/20   dark:text-[#60a5fa]',
    accent:   'bg-teal-50   text-teal-600   dark:bg-teal-900/20   dark:text-teal-400',
    emerald:  'bg-green-50  text-[#22C55E]  dark:bg-green-900/20  dark:text-[#4ade80]',
    amber:    'bg-amber-50  text-[#F59E0B]  dark:bg-amber-900/20  dark:text-[#fbbf24]',
    rose:     'bg-red-50    text-[#EF4444]  dark:bg-red-900/20    dark:text-[#f87171]',
    violet:   'bg-violet-50 text-[#8B5CF6]  dark:bg-violet-900/20 dark:text-[#a78bfa]',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E5E7EB] dark:border-[#334155] shadow-card p-4 ${onClick ? 'cursor-pointer hover:shadow-card-hover active:scale-[0.98] transition-all' : ''}`}
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
