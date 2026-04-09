export default function Card({ children, className = '', onClick, padding = 'p-4' }) {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900 rounded-2xl border border-white/[0.06] ${padding} ${onClick ? 'cursor-pointer hover:border-white/[0.12] hover:bg-zinc-800/80 active:scale-[0.98] transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
