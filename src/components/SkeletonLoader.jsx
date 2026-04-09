export function SkeletonPulse({ className = '' }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded-lg ${className}`} />
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-3 w-2/3" />
          <SkeletonPulse className="h-2.5 w-1/2" />
        </div>
        <SkeletonPulse className="h-6 w-16 rounded-full" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonPulse key={i} className={`h-2.5 ${i === lines - 1 ? 'w-1/3' : i % 2 === 0 ? 'w-full' : 'w-4/5'}`} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="bg-zinc-900 rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="grid gap-4 p-4 border-b border-white/[0.06]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonPulse key={i} className="h-3 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid gap-4 p-4 border-b border-white/[0.03]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, col) => (
            <SkeletonPulse key={col} className={`h-2.5 ${col === 0 ? 'w-3/4' : 'w-full'} rounded`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonKPI({ count = 4 }) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(count, 5)}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-zinc-900 rounded-2xl border border-white/[0.06] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonPulse className="w-9 h-9 rounded-lg" />
            <SkeletonPulse className="w-16 h-7 rounded" />
          </div>
          <SkeletonPulse className="h-6 w-20" />
          <SkeletonPulse className="h-2.5 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  )
}

export default function SkeletonLoader({ type = 'list', ...props }) {
  switch (type) {
    case 'card': return <SkeletonCard {...props} />
    case 'cards': return <SkeletonList {...props} />
    case 'table': return <SkeletonTable {...props} />
    case 'kpi': return <SkeletonKPI {...props} />
    default: return <SkeletonList {...props} />
  }
}
