export default function Card({ children, className = '', onClick, padding = 'p-4' }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1a2332] rounded-2xl border border-gray-100 dark:border-white/[0.07] shadow-card ${padding} ${onClick ? 'cursor-pointer hover:shadow-card-hover active:scale-[0.98] transition-all' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
