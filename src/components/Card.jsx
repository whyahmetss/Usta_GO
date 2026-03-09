export default function Card({ children, className = '', onClick, padding = 'p-4' }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E5E7EB] dark:border-[#334155] shadow-card ${padding} ${onClick ? 'cursor-pointer hover:shadow-card-hover active:scale-[0.98] transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
