export default function StatCard({ icon: Icon, label, value, subtitle, color = 'primary', onClick }) {
  const colorMap = {
    primary: 'bg-blue-500/10 text-blue-400',
    accent: 'bg-amber-500/10 text-amber-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
    violet: 'bg-violet-500/10 text-violet-400',
  }

  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 ${onClick ? 'cursor-pointer hover:border-white/[0.1] active:scale-[0.98] transition-all' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color] || colorMap.primary}`}>
        {Icon && <Icon size={20} />}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
      {subtitle && <p className="text-[10px] text-zinc-600 mt-0.5">{subtitle}</p>}
    </div>
  )
}
