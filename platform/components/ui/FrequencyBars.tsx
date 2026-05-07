'use client'

export function FrequencyBars({ active = true, size = 'md' }: { active?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const h = size === 'sm' ? 'h-3' : size === 'lg' ? 'h-8' : 'h-5'
  const w = size === 'sm' ? 'w-0.5' : size === 'lg' ? 'w-1.5' : 'w-1'
  const count = size === 'sm' ? 3 : 5

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${w} ${h} rounded-full ${active ? 'bg-weaver freq-bar' : 'bg-white/20'}`}
          style={active ? { animationDelay: `${i * 0.15}s` } : {}}
        />
      ))}
    </div>
  )
}
